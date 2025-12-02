const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const {
  validateSendOTP,
  validateVerifyOTP,
  validateResendOTP,
  validateUpdateProfile
} = require('../middleware/validators');

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to user's email
 * @access  Public
 */
router.post('/send-otp', validateSendOTP, AuthController.sendOTP);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and authenticate user
 * @access  Public
 */
router.post('/verify-otp', validateVerifyOTP, AuthController.verifyOTP);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to user's email
 * @access  Public
 */
router.post('/resend-otp', validateResendOTP, AuthController.resendOTP);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticate, AuthController.getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile (name)
 * @access  Private
 */
router.put('/profile', authenticate, validateUpdateProfile, AuthController.updateProfile);

module.exports = router;

