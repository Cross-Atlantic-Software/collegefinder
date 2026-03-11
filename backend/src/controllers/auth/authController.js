const User = require('../../models/user/User');
const Otp = require('../../models/user/Otp');
const { generateOTP, getOTPExpiry } = require('../../../utils/auth/otpGenerator');
const { sendOTPEmail } = require('../../../utils/email/emailService');
const { generateToken } = require('../../../utils/auth/jwt');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const { downloadAndUploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');

class AuthController {
  /**
   * Send OTP to user's email
   * POST /api/auth/send-otp
   */
  static async sendOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;
      const otpLength = parseInt(process.env.OTP_LENGTH) || 6;
      const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

      // Check rate limiting (max 3 OTPs per 10 minutes)
      const recentOtpCount = await Otp.getRecentOtpCount(email, 10);
      if (recentOtpCount >= 3) {
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. Please wait before requesting again.'
        });
      }

      // Find or create user
      let user = await User.findByEmail(email);
      if (!user) {
        user = await User.create(email);
      }

      // Generate OTP
      const code = generateOTP(otpLength);
      const expiresAt = getOTPExpiry(otpExpiryMinutes);

      // Invalidate previous unused OTPs
      await Otp.invalidateUserOtps(user.id, email);

      // Create new OTP
      await Otp.create(user.id, email, code, expiresAt);

      // Send OTP email (non-blocking in development)
      try {
        await sendOTPEmail(email, code);
      } catch (emailError) {
        throw emailError;
      }

      res.json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          email,
          expiresIn: otpExpiryMinutes * 60 // seconds
        }
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
  }

  /**
   * Verify OTP and authenticate user
   * POST /api/auth/verify-otp
   */
  static async verifyOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, code } = req.body;

      // Find valid OTP
      const otpRecord = await Otp.findByCodeAndEmail(code, email);
      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP code'
        });
      }

      // Get user
      const user = await User.findById(otpRecord.user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Mark OTP as used
      await Otp.markAsUsed(otpRecord.id);

      // Mark email as verified
      await User.markEmailAsVerified(user.id);

      // Update last login
      await User.updateLastLogin(user.id);

      // Get fresh user data first
      const updatedUser = await User.findById(user.id);
      
      // Debug: Log raw database value
      console.log('🔍 verifyOTP - User ID:', updatedUser.id);
      console.log('🔍 verifyOTP - Raw onboarding_completed from DB:', updatedUser.onboarding_completed);
      console.log('🔍 verifyOTP - Type of onboarding_completed:', typeof updatedUser.onboarding_completed);
      console.log('🔍 verifyOTP - Is it exactly true?', updatedUser.onboarding_completed === true);
      console.log('🔍 verifyOTP - Is it truthy?', !!updatedUser.onboarding_completed);
      
      // Check database value first - if it's already true, trust it (unless we need to verify)
      let dbOnboardingCompleted = false;
      const dbValue = updatedUser.onboarding_completed;
      if (dbValue !== null && dbValue !== undefined) {
        dbOnboardingCompleted = dbValue === true || dbValue === 't' || dbValue === 1 || dbValue === 'true';
      }
      console.log('🔍 verifyOTP - DB value converted to boolean:', dbOnboardingCompleted);
      
      // Only verify if DB says false/null - if DB says true, trust it
      let onboardingCompleted = dbOnboardingCompleted;
      if (!dbOnboardingCompleted) {
        // Only verify if database says it's not completed
        console.log('🔍 verifyOTP - DB says not completed, verifying actual data...');
        const actualOnboardingStatus = await User.verifyAndUpdateOnboardingStatus(user.id);
        console.log('🔍 verifyOTP - actualOnboardingStatus (from check):', actualOnboardingStatus);
        onboardingCompleted = actualOnboardingStatus;
        
        // Get fresh user data after potential update
        const finalUser = await User.findById(user.id);
        console.log('🔍 verifyOTP - Final onboarding_completed from DB after update:', finalUser.onboarding_completed);
      } else {
        console.log('🔍 verifyOTP - DB says completed, trusting database value');
      }
      
      console.log('🔍 verifyOTP - Final onboardingCompleted value to send:', onboardingCompleted);

      // Generate JWT token
      const tokenPayload = {
        userId: updatedUser.id,
        email: updatedUser.email
      };
      const token = generateToken(tokenPayload);

      // Ensure we send a proper boolean (not string or number)
      const finalOnboardingCompleted = onboardingCompleted === true;

      const responseData = {
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name || null,
            onboarding_completed: finalOnboardingCompleted, // Explicitly send as boolean
            createdAt: updatedUser.created_at
          },
          token
        }
      };

      console.log('🔍 verifyOTP - Sending response:');
      console.log('  - onboarding_completed value:', finalOnboardingCompleted);
      console.log('  - onboarding_completed type:', typeof finalOnboardingCompleted);
      console.log('  - Full response:', JSON.stringify(responseData, null, 2));

      res.json(responseData);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify OTP. Please try again.'
      });
    }
  }

  /**
   * Resend OTP
   * POST /api/auth/resend-otp
   */
  static async resendOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found. Please register first.'
        });
      }

      // Use the same sendOTP logic
      return AuthController.sendOTP(req, res);
    } catch (error) {
      console.error('Error resending OTP:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend OTP. Please try again.'
      });
    }
  }

  /**
   * Get current authenticated user
   * GET /api/auth/me
   */
  static async getMe(req, res) {
    try {
      // User is attached by authenticate middleware
      const user = req.user;

      // Verify and update onboarding status based on actual data
      // This ensures the flag matches the actual completion state
      const actualOnboardingStatus = await User.verifyAndUpdateOnboardingStatus(user.id);
      
      // Get fresh user data after potential update
      const updatedUser = await User.findById(user.id);

      // Ensure onboarding_completed is properly converted to boolean
      // PostgreSQL may return it as true/false, 't'/'f', or 1/0
      let onboardingCompleted = false;
      if (updatedUser.onboarding_completed !== null && updatedUser.onboarding_completed !== undefined) {
        onboardingCompleted = updatedUser.onboarding_completed === true || 
                              updatedUser.onboarding_completed === 't' || 
                              updatedUser.onboarding_completed === 1 ||
                              updatedUser.onboarding_completed === 'true';
      }

      // Use the verified status if different
      if (actualOnboardingStatus !== onboardingCompleted) {
        onboardingCompleted = actualOnboardingStatus;
      }

      // Debug logging
      console.log('🔍 getMe - User ID:', updatedUser.id);
      console.log('🔍 getMe - onboarding_completed (raw):', updatedUser.onboarding_completed, 'Type:', typeof updatedUser.onboarding_completed);
      console.log('🔍 getMe - onboarding_completed (converted):', onboardingCompleted);
      console.log('🔍 getMe - actualOnboardingStatus (verified):', actualOnboardingStatus);

      res.json({
        success: true,
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            profile_photo: updatedUser.profile_photo,
            onboarding_completed: onboardingCompleted,
            createdAt: updatedUser.created_at,
            lastLogin: updatedUser.last_login
          }
        }
      });
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user information'
      });
    }
  }

  /**
   * Update user profile (name)
   * PUT /api/auth/profile
   */
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name } = req.body;
      const userId = req.user.id;

      const updatedUser = await User.updateName(userId, name);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            createdAt: updatedUser.created_at
          }
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  /**
   * Initiate Google OAuth (redirect to Google)
   * GET /api/auth/google
   */
  static async googleAuth(req, res) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        return res.status(500).json({
          success: false,
          message: 'Google OAuth not configured'
        });
      }

      const client = new OAuth2Client(clientId, clientSecret, redirectUri);

      // Generate the authorization URL
      const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'openid'
        ],
        prompt: 'consent'
      });

      // Redirect to Google
      res.redirect(authUrl);
    } catch (error) {
      console.error('Error initiating Google OAuth:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate Google authentication'
      });
    }
  }

  /**
   * Google OAuth callback (handles redirect from Google)
   * GET /api/auth/google/callback
   */
  static async googleCallback(req, res) {
    try {
      const { code } = req.query;

      if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      if (!clientId || !clientSecret || !redirectUri) {
        return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
      }

      const client = new OAuth2Client(clientId, clientSecret, redirectUri);

      // Exchange authorization code for tokens
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      // Get user info from Google
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      const { 
        sub: googleId, 
        email, 
        name, 
        picture,
        given_name: firstName,
        family_name: lastName,
        email_verified: emailVerified
      } = payload;

      if (!email) {
        return res.redirect(`${frontendUrl}/login?error=no_email`);
      }

      // Download and upload Google profile picture to S3 (if provided)
      let profilePhotoUrl = null;
      if (picture) {
        try {
          // Generate unique filename
          const fileName = `google-profile-${googleId}-${Date.now()}`;
          profilePhotoUrl = await downloadAndUploadToS3(picture, fileName, 'profile-photos');
        } catch (error) {
          console.error('Error downloading/uploading Google profile picture:', error);
          // Continue without profile photo if download fails
          profilePhotoUrl = null;
        }
      }

      // Check if user exists by Google ID
      let user = await User.findByGoogleId(googleId);

      if (!user) {
        // Check if user exists by email (might have signed up with email before)
        user = await User.findByEmail(email);
        
        if (user) {
          // Delete old profile photo from S3 if exists and we're updating with new one
          if (user.profile_photo && profilePhotoUrl) {
            try {
              await deleteFromS3(user.profile_photo);
            } catch (error) {
              console.error('Error deleting old profile photo:', error);
            }
          }
          
          // Link Google account to existing user and update profile data
          await User.linkGoogleAccount(user.id, googleId);
          // Update profile with Google data if fields are empty
          await User.updateFromGoogle(user.id, {
            firstName: firstName || null,
            lastName: lastName || null,
            name: name || null,
            profilePhoto: profilePhotoUrl || null,
            emailVerified: emailVerified || false
          });
          user = await User.findById(user.id);
        } else {
          // Create new user with Google OAuth
          user = await User.createWithGoogle({
            email,
            name: name || null,
            firstName: firstName || null,
            lastName: lastName || null,
            googleId,
            profilePhoto: profilePhotoUrl || null,
            emailVerified: emailVerified || false
          });
        }
      } else {
        // Delete old profile photo from S3 if exists and we're updating with new one
        if (user.profile_photo && profilePhotoUrl) {
          try {
            await deleteFromS3(user.profile_photo);
          } catch (error) {
            console.error('Error deleting old profile photo:', error);
          }
        }
        
        // Update existing Google user's profile if data changed
        await User.updateFromGoogle(user.id, {
          firstName: firstName || null,
          lastName: lastName || null,
          name: name || null,
          profilePhoto: profilePhotoUrl || null,
          emailVerified: emailVerified || false
        });
        user = await User.findById(user.id);
      }

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate JWT token
      const tokenPayload = {
        userId: user.id,
        email: user.email
      };
      const token = generateToken(tokenPayload);

      // Redirect to frontend with token
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&success=true`);
    } catch (error) {
      console.error('Error in Google OAuth callback:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }

  /**
   * Initiate Facebook OAuth (redirect to Facebook)
   * GET /api/auth/facebook
   */
  static async facebookAuth(req, res) {
    try {
      const appId = process.env.META_APP_ID;
      const redirectUri = process.env.META_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/auth/facebook/callback`;

      if (!appId) {
        return res.status(500).json({
          success: false,
          message: 'Facebook OAuth not configured',
        });
      }

      // Facebook OAuth URL with email and public_profile permissions
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${encodeURIComponent(
        appId
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile&response_type=code`;

      return res.redirect(authUrl);
    } catch (error) {
      console.error('Error initiating Facebook OAuth:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate Facebook authentication',
      });
    }
  }

  /**
   * Facebook OAuth callback
   * GET /api/auth/facebook/callback
   */
  static async facebookCallback(req, res) {
    try {
      const { code, error: fbError } = req.query;
      const appId = process.env.META_APP_ID;
      const appSecret = process.env.META_APP_SECRET;
      const redirectUri = process.env.META_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/auth/facebook/callback`;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      if (fbError || !code) {
        console.error('Facebook OAuth error:', fbError);
        return res.redirect(`${frontendUrl}/login?error=facebook_oauth_failed`);
      }

      if (!appId || !appSecret) {
        return res.redirect(`${frontendUrl}/login?error=facebook_oauth_not_configured`);
      }

      // Exchange code for access token
      const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${encodeURIComponent(
        appId
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(
        appSecret
      )}&code=${encodeURIComponent(code)}`;

      const tokenResponse = await fetch(tokenUrl);

      if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        console.error('Facebook token exchange failed:', tokenResponse.status, errorBody);
        return res.redirect(`${frontendUrl}/login?error=facebook_oauth_failed`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        console.error('Invalid Facebook token response:', tokenData);
        return res.redirect(`${frontendUrl}/login?error=facebook_oauth_failed`);
      }

      // Fetch user profile from Facebook Graph API
      const profileResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,email,first_name,last_name,picture.type(large)&access_token=${encodeURIComponent(
          accessToken
        )}`
      );

      if (!profileResponse.ok) {
        const errorBody = await profileResponse.text();
        console.error('Facebook profile fetch failed:', profileResponse.status, errorBody);
        return res.redirect(`${frontendUrl}/login?error=facebook_profile_failed`);
      }

      const profile = await profileResponse.json();
      const facebookId = profile.id;
      const name = profile.name;
      const firstName = profile.first_name;
      const lastName = profile.last_name;
      const pictureUrl = profile.picture?.data?.url || null;
      
      // Use Facebook email if provided, otherwise null
      // User can add their real email later in profile section and verify it
      const email = profile.email || null;

      // Download and upload Facebook profile picture to S3 (if provided)
      let profilePhotoUrl = null;
      if (pictureUrl) {
        try {
          const fileName = `facebook-profile-${facebookId}-${Date.now()}`;
          profilePhotoUrl = await downloadAndUploadToS3(pictureUrl, fileName, 'profile-photos');
        } catch (error) {
          console.error('Error downloading/uploading Facebook profile picture:', error);
          profilePhotoUrl = null;
        }
      }

      // Check if user exists by Facebook ID
      let user = await User.findByFacebookId(facebookId);

      if (!user) {
        // Check if user exists by email (only if email is provided)
        if (email) {
          user = await User.findByEmail(email);
        }

        if (user) {
          // Delete old profile photo from S3 if exists and we're updating with new one
          if (user.profile_photo && profilePhotoUrl) {
            try {
              await deleteFromS3(user.profile_photo);
            } catch (error) {
              console.error('Error deleting old profile photo:', error);
            }
          }

          // Link Facebook account to existing user
          await User.linkFacebookAccount(user.id, facebookId);
          await User.updateFromFacebook(user.id, {
            firstName: firstName || null,
            lastName: lastName || null,
            name: name || null,
            profilePhoto: profilePhotoUrl,
          });
          user = await User.findById(user.id);
        } else {
          // Create new user with Facebook data (email can be null)
          user = await User.createWithFacebook({
            email,
            name: name || null,
            firstName: firstName || null,
            lastName: lastName || null,
            facebookId,
            profilePhoto: profilePhotoUrl,
          });
        }
      } else {
        // Delete old profile photo from S3 if exists and we're updating with new one
        if (user.profile_photo && profilePhotoUrl) {
          try {
            await deleteFromS3(user.profile_photo);
          } catch (error) {
            console.error('Error deleting old profile photo:', error);
          }
        }

        // Update existing Facebook user's profile
        await User.updateFromFacebook(user.id, {
          firstName: firstName || null,
          lastName: lastName || null,
          name: name || null,
          profilePhoto: profilePhotoUrl,
        });
        user = await User.findById(user.id);
      }

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate JWT token
      const tokenPayload = {
        userId: user.id,
        email: user.email || null,
        facebookId: user.facebook_id,
      };
      const token = generateToken(tokenPayload);

      // Redirect to frontend with token
      return res.redirect(`${frontendUrl}/auth/callback?token=${token}&success=true`);
    } catch (error) {
      console.error('Error in Facebook OAuth callback:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=facebook_oauth_failed`);
    }
  }
}

module.exports = AuthController;

