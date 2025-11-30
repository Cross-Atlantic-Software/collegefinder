const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/adminAuth');
const {
  validateAdminLogin,
  validateCreateAdmin,
  validateUpdateAdmin,
  validateCreateUser,
  validateUpdateUser
} = require('../middleware/validators');

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
 * @route   GET /api/admin/users
 * @desc    Get all registered users
 * @access  Private (Admin)
 */
router.get('/users', authenticateAdmin, AdminController.getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin)
 */
router.get('/users/:id', authenticateAdmin, AdminController.getUserById);

/**
 * @route   POST /api/admin/users
 * @desc    Create new user
 * @access  Private (Admin)
 */
router.post('/users', authenticateAdmin, validateCreateUser, AdminController.createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put('/users/:id', authenticateAdmin, validateUpdateUser, AdminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete('/users/:id', authenticateAdmin, AdminController.deleteUser);

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

module.exports = router;

