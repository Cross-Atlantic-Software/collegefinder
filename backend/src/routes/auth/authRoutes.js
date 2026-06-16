const express = require('express');
const router = express.Router();
const multer = require('multer');
const AuthController = require('../../controllers/auth/authController');
const BasicInfoController = require('../../controllers/profile/basicInfoController');
const AcademicsController = require('../../controllers/profile/academicsController');
const CareerGoalsController = require('../../controllers/profile/careerGoalsController');
const ExamsController = require('../../controllers/profile/examsController');
const ProfileCollegesController = require('../../controllers/profile/collegesController');
const DashboardInstitutesController = require('../../controllers/profile/dashboardInstitutesController');
const DashboardScholarshipsController = require('../../controllers/profile/dashboardScholarshipsController');
const ProfileCompletionController = require('../../controllers/profile/profileCompletionController');
const SubjectsController = require('../../controllers/profile/subjectsController');
const ExamPrepLecturesController = require('../../controllers/profile/examPrepLecturesController');
const TopicsController = require('../../controllers/profile/topicsController');
const GovernmentIdentificationController = require('../../controllers/profile/governmentIdentificationController');
const CategoryAndReservationController = require('../../controllers/profile/categoryAndReservationController');
const OtherPersonalDetailsController = require('../../controllers/profile/otherPersonalDetailsController');
const UserAddressController = require('../../controllers/profile/userAddressController');
const UserOtherInfoController = require('../../controllers/profile/userOtherInfoController');
const DocumentVaultController = require('../../controllers/profile/documentVaultController');
const { authenticate } = require('../../middleware/auth');

// Configure multer for document vault (images and PDFs, 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Accept only specific image types and PDF files for document vault
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];
    
    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WebP images and PDF files are allowed'), false);
    }
    
    // Check file extension as additional validation
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png, .webp, and .pdf files are allowed'), false);
    }
    
    cb(null, true);
  },
});

