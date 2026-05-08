const LegalPageContent = require('../../models/LegalPageContent');

class LegalPageSiteController {
  static async getPublic(req, res) {
    try {
      const document = await LegalPageContent.getMerged();
      res.json({ success: true, data: { document } });
    } catch (e) {
      console.error('getPublic legal document:', e);
      res.status(500).json({ success: false, message: 'Failed to load legal content' });
    }
  }
}

module.exports = LegalPageSiteController;
