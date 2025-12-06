const User = require('../../models/user/User');
const Otp = require('../../models/user/Otp');
const { generateOTP, getOTPExpiry } = require('../../../utils/auth/otpGenerator');
const { sendOTPEmail } = require('../../../utils/email/emailService');
const { generateToken } = require('../../../utils/auth/jwt');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');

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

      // Generate JWT token
      const tokenPayload = {
        userId: user.id,
        email: user.email
      };
      const token = generateToken(tokenPayload);

      res.json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name || null,
            createdAt: user.created_at
          },
          token
        }
      });
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

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            profile_photo: user.profile_photo,
            onboarding_completed: user.onboarding_completed || false,
            createdAt: user.created_at,
            lastLogin: user.last_login
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

      // Check if user exists by Google ID
      let user = await User.findByGoogleId(googleId);

      if (!user) {
        // Check if user exists by email (might have signed up with email before)
        user = await User.findByEmail(email);
        
        if (user) {
          // Link Google account to existing user and update profile data
          await User.linkGoogleAccount(user.id, googleId);
          // Update profile with Google data if fields are empty
          await User.updateFromGoogle(user.id, {
            firstName: firstName || null,
            lastName: lastName || null,
            name: name || null,
            profilePhoto: picture || null,
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
            profilePhoto: picture || null,
            emailVerified: emailVerified || false
          });
        }
      } else {
        // Update existing Google user's profile if data changed
        await User.updateFromGoogle(user.id, {
          firstName: firstName || null,
          lastName: lastName || null,
          name: name || null,
          profilePhoto: picture || null,
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
}

module.exports = AuthController;

