const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOTP, getOTPExpiry } = require('../../utils/otpGenerator');
const { sendOTPEmail } = require('../../utils/emailService');
const { generateToken } = require('../../utils/jwt');
const { validationResult } = require('express-validator');

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
}

module.exports = AuthController;

