const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireExtensionAdmin } = require('../../middleware/extensionAdmin');
const FillProfileController = require('../../controllers/extension/fillProfileController');
const AdaptersController = require('../../controllers/extension/adaptersController');
const AdapterBuilderController = require('../../controllers/extension/adapterBuilderController');
const FillReportController = require('../../controllers/extension/fillReportController');
const ProfileSyncController = require('../../controllers/extension/profileSyncController');
const FillChargeController = require('../../controllers/extension/fillChargeController');
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

async function deleteAdapterSection(req, res) {
  try {
    const { examId, sectionId } = req.params;

    const row = await db.query(
      'SELECT adapter_config, version FROM exam_adapters WHERE exam_id = $1',
      [examId]
    );
    if (!row.rows[0]) return res.status(404).json({ success: false, message: 'Adapter not found' });

    // adapter_config is JSONB; pg may hand it back as an object or a string.
    let cfg = row.rows[0].adapter_config;
    if (typeof cfg === 'string') { try { cfg = JSON.parse(cfg); } catch { cfg = { sections: [] }; } }
    if (!cfg || typeof cfg !== 'object') cfg = { sections: [] };

    const before = Array.isArray(cfg.sections) ? cfg.sections : [];
    const after = before.filter((s) => s && s.section_id !== sectionId);
    if (after.length === before.length) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    cfg.sections = after;

    const newVersion = (row.rows[0].version || 0) + 1;
    const email = req.adminFromExtension?.email || req.user?.email || null;

    await db.query(
      `UPDATE exam_adapters
          SET adapter_config = $1::jsonb, version = $2,
              updated_by = $3, updated_at = CURRENT_TIMESTAMP
        WHERE exam_id = $4`,
      [JSON.stringify(cfg), newVersion, email, examId]
    );

    res.json({
      success: true,
      data: { exam_id: examId, removed: sectionId, version: newVersion, sections_remaining: after.length }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete section' });
  }
}

// Profile endpoint
router.get('/fill-profile', authenticate, FillProfileController.getFillProfile);
router.patch('/profile', authenticate, ProfileSyncController.updateProfile);   // Phase 2 sync-back

// Adapter endpoints
router.get('/adapters', authenticate, AdaptersController.listAdapters);
router.get('/exams', authenticate, AdaptersController.listCatalog); // full catalog for the manual exam-picker dropdown
router.get('/adapters/registered', AdapterBuilderController.listRegistered); // public — only returns url patterns, no secrets
router.get('/adapters/detect', authenticate, AdaptersController.detectExam);
router.post('/adapters/build', authenticate, requireExtensionAdmin, AdapterBuilderController.buildSection);
router.patch('/adapters/:examId/status', authenticate, requireExtensionAdmin, publishAdapterStatus);
router.delete('/adapters/:examId/sections/:sectionId', authenticate, requireExtensionAdmin, deleteAdapterSection);
router.get('/adapters/:examId', authenticate, AdaptersController.getAdapter);

// Fill report endpoints
router.post('/fill-report', authenticate, FillReportController.submitReport);
router.get('/fill-reports', authenticate, FillReportController.getReports);
router.get('/fill-reports/:id', authenticate, FillReportController.getReportDetail);

// Save & continue: per-section progress for one exam (latest report per section)
router.get('/fill-progress', authenticate, FillReportController.getFillProgress);

// Fees & Credits fill-gate: charge once per application, free across sections.
router.get('/credit-status', authenticate, FillChargeController.getCreditStatus);
router.post('/fill-charge', authenticate, FillChargeController.createFillCharge);
router.post('/fill-charge/complete', authenticate, FillChargeController.completeFillCharge);
router.post('/fill-charge/refund', authenticate, FillChargeController.refundFillCharge);

module.exports = router;
