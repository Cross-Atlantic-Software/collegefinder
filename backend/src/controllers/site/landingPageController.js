const LandingPageContent = require('../../models/LandingPageContent');

class LandingPageController {
  static async getPublic(req, res) {
    try {
      const content = await LandingPageContent.getMerged();
      res.json({ success: true, data: { content } });
    } catch (e) {
      console.error('getPublic landing page:', e);
      res.status(500).json({ success: false, message: 'Failed to load landing page content' });
    }
  }
}

module.exports = LandingPageController;
