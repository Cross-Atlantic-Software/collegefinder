const User = require('../../models/user/User');
const Admin = require('../../models/admin/Admin');
const { generateToken } = require('../../../utils/auth/jwt');
const { validationResult } = require('express-validator');

class AdminController {
  /**
   * Admin login
   * POST /api/admin/login
   */
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find admin by email
      const admin = await Admin.findByEmail(email);
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if admin is active
      if (!admin.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Admin account is inactive'
        });
      }

      // Verify password
      const isValidPassword = await Admin.verifyPassword(admin, password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      await Admin.updateLastLogin(admin.id);

      // Generate JWT token
      const token = generateToken({
        adminId: admin.id,
        email: admin.email,
        type: admin.type
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          admin: {
            id: admin.id,
            email: admin.email,
            type: admin.type
          },
          token
        }
      });
    } catch (error) {
      console.error('Error in admin login:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to login'
      });
    }
  }

  /**
   * Get current admin
   * GET /api/admin/me
   */
  static async getMe(req, res) {
    try {
      const admin = await Admin.findById(req.admin.id);
      res.json({
        success: true,
        data: {
          admin: {
            id: admin.id,
            email: admin.email,
            type: admin.type,
            is_active: admin.is_active
          }
        }
      });
    } catch (error) {
      console.error('Error getting admin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get admin information'
      });
    }
  }

  /**
   * Get all registered users
   * GET /api/admin/users
   */
  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll();
      
      res.json({
        success: true,
        data: {
          users,
          total: users.length
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  }

  /**
   * Get all admin users
   * GET /api/admin/admins
   */
  static async getAllAdmins(req, res) {
    try {
      const admins = await Admin.findAll();
      
      res.json({
        success: true,
        data: {
          admins,
          total: admins.length
        }
      });
    } catch (error) {
      console.error('Error fetching admins:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch admins'
      });
    }
  }

  /**
   * Create new admin user
   * POST /api/admin/admins
   */
  static async createAdmin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password, type = 'user' } = req.body;

      // Check if email already exists
      const existingEmail = await Admin.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Only super_admin can create other admins
      if (req.admin.type !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can create admin users'
        });
      }

      // Cannot create super_admin type (only one super admin)
      if (type === 'super_admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot create super_admin type'
        });
      }

      const admin = await Admin.create(email, password, type, req.admin.id);

      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: { admin }
      });
    } catch (error) {
      console.error('Error creating admin:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create admin user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update admin user
   * PUT /api/admin/admins/:id
   */
  static async updateAdmin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { email, password, type, is_active } = req.body;

      // Only super_admin can update other admins
      if (req.admin.type !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can update admin users'
        });
      }

      // Cannot update super_admin
      const targetAdmin = await Admin.findById(id);
      if (targetAdmin && targetAdmin.type === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify super_admin'
        });
      }

      let updatedAdmin = targetAdmin;
      
      // Update email if provided
      if (email !== undefined && email !== targetAdmin.email) {
        updatedAdmin = await Admin.updateEmail(id, email);
      }
      
      // Update password if provided
      if (password !== undefined && password.trim() !== '') {
        updatedAdmin = await Admin.updatePassword(id, password);
      }
      
      // Update type if provided
      if (type !== undefined) {
        updatedAdmin = await Admin.updateType(id, type);
      }
      
      // Update active status if provided
      if (is_active !== undefined) {
        updatedAdmin = await Admin.updateActiveStatus(id, is_active);
      }

      res.json({
        success: true,
        message: 'Admin user updated successfully',
        data: { admin: updatedAdmin }
      });
    } catch (error) {
      console.error('Error updating admin:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update admin user'
      });
    }
  }

  /**
   * Delete admin user
   * DELETE /api/admin/admins/:id
   */
  static async deleteAdmin(req, res) {
    try {
      const { id } = req.params;

      // Only super_admin can delete other admins
      if (req.admin.type !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can delete admin users'
        });
      }

      // Cannot delete self
      if (parseInt(id) === req.admin.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      await Admin.delete(id);

      res.json({
        success: true,
        message: 'Admin user deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting admin:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete admin user'
      });
    }
  }
}

module.exports = AdminController;