// Configure multer for profile photo (images only, 5MB)
const uploadPhoto = multer({
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
  validateSignupStart,
  validatePasswordLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyOTP,
  validateResendOTP,
  validateUpdateProfile,
  validateUpdateBasicInfo,
  validateUpdateAcademics,
  validateUpdateCareerGoals,
  validateChangePassword,
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
 * @route   POST /api/auth/signup/start
 * @desc    Start email/password signup and send verification OTP
 * @access  Public
 */
router.post('/signup/start', validateSignupStart, AuthController.startSignup);

/**
 * @route   POST /api/auth/login-password
 * @desc    Login using email + password
 * @access  Public
 */
router.post('/login-password', validatePasswordLogin, AuthController.loginWithPassword);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Email a password reset link (always generic success message)
 * @access  Public
 */
router.post('/forgot-password', validateForgotPassword, AuthController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Set new password using token from email
 * @access  Public
 */
router.post('/reset-password', validateResetPassword, AuthController.resetPasswordWithToken);

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
router.post('/profile/upload-photo', authenticate, uploadPhoto.single('photo'), BasicInfoController.uploadProfilePhoto);

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
 * @route   GET /api/auth/profile/exam-prep-lectures/recommended
 * @desc    Top recommended exam prep video for user's stream
 * @access  Private
 */
router.get(
  '/profile/exam-prep-lectures/recommended',
  authenticate,
  ExamPrepLecturesController.getRecommendedLecture
);

/**
 * @route   GET /api/auth/profile/exam-prep-lectures/subject/:subjectId
 * @desc    Exam prep videos for one subject (lazy-loaded per subject tab)
 * @access  Private
 */
router.get(
  '/profile/exam-prep-lectures/subject/:subjectId',
  authenticate,
  ExamPrepLecturesController.getLecturesBySubject
);

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
 * @route   PUT /api/auth/profile/password
 * @desc    Change password (requires current password)
 * @access  Private
 */
router.put('/profile/password', authenticate, validateChangePassword, AuthController.changePassword);

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
 * @route   GET /api/auth/profile/recommended-exams
 * @desc    Get recommended exams for user (admin stream+interest → exam mapping)
 * @access  Private
 */
router.get('/profile/recommended-exams', authenticate, ExamsController.getRecommendedExams);

/**
 * @route   GET /api/auth/profile/dashboard-exams/meta
 * @desc    Sidebar / cache: stream + shortlisted + recommended IDs only (no enriched exams)
 * @access  Private
 */
router.get('/profile/dashboard-exams/meta', authenticate, ExamsController.getDashboardExamsMeta);

/**
 * @route   GET /api/auth/profile/dashboard-exams/tab
 * @desc    Paginated enriched exams for one dashboard tab (recommended | shortlisted | all)
 * @access  Private
 */
router.get('/profile/dashboard-exams/tab', authenticate, ExamsController.getDashboardExamsTab);

/**
 * @route   GET /api/auth/profile/dashboard-exams/mock-test
 * @desc    Mock Test picker: form-filled, then shortlisted, then recommended exams
 * @access  Private
 */
router.get('/profile/dashboard-exams/mock-test', authenticate, ExamsController.getDashboardMockTestExams);

/**
 * @route   GET /api/auth/profile/dashboard-exams/exam/:examId
 * @desc    Single enriched exam for dashboard detail (same enrichment as tab cards)
 * @access  Private
 */
router.get('/profile/dashboard-exams/exam/:examId', authenticate, ExamsController.getDashboardExamById);

/**
 * @route   GET /api/auth/profile/exams/:examId/colleges
 * @desc    Colleges linked to this exam (college_recommended_exams + program recommended_exam_ids)
 * @access  Private
 */
router.get('/profile/exams/:examId/colleges', authenticate, ProfileCollegesController.getCollegesForExam);

/**
 * @route   GET /api/auth/profile/exams/:examId/institutes
 * @desc    Coaching institutes linked to this exam (institute_exams + institute_exam_specialization)
 * @access  Private
 */
router.get('/profile/exams/:examId/institutes', authenticate, DashboardInstitutesController.getInstitutesForExam);

/**
 * @route   GET /api/auth/profile/dashboard-exams
 * @desc    Stream-filtered exams + recommended + shortlisted IDs for dashboard tabs (legacy full payload)
 * @access  Private
 */
router.get('/profile/dashboard-exams', authenticate, ExamsController.getDashboardExams);

/**
 * @route   PUT /api/auth/profile/shortlisted-exams
 * @desc    Add/remove exam in user shortlist
 * @access  Private
 */
router.put('/profile/shortlisted-exams', authenticate, ExamsController.updateShortlistedExams);

/**
 * @route   PUT /api/auth/profile/already-filled-form
 * @desc    Mark or unmark an exam as already filled (user_academics.already_filled_form)
 * @access  Private
 */
router.put('/profile/already-filled-form', authenticate, ExamsController.updateAlreadyFilledForm);

/**
 * @route   GET /api/auth/profile/recommended-colleges
 * @desc    Get recommended colleges for user (colleges whose recommended exams match user's recommended exam IDs)
 * @access  Private
 */
router.get('/profile/recommended-colleges', authenticate, ProfileCollegesController.getRecommendedColleges);

/**
 * @route   GET /api/auth/profile/dashboard-colleges/meta
 * @desc    College shortlist meta (counts, shortlisted IDs)
 * @access  Private
 */
router.get('/profile/dashboard-colleges/meta', authenticate, ProfileCollegesController.getDashboardCollegesMeta);

/**
 * @route   GET /api/auth/profile/dashboard-colleges/tab
 * @desc    Paginated colleges for one dashboard tab (server-sorted)
 * @access  Private
 */
router.get('/profile/dashboard-colleges/tab', authenticate, ProfileCollegesController.getDashboardCollegesTab);

/**
 * @route   GET /api/auth/profile/dashboard-colleges/:collegeRef
 * @desc    Single college with full admin-linked data (id or slug)
 * @access  Private
 */
router.get('/profile/dashboard-colleges/:collegeRef', authenticate, ProfileCollegesController.getDashboardCollegeByRef);

/**
 * @route   GET /api/auth/profile/dashboard-colleges
 * @desc    Legacy alias for dashboard-colleges/meta
 * @access  Private
 */
router.get('/profile/dashboard-colleges', authenticate, ProfileCollegesController.getDashboardColleges);

/**
 * @route   PUT /api/auth/profile/shortlisted-colleges
 * @desc    Add/remove college in user_academics.user_shortlisted_colleges
 * @access  Private
 */
router.put('/profile/shortlisted-colleges', authenticate, ProfileCollegesController.updateShortlistedColleges);

/**
 * @route   GET /api/auth/profile/dashboard-institutes/meta
 * @desc    Lightweight coaching institutes meta (tab totals + shortlist IDs)
 * @access  Private
 */
router.get(
  '/profile/dashboard-institutes/meta',
  authenticate,
  DashboardInstitutesController.getDashboardInstitutesMeta
);

/**
 * @route   GET /api/auth/profile/dashboard-institutes/tab
 * @desc    Paginated online or offline coaching institutes for dashboard
 * @access  Private
 */
router.get(
  '/profile/dashboard-institutes/tab',
  authenticate,
  DashboardInstitutesController.getDashboardInstitutesTab
);

/**
 * @route   GET /api/auth/profile/dashboard-institutes
 * @desc    Legacy alias for dashboard-institutes/meta
 * @access  Private
 */
router.get('/profile/dashboard-institutes', authenticate, DashboardInstitutesController.getDashboardInstitutes);

/**
 * @route   PUT /api/auth/profile/shortlisted-institutes
 * @desc    Toggle shortlisted coaching institute IDs
 * @access  Private
 */
router.put('/profile/shortlisted-institutes', authenticate, DashboardInstitutesController.updateShortlistedInstitutes);

/**
 * @route   GET /api/auth/profile/dashboard-institutes/:instituteRef
 * @desc    Single coaching institute for dashboard detail (id or slug)
 * @access  Private
 */
router.get(
  '/profile/dashboard-institutes/:instituteRef',
  authenticate,
  DashboardInstitutesController.getDashboardInstituteByRef
);

/**
 * @route   GET /api/auth/profile/dashboard-scholarships/meta
 * @desc    Lightweight scholarship shortlist meta (tab totals, shortlisted IDs)
 * @access  Private
 */
router.get(
  '/profile/dashboard-scholarships/meta',
  authenticate,
  DashboardScholarshipsController.getDashboardScholarshipsMeta
);

/**
 * @route   GET /api/auth/profile/dashboard-scholarships/tab
 * @desc    Paginated scholarships for one dashboard tab
 * @access  Private
 */
router.get(
  '/profile/dashboard-scholarships/tab',
  authenticate,
  DashboardScholarshipsController.getDashboardScholarshipsTab
);

/**
 * @route   GET /api/auth/profile/dashboard-scholarships
 * @desc    Legacy alias for dashboard-scholarships/meta
 * @access  Private
 */
router.get('/profile/dashboard-scholarships', authenticate, DashboardScholarshipsController.getDashboardScholarships);

/**
 * @route   PUT /api/auth/profile/shortlisted-scholarships
 * @desc    Toggle shortlisted scholarship IDs
 * @access  Private
 */
router.put('/profile/shortlisted-scholarships', authenticate, DashboardScholarshipsController.updateShortlistedScholarships);

/**
 * @route   GET /api/auth/profile/dashboard-scholarships/:scholarshipRef
 * @desc    Single scholarship for dashboard detail (id or slug)
 * @access  Private
 */
router.get(
  '/profile/dashboard-scholarships/:scholarshipRef',
  authenticate,
  DashboardScholarshipsController.getDashboardScholarshipByRef
);

/**
 * @route   GET /api/auth/profile/completion
 * @desc    Get profile completion percentage
 * @access  Private
 */
router.get('/profile/completion', authenticate, ProfileCompletionController.getCompletion);

/**
 * @route   POST /api/auth/profile/complete-landing-onboarding
 * @desc    Mark onboarding complete (landing contact form)
 * @access  Private
 */
router.post(
  '/profile/complete-landing-onboarding',
  authenticate,
  AuthController.completeLandingOnboarding
);

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

/**
 * @route   GET /api/auth/profile/other-info
 * @desc    Get user other info
 * @access  Private
 */
router.get('/profile/other-info', authenticate, UserOtherInfoController.getOtherInfo);

/**
 * @route   PUT /api/auth/profile/other-info
 * @desc    Create or update user other info
 * @access  Private
 */
router.put('/profile/other-info', authenticate, UserOtherInfoController.updateOtherInfo);

/**
 * @route   GET /api/auth/profile/document-vault
 * @desc    Get user document vault
 * @access  Private
 */
router.get('/profile/document-vault', authenticate, DocumentVaultController.getDocumentVault);

/**
 * @route   POST /api/auth/profile/document-vault/upload
 * @desc    Upload a document to document vault
 * @access  Private
 */
router.post('/profile/document-vault/upload', authenticate, upload.single('document'), DocumentVaultController.uploadDocument);

/**
 * @route   DELETE /api/auth/profile/document-vault/:fieldName
 * @desc    Delete a document from document vault
 * @access  Private
 */
router.delete('/profile/document-vault/:fieldName', authenticate, DocumentVaultController.deleteDocument);

module.exports = router;

