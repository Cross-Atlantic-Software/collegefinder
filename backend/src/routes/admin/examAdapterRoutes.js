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

// Discovered-field approval queue (must precede /:examId so it isn't captured)
router.get(
  '/discovered-fields',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  ExamAdapterController.listDiscoveredFields
);

router.post(
  '/discovered-fields',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  requireCanEdit,
  ExamAdapterController.createDiscoveredField
);

router.patch(
  '/discovered-fields/:id',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  requireCanEdit,
  ExamAdapterController.reviewDiscoveredField
);

router.delete(
  '/discovered-fields/:id',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  requireCanDelete,
  ExamAdapterController.deleteDiscoveredField
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

// Admin validation feed — latest validation-run fill report per section
router.get(
  '/:examId/validation',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  ExamAdapterController.getValidationFeed
);

// Mark a validation run as started (approval_status -> in_review)
router.post(
  '/:examId/submit-review',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  requireCanEdit,
  ExamAdapterController.submitReview
);

// Approve — sets approval_status=approved AND publishes the adapter for students
router.post(
  '/:examId/approve',
  authenticateAdmin,
  requireModuleAccess(MODULE_CODE),
  requireCanEdit,
  ExamAdapterController.approve
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
