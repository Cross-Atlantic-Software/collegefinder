const User = require('../../models/user/User');

class SiteRegistrationController {
  /**
   * Public: check if email is registered and whether onboarding is done.
   * POST /api/site/check-email  { "email": "a@b.com" }
   */
  static async checkEmail(req, res) {
    try {
      const raw = req.body?.email;
      const email = raw != null ? String(raw).trim().toLowerCase() : '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address.',
        });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.json({
          success: true,
          data: { exists: false, onboardingCompleted: false },
        });
      }

      const ob =
        user.onboarding_completed === true ||
        user.onboarding_completed === 't' ||
        user.onboarding_completed === 1 ||
        user.onboarding_completed === 'true';

      return res.json({
        success: true,
        data: {
          exists: true,
          onboardingCompleted: Boolean(ob),
          hasPassword: Boolean(user.password_hash),
        },
      });
    } catch (error) {
      console.error('site check-email:', error);
      return res.status(500).json({
        success: false,
        message: 'Could not verify email. Try again.',
      });
    }
  }
}

module.exports = SiteRegistrationController;
