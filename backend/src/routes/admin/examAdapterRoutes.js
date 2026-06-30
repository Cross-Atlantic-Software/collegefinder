const express = require('express');
const router = express.Router();
const ExamAdapterController = require('../../controllers/admin/examAdapterController');
const {
  authenticateAdmin,
  requireModuleAccess,
  requireCanDelete,
  requireCanEdit
} = require('../../middleware/adminAuth');

const MODULE_CODE = 'exam_adapters';

// Profile schema (used by the editor's `source` dropdown)
router.get(
  '/profile-schema',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  ExamAdapterController.getProfileSchema
);

// List all adapters
router.get(
  '/',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  ExamAdapterController.list
);

// Register a new exam stub
router.post(
  '/',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  ExamAdapterController.create
);

// Import a complete adapter from a pasted/uploaded JSON file (upsert + optional publish)
router.post(
  '/import',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  requireCanEdit,
  ExamAdapterController.importAdapter
);

// Single adapter
router.get(
  '/:examId',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  ExamAdapterController.getOne
);

// Replace adapter config / metadata
router.put(
  '/:examId',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  requireCanEdit,
  ExamAdapterController.update
);

// Patch a single section
router.patch(
  '/:examId/sections/:sectionId',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  requireCanEdit,
  ExamAdapterController.patchSection
);

// Publish / unpublish
router.patch(
  '/:examId/status',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  requireCanEdit,
  ExamAdapterController.patchStatus
);

// Delete
router.delete(
  '/:examId',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  requireCanDelete,
  ExamAdapterController.remove
);

module.exports = router;
