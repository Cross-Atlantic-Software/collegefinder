const { generateSocialContent } = require('../../services/social/socialContentService');

class SocialController {
  static async generate(req, res, next) {
    try {
      const { thoughts, accountType, previousPosts } = req.body || {};

      const result = await generateSocialContent({
        thoughts,
        accountType,
        previousPosts: Array.isArray(previousPosts) ? previousPosts : [],
      });

      res.json({ success: true, data: result });
    } catch (err) {
      if (res.headersSent) {
        return next(err);
      }
      const status = err.statusCode || 500;
      if (status >= 500) {
        console.error('[social/generate]', err.message, err.cause || '');
      }
      try {
        res.status(status).json({
          success: false,
          message: err.message || 'Generation failed',
        });
      } catch (sendErr) {
        next(sendErr);
      }
    }
  }
}

module.exports = SocialController;
