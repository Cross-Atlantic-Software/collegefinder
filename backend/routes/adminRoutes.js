const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdminController = require('../controllers/adminController');
const AdminUsersController = require('../controllers/adminUsersController');
const CareerGoalsController = require('../controllers/careerGoalsController');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/adminAuth');
const {
  validateAdminLogin,
  validateCreateAdmin,
  validateUpdateAdmin
} = require('../middleware/validators');

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
router.post('/career-goals/upload-image', (req, res, next) => {
  console.log('🔍 Route matched: POST /api/admin/career-goals/upload-image');
  console.log('Request headers:', req.headers['content-type']);
  next();
}, authenticateAdmin, upload.single('image'), CareerGoalsController.uploadImage);

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

module.exports = router;

