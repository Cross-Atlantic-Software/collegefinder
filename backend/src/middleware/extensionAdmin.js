/**
 * extensionAdmin middleware
 *
 * The Chrome extension authenticates using the student OTP flow (returns a
 * student JWT). Admin-gated extension endpoints (e.g. POST /extension/adapters/build)
 * need to ensure the OTP-logged-in user is also an admin.
 *
 * Strategy: re-use the existing `authenticate` middleware to decode the
 * student token + load the user, then look up `admin_users` by email.
 * If the email matches an active admin row, mark req.adminFromExtension and proceed.
 */

const Admin = require('../models/admin/Admin');

const requireExtensionAdmin = async (req, res, next) => {
  if (!req.user || !req.user.email) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    const admin = await Admin.findByEmail(req.user.email);
    if (!admin || !admin.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required for this action'
      });
    }
    req.adminFromExtension = admin;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to verify admin status'
    });
  }
};

/**
 * Helper to compute is_admin flag for a user email (used in OTP verify response
 * so the extension knows whether to render the Builder UI).
 */
async function computeIsAdmin(email) {
  if (!email) return false;
  try {
    const admin = await Admin.findByEmail(email);
    return !!(admin && admin.is_active);
  } catch (_) {
    return false;
  }
}

module.exports = {
  requireExtensionAdmin,
  computeIsAdmin
};
