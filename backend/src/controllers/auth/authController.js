const User = require('../../models/user/User');
const Otp = require('../../models/user/Otp');
const { generateOTP, getOTPExpiry } = require('../../../utils/auth/otpGenerator');
const { sendOTPEmail, sendPasswordResetEmail } = require('../../../utils/email/emailService');
const crypto = require('crypto');
const { generateToken } = require('../../../utils/auth/jwt');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const { downloadAndUploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');
const Referral = require('../../models/referral/Referral');
const bcrypt = require('bcryptjs');

class AuthController {
  static normalizeOnboardingCompleted(raw) {
    return raw === true || raw === 't' || raw === 1 || raw === 'true';
  }

  /** PG booleans / strings from some drivers */
  static truthyEmailVerified(raw) {
    if (raw === null || raw === undefined) return false;
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'string') {
      const lower = raw.toLowerCase().trim();
      return lower === 't' || lower === 'true' || lower === '1';
    }
    if (typeof raw === 'number') return raw === 1;
    return false;
  }

  static buildAuthResponseUser(user) {
    return {
      id: user.id,
      user_code: user.user_code || null,
      email: user.email,
      name: user.name || null,
      profile_photo: user.profile_photo || null,
      onboarding_completed: AuthController.normalizeOnboardingCompleted(user.onboarding_completed),
      createdAt: user.created_at,
      has_password: Boolean(user && user.password_hash)
    };
  }

  static async issueAuthToken(user) {
    const tokenPayload = { userId: user.id, email: user.email };
    return generateToken(tokenPayload);
  }

  /**
   * Start signup flow (email + password) and send OTP.
   * Existing verified users must use password login.
   */
  static async startSignup(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }
      const { email, password } = req.body;
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const otpLength = parseInt(process.env.OTP_LENGTH) || 6;
      const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

      let user = await User.findByEmail(normalizedEmail);
      if (user && user.email_verified) {
        return res.status(409).json({
          success: false,
          message: 'Email is already verified. Please login with password.'
        });
      }

      const passwordHash = await bcrypt.hash(String(password), 12);
      if (!user) user = await User.createWithPassword(normalizedEmail, passwordHash);
      else user = await User.setPasswordHash(user.id, passwordHash);

      const recentOtpCount = await Otp.getRecentOtpCount(normalizedEmail, 10);
      if (recentOtpCount >= 3) {
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. Please wait before requesting again.'
        });
      }

      const code = generateOTP(otpLength);
      const expiresAt = getOTPExpiry(otpExpiryMinutes);
      await Otp.invalidateUserOtps(user.id, normalizedEmail);
      await Otp.create(user.id, normalizedEmail, code, expiresAt);
      await sendOTPEmail(normalizedEmail, code);

      return res.json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          email: normalizedEmail,
          expiresIn: otpExpiryMinutes * 60,
          requiresOtp: true
        }
      });
    } catch (error) {
      console.error('Error starting signup:', error);
      return res.status(500).json({ success: false, message: 'Failed to start signup. Please try again.' });
    }
  }

  /**
   * Login with email + password (for already verified users).
   */
  static async loginWithPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }
      const { email, password } = req.body;
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const user = await User.findByEmail(normalizedEmail);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Account not found. Please sign up first.' });
      }
      if (!user.email_verified) {
        return res.status(403).json({
          success: false,
          message: 'Email is not verified yet. Please complete signup verification.'
        });
      }
      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          message: 'Password is not set for this account. Please reset or sign up again.'
        });
      }

      const ok = await bcrypt.compare(String(password), user.password_hash);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      await User.updateLastLogin(user.id);
      const updatedUser = await User.findById(user.id);
      const token = await AuthController.issueAuthToken(updatedUser);
      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: AuthController.buildAuthResponseUser(updatedUser),
          token,
          requiresOtp: false
        }
      });
    } catch (error) {
      console.error('Error logging in with password:', error);
      return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
  }

  /**
   * Change password (email/password accounts)
   * PUT /api/auth/profile/password
   */
  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { old_password, new_password } = req.body;

      if (String(old_password) === String(new_password)) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from your current password.'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          message:
            'No password is set for this account. If you signed in with Google or Facebook, use that method to sign in.'
        });
      }

      const ok = await bcrypt.compare(String(old_password), user.password_hash);
      if (!ok) {
        // Use 400 (not 401) so the shared API client does not treat this as an expired session.
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.'
        });
      }

      const passwordHash = await bcrypt.hash(String(new_password), 12);
      await User.setPasswordHash(userId, passwordHash);

      return res.json({
        success: true,
        message: 'Password updated successfully.'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update password. Please try again.'
      });
    }
  }

  /**
   * Request password reset email (public)
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const email = String(req.body.email || '')
        .trim()
        .toLowerCase();
      const genericResponse = {
        success: true,
        message:
          'If an account exists for that email, we sent a password reset link. Check your inbox and spam folder.'
      };

      const user = await User.findByEmail(email);
      const emailVerified = AuthController.truthyEmailVerified(user?.email_verified);
      // Verified email only (no password required: OAuth-only users can use this to set a password)
      if (!user || !emailVerified) {
        if (process.env.NODE_ENV === 'development') {
          const skipReason = !user ? 'no_user' : 'email_not_verified';
          console.warn('[forgot-password] No email sent.', { email, skipReason });
          return res.json({
            ...genericResponse,
            data: {
              devSkipReason: skipReason,
              devHint:
                skipReason === 'no_user'
                  ? 'No account uses this email in the database.'
                  : 'This email is not verified yet. Complete signup verification first.'
            }
          });
        }
        return res.json(genericResponse);
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiryMinutes = parseInt(process.env.PASSWORD_RESET_EXPIRY_MINUTES || '60', 10);
      const safeMinutes =
        Number.isFinite(expiryMinutes) && expiryMinutes > 0 && expiryMinutes <= 1440 ? expiryMinutes : 60;
      const expiresAt = new Date(Date.now() + safeMinutes * 60 * 1000);

      await User.setPasswordResetToken(user.id, token, expiresAt);

      const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
      const resetLink = `${frontendBase}/reset-password?token=${encodeURIComponent(token)}`;

      const isDev = process.env.NODE_ENV === 'development';

      try {
        await sendPasswordResetEmail(email, resetLink);
      } catch (emailErr) {
        console.error('Forgot password: email send failed:', emailErr);
        if (isDev) {
          // Local/dev: still return success with reset link so SMTP misconfig does not block testing
          return res.json({
            ...genericResponse,
            data: {
              resetLink,
              emailDelivered: false,
              devHint:
                'Email could not be sent (check EMAIL_* in backend .env and server logs). Use the link below only on this machine.'
            }
          });
        }
        return res.status(500).json({
          success: false,
          message:
            'Could not send the reset email. Check spam, try again later, or contact support if the problem continues.'
        });
      }

      if (isDev) {
        return res.json({
          ...genericResponse,
          data: {
            resetLink,
            emailDelivered: true,
            devHint: 'Development: reset link is also shown below in case email is delayed.'
          }
        });
      }

      return res.json(genericResponse);
    } catch (error) {
      console.error('forgotPassword:', error);
      const code = error && error.code;
      const msg = error && error.message ? String(error.message) : '';
      if (code === '42703' || /password_reset_token|password_reset_expires/i.test(msg)) {
        return res.status(500).json({
          success: false,
          message:
            'Password reset is not fully configured on the server. Ask an admin to run the database migration add_password_reset_to_users.sql and restart the API.'
        });
      }
      return res.status(500).json({
        success: false,
        message:
          process.env.NODE_ENV === 'development'
            ? `Something went wrong: ${msg || 'unknown error'}`
            : 'Something went wrong. Please try again.'
      });
    }
  }

  /**
   * Complete password reset with token from email (public)
   * POST /api/auth/reset-password
   */
  static async resetPasswordWithToken(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { token, new_password } = req.body;
      const user = await User.findByValidPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'This reset link is invalid or has expired. Request a new one from the login page.'
        });
      }

      const passwordHash = await bcrypt.hash(String(new_password), 12);
      await User.setPasswordHashAndClearReset(user.id, passwordHash);

      return res.json({
        success: true,
        message: 'Your password was updated. You can sign in with your new password.'
      });
    } catch (error) {
      console.error('resetPasswordWithToken:', error);
      return res.status(500).json({
        success: false,
        message: 'Could not reset password. Please try again.'
      });
    }
  }

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

      console.log(`🔐 [OTP:sendOTP] Request received for email: ${email}`);
      console.log(`🔐 [OTP:sendOTP] OTP Length: ${otpLength}, Expiry: ${otpExpiryMinutes} minutes`);

      // Check rate limiting (max 3 OTPs per 10 minutes)
      const recentOtpCount = await Otp.getRecentOtpCount(email, 10);
      console.log(`🔐 [OTP:sendOTP] Recent OTP count for ${email}: ${recentOtpCount}/3`);
      if (recentOtpCount >= 3) {
        console.warn(`⚠️  [OTP:sendOTP] Rate limit exceeded for ${email}`);
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. Please wait before requesting again.'
        });
      }

      // Find or create user
      let user = await User.findByEmail(email);
      if (!user) {
        console.log(`🔐 [OTP:sendOTP] Creating new user for email: ${email}`);
        user = await User.create(email);
      } else {
        console.log(`🔐 [OTP:sendOTP] Found existing user (ID: ${user.id}) for email: ${email}`);
      }

      // Generate OTP
      const code = generateOTP(otpLength);
      const expiresAt = getOTPExpiry(otpExpiryMinutes);

      // Invalidate previous unused OTPs
      console.log(`🔐 [OTP:sendOTP] Invalidating previous unused OTPs for user ID: ${user.id}`);
      await Otp.invalidateUserOtps(user.id, email);

      // Create new OTP
      console.log(`🔐 [OTP:sendOTP] Creating new OTP record in database`);
      await Otp.create(user.id, email, code, expiresAt);

      // Send OTP email (non-blocking in development)
      try {
        console.log(`🔐 [OTP:sendOTP] Sending OTP email...`);
        await sendOTPEmail(email, code);
        console.log(`✅ [OTP:sendOTP] OTP sent successfully to: ${email}`);
      } catch (emailError) {
        console.error(`❌ [OTP:sendOTP] Failed to send OTP email:`, emailError.message);
        throw emailError;
      }

      console.log(`🔐 [OTP:sendOTP] Response sent - OTP expires in ${otpExpiryMinutes} minutes`);
      res.json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          email,
          expiresIn: otpExpiryMinutes * 60 // seconds
        }
      });
    } catch (error) {
      console.error(`❌ [OTP:sendOTP] Error sending OTP:`, error.message);
      console.error(`❌ [OTP:sendOTP] Stack:`, error.stack);
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

      const { email, code, ref: referralRef } = req.body;

      console.log(`🔐 [OTP:verifyOTP] Verification request for email: ${email}, code: ${code}`);

      // Find valid OTP
      const otpRecord = await Otp.findByCodeAndEmail(code, email);
      if (!otpRecord) {
        console.warn(`⚠️  [OTP:verifyOTP] Invalid or expired OTP code for email: ${email}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP code'
        });
      }

      console.log(`✅ [OTP:verifyOTP] Valid OTP found for email: ${email}`);

      // Get user
      const user = await User.findById(otpRecord.user_id);
      if (!user) {
        console.error(`❌ [OTP:verifyOTP] User not found for user_id: ${otpRecord.user_id}`);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log(`🔐 [OTP:verifyOTP] User found (ID: ${user.id}) for email: ${email}`);

      // Mark OTP as used
      console.log(`🔐 [OTP:verifyOTP] Marking OTP as used (OTP ID: ${otpRecord.id})`);
      await Otp.markAsUsed(otpRecord.id);

      // Mark email as verified
      console.log(`🔐 [OTP:verifyOTP] Marking email as verified for user ID: ${user.id}`);
      await User.markEmailAsVerified(user.id);

      // Auto-generate referral code if the user doesn't have one yet
      try {
        if (!user.referral_code) {
          console.log(`🔐 [OTP:verifyOTP] Generating referral code for user ID: ${user.id}`);
          await Referral.generateAndSaveUserCode(user.id);
        } else {
          console.log(`🔐 [OTP:verifyOTP] User already has referral code: ${user.referral_code}`);
        }
      } catch (refErr) {
        console.error('⚠️ Non-blocking: failed to generate referral code', refErr);
      }

      // Update last login
      console.log(`🔐 [OTP:verifyOTP] Updating last login for user ID: ${user.id}`);
      await User.updateLastLogin(user.id);

      // Referral someone shared with this user (stores referred_by_code + referral_uses when valid)
      if (referralRef) {
        try {
          console.log(`🔐 [OTP:verifyOTP] Applying referral code: ${referralRef}`);
          await Referral.updateReferredByCode(user.id, user.email, referralRef, { silent: true });
        } catch (refErr) {
          console.error('⚠️ Non-blocking: failed to apply referred-by code', refErr);
        }
      } else {
        console.log(`🔐 [OTP:verifyOTP] No referral code provided`);
      }

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
            user_code: updatedUser.user_code || null,
            email: updatedUser.email,
            name: updatedUser.name || null,
            profile_photo: updatedUser.profile_photo || null,
            onboarding_completed: finalOnboardingCompleted, // Explicitly send as boolean
            createdAt: updatedUser.created_at,
            has_password: Boolean(updatedUser.password_hash)
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
            user_code: updatedUser.user_code || null,
            email: updatedUser.email,
            name: updatedUser.name,
            profile_photo: updatedUser.profile_photo,
            onboarding_completed: onboardingCompleted,
            createdAt: updatedUser.created_at,
            lastLogin: updatedUser.last_login,
            has_password: Boolean(updatedUser.password_hash)
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
            user_code: updatedUser.user_code || null,
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

      // Encode referral ref in state if provided
      const statePayload = req.query.ref
        ? JSON.stringify({ ref: req.query.ref })
        : undefined;

      // Generate the authorization URL
      const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'openid'
        ],
        prompt: 'consent',
        ...(statePayload ? { state: Buffer.from(statePayload).toString('base64') } : {})
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
      const { code, state: oauthState } = req.query;
      let pendingRef = null;
      if (oauthState) {
        try {
          const decoded = JSON.parse(Buffer.from(oauthState, 'base64').toString('utf8'));
          pendingRef = decoded?.ref || null;
        } catch (_) { /* ignore malformed state */ }
      }

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

      // Auto-generate referral code if the user doesn't have one yet
      try {
        if (!user.referral_code) {
          await Referral.generateAndSaveUserCode(user.id);
        }
      } catch (refErr) {
        console.error('⚠️ Non-blocking: failed to generate referral code', refErr);
      }

      if (pendingRef) {
        try {
          await Referral.updateReferredByCode(user.id, user.email, pendingRef, { silent: true });
        } catch (refErr) {
          console.error('⚠️ Non-blocking: failed to apply referred-by code (Google)', refErr);
        }
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

      // Encode referral ref in state if provided
      const statePayload = req.query.ref
        ? Buffer.from(JSON.stringify({ ref: req.query.ref })).toString('base64')
        : null;

      // Facebook OAuth URL with email and public_profile permissions
      let authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${encodeURIComponent(
        appId
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile&response_type=code`;
      if (statePayload) authUrl += `&state=${encodeURIComponent(statePayload)}`;

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
      const { code, error: fbError, state: oauthState } = req.query;
      let pendingRef = null;
      if (oauthState) {
        try {
          const decoded = JSON.parse(Buffer.from(oauthState, 'base64').toString('utf8'));
          pendingRef = decoded?.ref || null;
        } catch (_) { /* ignore malformed state */ }
      }
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

      // Auto-generate referral code if the user doesn't have one yet
      try {
        if (!user.referral_code) {
          await Referral.generateAndSaveUserCode(user.id);
        }
      } catch (refErr) {
        console.error('⚠️ Non-blocking: failed to generate referral code', refErr);
      }

      if (pendingRef && user.email) {
        try {
          await Referral.updateReferredByCode(user.id, user.email, pendingRef, { silent: true });
        } catch (refErr) {
          console.error('⚠️ Non-blocking: failed to apply referred-by code (Facebook)', refErr);
        }
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

