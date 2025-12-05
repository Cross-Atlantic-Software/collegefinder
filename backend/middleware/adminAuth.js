const { verifyToken } = require('../utils/auth/jwt');
const Admin = require('../src/models/admin/Admin');

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

module.exports = {
  authenticateAdmin,
  requireSuperAdmin
};


