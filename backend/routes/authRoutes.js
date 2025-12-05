const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const BasicInfoController = require('../controllers/basicInfoController');
const AcademicsController = require('../controllers/academicsController');
const CareerGoalsController = require('../controllers/careerGoalsController');
const ExamsController = require('../controllers/examsController');
const ProfileCompletionController = require('../controllers/profileCompletionController');
const { authenticate } = require('../middleware/auth');
const {
  validateSendOTP,
  validateVerifyOTP,
  validateResendOTP,
  validateUpdateProfile,
  validateUpdateBasicInfo,
  validateUpdateAcademics,
  validateUpdateCareerGoals
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

/**
 * @route   GET /api/auth/profile/basic
 * @desc    Get user basic info
 * @access  Private
 */
router.get('/profile/basic', authenticate, BasicInfoController.getBasicInfo);

/**
 * @route   PUT /api/auth/profile/basic
 * @desc    Update user basic info (first_name, last_name, date_of_birth, gender, location)
 * @access  Private
 */
router.put('/profile/basic', authenticate, validateUpdateBasicInfo, BasicInfoController.updateBasicInfo);

/**
 * @route   GET /api/auth/profile/academics
 * @desc    Get user academics
 * @access  Private
 */
router.get('/profile/academics', authenticate, AcademicsController.getAcademics);

/**
 * @route   PUT /api/auth/profile/academics
 * @desc    Update user academics
 * @access  Private
 */
router.put('/profile/academics', authenticate, validateUpdateAcademics, AcademicsController.updateAcademics);

/**
 * @route   GET /api/auth/profile/career-goals
 * @desc    Get user career goals
 * @access  Private
 */
router.get('/profile/career-goals', authenticate, CareerGoalsController.getCareerGoals);

/**
 * @route   PUT /api/auth/profile/career-goals
 * @desc    Update user career goals
 * @access  Private
 */
router.put('/profile/career-goals', authenticate, validateUpdateCareerGoals, CareerGoalsController.updateCareerGoals);

/**
 * @route   GET /api/auth/profile/exam-preferences
 * @desc    Get user's exam preferences
 * @access  Private
 */
router.get('/profile/exam-preferences', authenticate, ExamsController.getExamPreferences);

/**
 * @route   PUT /api/auth/profile/exam-preferences
 * @desc    Update user's exam preferences
 * @access  Private
 */
router.put('/profile/exam-preferences', authenticate, ExamsController.updateExamPreferences);

/**
 * @route   GET /api/auth/profile/completion
 * @desc    Get profile completion percentage
 * @access  Private
 */
router.get('/profile/completion', authenticate, ProfileCompletionController.getCompletion);

module.exports = router;

