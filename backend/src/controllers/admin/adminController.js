const User = require('../../models/user/User');
const Admin = require('../../models/admin/Admin');
const AdminUserModule = require('../../models/admin/AdminUserModule');
const { generateToken } = require('../../../utils/auth/jwt');
const { validationResult } = require('express-validator');
const { sendAdminWelcomeEmail } = require('../../../utils/email/emailService');

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

      const AdminUserModule = require('../../models/admin/AdminUserModule');
      const Module = require('../../models/taxonomy/Module');
      const moduleIds = (admin.type === 'data_entry' || admin.type === 'admin')
        ? await AdminUserModule.getModuleIdsByAdminUserId(admin.id) : [];
      const moduleCodes = [];
      for (const mid of moduleIds) {
        const mod = await Module.findById(mid);
        if (mod) moduleCodes.push(mod.code);
      }

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
            type: admin.type,
            module_ids: moduleIds,
            module_codes: moduleCodes
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
      const AdminUserModule = require('../../models/admin/AdminUserModule');
      const Module = require('../../models/taxonomy/Module');
      const admin = await Admin.findById(req.admin.id);
      const moduleIds = (admin.type === 'data_entry' || admin.type === 'admin')
        ? await AdminUserModule.getModuleIdsByAdminUserId(admin.id) : [];
      const moduleCodes = [];
      for (const mid of moduleIds) {
        const mod = await Module.findById(mid);
        if (mod) moduleCodes.push(mod.code);
      }
      res.json({
        success: true,
        data: {
          admin: {
            id: admin.id,
            email: admin.email,
            type: admin.type,
            is_active: admin.is_active,
            module_ids: moduleIds,
            module_codes: moduleCodes
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
      
      // Helper function to convert PostgreSQL boolean to JavaScript boolean
      const toBoolean = (value) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lower = value.toLowerCase().trim();
          return lower === 't' || lower === 'true' || lower === '1';
        }
        if (typeof value === 'number') return value === 1;
        return false;
      };
      
      // Ensure boolean values are properly converted
      const formattedUsers = users.map(user => ({
        ...user,
        email_verified: toBoolean(user.email_verified),
        is_active: toBoolean(user.is_active)
      }));
      
      res.json({
        success: true,
        data: {
          users: formattedUsers,
          total: formattedUsers.length
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
      const adminsWithModules = await Promise.all(admins.map(async (admin) => {
        const moduleIds = req.admin.type === 'super_admin'
          ? await AdminUserModule.getModuleIdsByAdminUserId(admin.id)
          : [];
        return { ...admin, module_ids: moduleIds };
      }));
      res.json({
        success: true,
        data: {
          admins: adminsWithModules,
          total: adminsWithModules.length
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

      const { email, password, type = 'data_entry', module_ids } = req.body;

      const existingEmail = await Admin.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      if (req.admin.type !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can create admin users'
        });
      }

      const admin = await Admin.create(email, password, type, req.admin.id);

      if ((type === 'data_entry' || type === 'admin') && Array.isArray(module_ids) && module_ids.length > 0) {
        await AdminUserModule.setModulesForAdminUser(admin.id, module_ids);
      }

      // Send welcome email with credentials (non-blocking; don't fail creation if email fails)
      sendAdminWelcomeEmail(email, password, type).catch((err) => {
        console.error('Failed to send admin welcome email:', err);
      });

      const moduleIds = (type === 'data_entry' || type === 'admin') ? await AdminUserModule.getModuleIdsByAdminUserId(admin.id) : [];
      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: { admin: { ...admin, module_ids: moduleIds } }
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
      const { email, password, type, is_active, module_ids } = req.body;

      if (req.admin.type !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can update admin users'
        });
      }

      const targetAdmin = await Admin.findById(id);
      if (!targetAdmin) {
        return res.status(404).json({
          success: false,
          message: 'Admin user not found'
        });
      }
      if (parseInt(id) === req.admin.id && is_active === false) {
        return res.status(400).json({
          success: false,
          message: 'You cannot disable your own account'
        });
      }

      // Super admin target: only allow is_active (disable access); block type/email/password/modules
      if (targetAdmin.type === 'super_admin') {
        if (is_active !== undefined) {
          const updated = await Admin.updateActiveStatus(id, is_active);
          return res.json({
            success: true,
            message: 'Admin user updated successfully',
            data: { admin: { ...updated, module_ids: [] } }
          });
        }
        return res.status(403).json({
          success: false,
          message: 'Cannot modify super_admin (except access disable)'
        });
      }

      let updatedAdmin = targetAdmin;

      if (email !== undefined && email !== targetAdmin.email) {
        updatedAdmin = await Admin.updateEmail(id, email);
      }
      if (password !== undefined && password.trim() !== '') {
        updatedAdmin = await Admin.updatePassword(id, password);
      }
      if (type !== undefined) {
        updatedAdmin = await Admin.updateType(id, type);
      }
      if (is_active !== undefined) {
        updatedAdmin = await Admin.updateActiveStatus(id, is_active);
      }

      if (updatedAdmin.type === 'data_entry' || updatedAdmin.type === 'admin') {
        if (module_ids !== undefined && Array.isArray(module_ids)) {
          await AdminUserModule.setModulesForAdminUser(id, module_ids);
        }
      } else {
        await AdminUserModule.setModulesForAdminUser(id, []);
      }

      const moduleIds = (updatedAdmin.type === 'data_entry' || updatedAdmin.type === 'admin')
        ? await AdminUserModule.getModuleIdsByAdminUserId(id) : [];
      res.json({
        success: true,
        message: 'Admin user updated successfully',
        data: { admin: { ...updatedAdmin, module_ids: moduleIds } }
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

