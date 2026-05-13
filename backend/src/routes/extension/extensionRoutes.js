const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireExtensionAdmin } = require('../../middleware/extensionAdmin');
const FillProfileController = require('../../controllers/extension/fillProfileController');
const AdaptersController = require('../../controllers/extension/adaptersController');
const AdapterBuilderController = require('../../controllers/extension/adapterBuilderController');
const FillReportController = require('../../controllers/extension/fillReportController');
const db = require('../../config/database');

async function publishAdapterStatus(req, res) {
  try {
    const { examId } = req.params;
    const { status } = req.body || {};
    if (status !== 'draft' && status !== 'published') {
      return res.status(400).json({ success: false, message: 'status must be "draft" or "published"' });
    }
    const isActive = status === 'published';
    const email = req.adminFromExtension?.email || req.user?.email || null;
    const result = await db.query(
      `UPDATE exam_adapters
          SET status = $1, is_active = $2,
              last_verified_at = CASE WHEN $1 = 'published' THEN CURRENT_TIMESTAMP ELSE last_verified_at END,
              last_verified_by = CASE WHEN $1 = 'published' THEN $3 ELSE last_verified_by END,
              updated_by = $3, updated_at = CURRENT_TIMESTAMP
        WHERE exam_id = $4 RETURNING *`,
      [status, isActive, email, examId]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Adapter not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update status' });
  }
}

// Profile endpoint
router.get('/fill-profile', authenticate, FillProfileController.getFillProfile);

// Adapter endpoints
router.get('/adapters', authenticate, AdaptersController.listAdapters);
router.get('/adapters/registered', AdapterBuilderController.listRegistered); // public — only returns url patterns, no secrets
router.get('/adapters/detect', authenticate, AdaptersController.detectExam);
router.post('/adapters/build', authenticate, requireExtensionAdmin, AdapterBuilderController.buildSection);
router.patch('/adapters/:examId/status', authenticate, requireExtensionAdmin, publishAdapterStatus);
router.get('/adapters/:examId', authenticate, AdaptersController.getAdapter);

// Fill report endpoints
router.post('/fill-report', authenticate, FillReportController.submitReport);
router.get('/fill-reports', authenticate, FillReportController.getReports);

module.exports = router;
