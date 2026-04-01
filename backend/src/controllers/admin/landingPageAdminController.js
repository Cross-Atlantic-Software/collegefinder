const LandingPageContent = require('../../models/LandingPageContent');

class LandingPageAdminController {
  static async get(req, res) {
    try {
      const content = await LandingPageContent.getMerged();
      res.json({ success: true, data: { content } });
    } catch (e) {
      console.error('landing page admin get:', e);
      res.status(500).json({ success: false, message: 'Failed to load landing page content' });
    }
  }

  static async put(req, res) {
    try {
      const body = req.body;
      if (!body || typeof body.content !== 'object' || body.content === null) {
        return res.status(400).json({
          success: false,
          message: 'Request body must include a JSON object: { "content": { ... } }',
        });
      }
      const content = await LandingPageContent.replaceContent(body.content);
      res.json({ success: true, data: { content }, message: 'Landing page content saved' });
    } catch (e) {
      console.error('landing page admin put:', e);
      res.status(500).json({ success: false, message: e.message || 'Failed to save' });
    }
  }
}

module.exports = LandingPageAdminController;
