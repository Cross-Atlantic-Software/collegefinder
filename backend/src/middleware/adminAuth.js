const { verifyToken } = require('../../utils/auth/jwt');
const Admin = require('../models/admin/Admin');
const AdminUserModule = require('../models/admin/AdminUserModule');
const Module = require('../models/taxonomy/Module');

/**
 * Admin authentication middleware
 * Verifies JWT token and attaches admin user to request
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    // Get admin from database
    const admin = await Admin.findById(decoded.adminId);
    if (!admin || !admin.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found or inactive'
      });
    }

    // Attach admin to request
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid token'
    });
  }
};

/**
 * Require super admin access
 */
const requireSuperAdmin = async (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  if (req.admin.type !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }
  next();
};

/**
 * Require access to the given module (by code). Super admin bypasses. Data Entry and Admin must have the module assigned.
 */
const requireModuleAccess = (moduleCode) => {
  return async (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    if (req.admin.type === 'super_admin') {
      return next();
    }
    const moduleIds = await AdminUserModule.getModuleIdsByAdminUserId(req.admin.id);
    const mod = await Module.findByCode(moduleCode);
    if (!mod || !moduleIds.includes(mod.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access to this module is not allowed'
      });
    }
    next();
  };
};

/**
 * Only Super Admin can delete. Data Entry and Admin cannot delete.
 */
const requireCanDelete = async (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  if (req.admin.type !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to delete'
    });
  }
  next();
};

/**
 * Only Admin and Super Admin can edit (PUT). Data Entry can only add.
 */
const requireCanEdit = async (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  if (req.admin.type === 'data_entry') {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to edit; Data Entry can only add'
    });
  }
  next();
};

/**
 * Only Super Admin can download Excel templates / export. Admin cannot download.
 */
const requireCanDownloadExcel = async (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  if (req.admin.type !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to download data'
    });
  }
  next();
};

module.exports = {
  authenticateAdmin,
  requireSuperAdmin,
  requireModuleAccess,
  requireCanDelete,
  requireCanEdit,
  requireCanDownloadExcel
};


