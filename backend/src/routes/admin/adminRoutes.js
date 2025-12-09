const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdminController = require('../../controllers/admin/adminController');
const AdminUsersController = require('../../controllers/admin/adminUsersController');
const CareerGoalsController = require('../../controllers/profile/careerGoalsController');
const ExamsController = require('../../controllers/profile/examsController');
const SubjectController = require('../../controllers/admin/subjectController');
const StreamController = require('../../controllers/admin/streamController');
const CareerController = require('../../controllers/admin/careerController');
const { authenticateAdmin, requireSuperAdmin } = require('../../middleware/adminAuth');
const {
  validateAdminLogin,
  validateCreateAdmin,
  validateUpdateAdmin,
  validateCreateSubject,
  validateUpdateSubject,
  validateCreateStream,
  validateUpdateStream,
  validateCreateCareer,
  validateUpdateCareer
} = require('../../middleware/validators');

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

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', validateAdminLogin, AdminController.login);

/**
 * @route   GET /api/admin/me
 * @desc    Get current authenticated admin
 * @access  Private (Admin)
 */
router.get('/me', authenticateAdmin, AdminController.getMe);

/**
 * IMPORTANT: More specific routes must come BEFORE general routes
 * Otherwise Express will match the general route first
 */

/**
 * @route   GET /api/admin/users/basic-info
 * @desc    Get all users with basic info
 * @access  Private (Admin)
 */
router.get('/users/basic-info', authenticateAdmin, AdminUsersController.getAllUsersBasicInfo);

/**
 * @route   GET /api/admin/users/academics
 * @desc    Get all users with academics
 * @access  Private (Admin)
 */
router.get('/users/academics', authenticateAdmin, AdminUsersController.getAllUsersAcademics);

/**
 * @route   GET /api/admin/users/career-goals
 * @desc    Get all users with career goals
 * @access  Private (Admin)
 */
router.get('/users/career-goals', authenticateAdmin, AdminUsersController.getAllUsersCareerGoals);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user with complete details (basic + academics + career goals)
 * @access  Private (Admin)
 */
router.get('/users/:id', authenticateAdmin, AdminUsersController.getUserDetails);

/**
 * @route   GET /api/admin/users
 * @desc    Get all registered users
 * @access  Private (Admin)
 */
router.get('/users', authenticateAdmin, AdminController.getAllUsers);

/**
 * @route   GET /api/admin/admins
 * @desc    Get all admin users
 * @access  Private (Super Admin)
 */
router.get('/admins', authenticateAdmin, requireSuperAdmin, AdminController.getAllAdmins);

/**
 * @route   POST /api/admin/admins
 * @desc    Create new admin user
 * @access  Private (Super Admin)
 */
router.post('/admins', authenticateAdmin, requireSuperAdmin, validateCreateAdmin, AdminController.createAdmin);

/**
 * @route   PUT /api/admin/admins/:id
 * @desc    Update admin user
 * @access  Private (Super Admin)
 */
router.put('/admins/:id', authenticateAdmin, requireSuperAdmin, validateUpdateAdmin, AdminController.updateAdmin);

/**
 * @route   DELETE /api/admin/admins/:id
 * @desc    Delete admin user
 * @access  Private (Super Admin)
 */
router.delete('/admins/:id', authenticateAdmin, requireSuperAdmin, AdminController.deleteAdmin);

/**
 * Career Goals Taxonomy Routes
 */

/**
 * @route   GET /api/admin/career-goals
 * @desc    Get all career goals (for admin)
 * @access  Private (Admin)
 */
router.get('/career-goals', authenticateAdmin, CareerGoalsController.getAllAdmin);

/**
 * @route   POST /api/admin/career-goals/upload-image
 * @desc    Upload logo to S3
 * @access  Private (Admin)
 * IMPORTANT: This route must come BEFORE /career-goals/:id to avoid route conflicts
 */
router.post('/career-goals/upload-image', authenticateAdmin, upload.single('image'), CareerGoalsController.uploadImage);

/**
 * @route   POST /api/admin/career-goals
 * @desc    Create new career goal
 * @access  Private (Admin)
 */
router.post('/career-goals', authenticateAdmin, CareerGoalsController.create);

/**
 * @route   GET /api/admin/career-goals/:id
 * @desc    Get career goal by ID
 * @access  Private (Admin)
 */
router.get('/career-goals/:id', authenticateAdmin, CareerGoalsController.getById);

/**
 * @route   PUT /api/admin/career-goals/:id
 * @desc    Update career goal
 * @access  Private (Admin)
 */
router.put('/career-goals/:id', authenticateAdmin, CareerGoalsController.update);

