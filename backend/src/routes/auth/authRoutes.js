const express = require('express');
const router = express.Router();
const multer = require('multer');
const AuthController = require('../../controllers/auth/authController');
const BasicInfoController = require('../../controllers/profile/basicInfoController');
const AcademicsController = require('../../controllers/profile/academicsController');
const CareerGoalsController = require('../../controllers/profile/careerGoalsController');
const ExamsController = require('../../controllers/profile/examsController');
const ProfileCompletionController = require('../../controllers/profile/profileCompletionController');
const SubjectsController = require('../../controllers/profile/subjectsController');
const TopicsController = require('../../controllers/profile/topicsController');
const GovernmentIdentificationController = require('../../controllers/profile/governmentIdentificationController');
const CategoryAndReservationController = require('../../controllers/profile/categoryAndReservationController');
const OtherPersonalDetailsController = require('../../controllers/profile/otherPersonalDetailsController');
const UserAddressController = require('../../controllers/profile/userAddressController');
const { authenticate } = require('../../middleware/auth');

// Configure multer for memory storage (for S3 upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

const {
  validateSendOTP,
  validateVerifyOTP,
  validateResendOTP,
  validateUpdateProfile,
  validateUpdateBasicInfo,
  validateUpdateAcademics,
  validateUpdateCareerGoals,
  validateSendEmailOTP,
  validateVerifyEmailOTP,
  validateGovernmentIdentification,
  validateCategoryAndReservation,
  validateOtherPersonalDetails,
  validateUserAddress
} = require('../../middleware/validators');

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
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth (redirects to Google)
 * @access  Public
 */
router.get('/google', AuthController.googleAuth);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback (redirect from Google)
 * @access  Public
 */
router.get('/google/callback', AuthController.googleCallback);

/**
 * @route   GET /api/auth/facebook
 * @desc    Initiate Facebook OAuth (redirects to Facebook)
 * @access  Public
 */
router.get('/facebook', AuthController.facebookAuth);

/**
 * @route   GET /api/auth/facebook/callback
 * @desc    Handle Facebook OAuth callback
 * @access  Public
 */
router.get('/facebook/callback', AuthController.facebookCallback);

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
 * @route   POST /api/auth/profile/email/send-otp
 * @desc    Send OTP to new email for verification
 * @access  Private
 */
router.post('/profile/email/send-otp', authenticate, validateSendEmailOTP, BasicInfoController.sendEmailOTP);

/**
 * @route   POST /api/auth/profile/email/verify
 * @desc    Verify OTP and update email
 * @access  Private
 */
router.post('/profile/email/verify', authenticate, validateVerifyEmailOTP, BasicInfoController.verifyEmailOTP);

/**
 * @route   DELETE /api/auth/profile/upload-photo
 * @desc    Delete profile photo
 * @access  Private
 */
router.delete('/profile/upload-photo', authenticate, BasicInfoController.deleteProfilePhoto);

/**
 * @route   POST /api/auth/profile/upload-photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post('/profile/upload-photo', authenticate, upload.single('photo'), BasicInfoController.uploadProfilePhoto);

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
 * @route   GET /api/auth/profile/subjects
 * @desc    Get subjects filtered by user's stream_id
 * @access  Private
 */
router.get('/profile/subjects', authenticate, SubjectsController.getByUserStream);

/**
 * @route   GET /api/auth/profile/topics/:topicName
 * @desc    Get topic by name with subtopics and lectures
 * @access  Private
 */
router.get('/profile/topics/:topicName', authenticate, TopicsController.getTopicByName);

/**
 * @route   GET /api/auth/profile/topics/subject/:subjectId
 * @desc    Get topics by subject ID
 * @access  Private
 */
router.get('/profile/topics/subject/:subjectId', authenticate, TopicsController.getTopicsBySubjectId);

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

/**
 * @route   GET /api/auth/profile/government-identification
 * @desc    Get user government identification
 * @access  Private
 */
router.get('/profile/government-identification', authenticate, GovernmentIdentificationController.getGovernmentIdentification);

/**
 * @route   PUT /api/auth/profile/government-identification
 * @desc    Create or update user government identification
 * @access  Private
 */
router.put('/profile/government-identification', authenticate, validateGovernmentIdentification, GovernmentIdentificationController.upsertGovernmentIdentification);

/**
 * @route   DELETE /api/auth/profile/government-identification
 * @desc    Delete user government identification
 * @access  Private
 */
router.delete('/profile/government-identification', authenticate, GovernmentIdentificationController.deleteGovernmentIdentification);

/**
 * @route   GET /api/auth/profile/category-and-reservation
 * @desc    Get user category and reservation
 * @access  Private
 */
router.get('/profile/category-and-reservation', authenticate, CategoryAndReservationController.getCategoryAndReservation);

/**
 * @route   PUT /api/auth/profile/category-and-reservation
 * @desc    Create or update user category and reservation
 * @access  Private
 */
router.put('/profile/category-and-reservation', authenticate, validateCategoryAndReservation, CategoryAndReservationController.upsertCategoryAndReservation);

/**
 * @route   DELETE /api/auth/profile/category-and-reservation
 * @desc    Delete user category and reservation
 * @access  Private
 */
router.delete('/profile/category-and-reservation', authenticate, CategoryAndReservationController.deleteCategoryAndReservation);

/**
 * @route   GET /api/auth/profile/other-personal-details
 * @desc    Get user other personal details
 * @access  Private
 */
router.get('/profile/other-personal-details', authenticate, OtherPersonalDetailsController.getOtherPersonalDetails);

/**
 * @route   PUT /api/auth/profile/other-personal-details
 * @desc    Create or update user other personal details
 * @access  Private
 */
router.put('/profile/other-personal-details', authenticate, validateOtherPersonalDetails, OtherPersonalDetailsController.upsertOtherPersonalDetails);

/**
 * @route   DELETE /api/auth/profile/other-personal-details
 * @desc    Delete user other personal details
 * @access  Private
 */
router.delete('/profile/other-personal-details', authenticate, OtherPersonalDetailsController.deleteOtherPersonalDetails);

/**
 * @route   GET /api/auth/profile/address
 * @desc    Get user address
 * @access  Private
 */
router.get('/profile/address', authenticate, UserAddressController.getAddress);

/**
 * @route   PUT /api/auth/profile/address
 * @desc    Create or update user address
 * @access  Private
 */
router.put('/profile/address', authenticate, validateUserAddress, UserAddressController.upsertAddress);

/**
 * @route   DELETE /api/auth/profile/address
 * @desc    Delete user address
 * @access  Private
 */
router.delete('/profile/address', authenticate, UserAddressController.deleteAddress);

module.exports = router;

