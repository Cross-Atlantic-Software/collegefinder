const LegalPageContent = require('../../models/LegalPageContent');

function isValidDocument(body) {
  if (!body || typeof body.document !== 'object' || body.document === null) return false;
  const d = body.document;
  if (!Array.isArray(d.intro) || !Array.isArray(d.sections)) return false;
  return true;
}

class LegalPageAdminController {
  static async get(req, res) {
    try {
      const document = await LegalPageContent.getMerged();
      res.json({ success: true, data: { document } });
    } catch (e) {
      console.error('legal page admin get:', e);
      res.status(500).json({ success: false, message: 'Failed to load legal page content' });
    }
  }

  static async put(req, res) {
    try {
      if (!isValidDocument(req.body)) {
        return res.status(400).json({
          success: false,
          message: 'Request body must include { document: { intro: string[], sections: [...] } }',
        });
      }
      const document = await LegalPageContent.replaceContent(req.body.document);
      res.json({ success: true, data: { document }, message: 'Legal page saved' });
    } catch (e) {
      console.error('legal page admin put:', e);
      res.status(500).json({ success: false, message: e.message || 'Failed to save' });
    }
  }
}

module.exports = LegalPageAdminController;