/**
 * @route   DELETE /api/admin/career-goals/:id
 * @desc    Delete career goal
 * @access  Private (Admin)
 */
router.delete('/career-goals/:id', authenticateAdmin, CareerGoalsController.delete);

/**
 * Subjects Taxonomy Routes
 */

/**
 * @route   GET /api/admin/subjects
 * @desc    Get all subjects (for admin)
 * @access  Private (Admin)
 */
router.get('/subjects', authenticateAdmin, SubjectController.getAllSubjects);

/**
 * @route   GET /api/admin/subjects/:id
 * @desc    Get subject by ID
 * @access  Private (Admin)
 */
router.get('/subjects/:id', authenticateAdmin, SubjectController.getSubjectById);

/**
 * @route   POST /api/admin/subjects
 * @desc    Create new subject
 * @access  Private (Admin)
 */
router.post('/subjects', authenticateAdmin, validateCreateSubject, SubjectController.createSubject);

/**
 * @route   PUT /api/admin/subjects/:id
 * @desc    Update subject
 * @access  Private (Admin)
 */
router.put('/subjects/:id', authenticateAdmin, validateUpdateSubject, SubjectController.updateSubject);

/**
 * @route   DELETE /api/admin/subjects/:id
 * @desc    Delete subject
 * @access  Private (Admin)
 */
router.delete('/subjects/:id', authenticateAdmin, SubjectController.deleteSubject);

/**
 * Streams Taxonomy Routes
 */

/**
 * @route   GET /api/admin/streams
 * @desc    Get all streams (for admin)
 * @access  Private (Admin)
 */
router.get('/streams', authenticateAdmin, StreamController.getAllStreams);

/**
 * @route   GET /api/admin/streams/:id
 * @desc    Get stream by ID
 * @access  Private (Admin)
 */
router.get('/streams/:id', authenticateAdmin, StreamController.getStreamById);

/**
 * @route   POST /api/admin/streams
 * @desc    Create new stream
 * @access  Private (Admin)
 */
router.post('/streams', authenticateAdmin, validateCreateStream, StreamController.createStream);

/**
 * @route   PUT /api/admin/streams/:id
 * @desc    Update stream
 * @access  Private (Admin)
 */
router.put('/streams/:id', authenticateAdmin, validateUpdateStream, StreamController.updateStream);

/**
 * @route   DELETE /api/admin/streams/:id
 * @desc    Delete stream
 * @access  Private (Admin)
 */
router.delete('/streams/:id', authenticateAdmin, StreamController.deleteStream);

/**
 * Careers Taxonomy Routes
 */

/**
 * @route   GET /api/admin/careers
 * @desc    Get all careers (for admin)
 * @access  Private (Admin)
 */
router.get('/careers', authenticateAdmin, CareerController.getAllCareers);

/**
 * @route   GET /api/admin/careers/:id
 * @desc    Get career by ID
 * @access  Private (Admin)
 */
router.get('/careers/:id', authenticateAdmin, CareerController.getCareerById);

/**
 * @route   POST /api/admin/careers
 * @desc    Create new career
 * @access  Private (Admin)
 */
router.post('/careers', authenticateAdmin, validateCreateCareer, CareerController.createCareer);

/**
 * @route   PUT /api/admin/careers/:id
 * @desc    Update career
 * @access  Private (Admin)
 */
router.put('/careers/:id', authenticateAdmin, validateUpdateCareer, CareerController.updateCareer);

/**
 * @route   DELETE /api/admin/careers/:id
 * @desc    Delete career
 * @access  Private (Admin)
 */
router.delete('/careers/:id', authenticateAdmin, CareerController.deleteCareer);

/**
 * Exams Taxonomy Routes
 */

/**
 * @route   GET /api/admin/exams
 * @desc    Get all exams (for admin)
 * @access  Private (Admin)
 */
router.get('/exams', authenticateAdmin, ExamsController.getAllAdmin);

/**
 * @route   POST /api/admin/exams
 * @desc    Create new exam (for admin)
 * @access  Private (Admin)
 */
router.post('/exams', authenticateAdmin, ExamsController.create);

/**
 * @route   GET /api/admin/exams/:id
 * @desc    Get exam by ID (for admin)
 * @access  Private (Admin)
 */
router.get('/exams/:id', authenticateAdmin, ExamsController.getById);

/**
 * @route   PUT /api/admin/exams/:id
 * @desc    Update exam (for admin)
 * @access  Private (Admin)
 */
router.put('/exams/:id', authenticateAdmin, ExamsController.update);

/**
 * @route   DELETE /api/admin/exams/:id
 * @desc    Delete exam (for admin)
 * @access  Private (Admin)
 */
router.delete('/exams/:id', authenticateAdmin, ExamsController.delete);

module.exports = router;

