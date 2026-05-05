const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireExtensionAdmin } = require('../../middleware/extensionAdmin');
const FillProfileController = require('../../controllers/extension/fillProfileController');
const AdaptersController = require('../../controllers/extension/adaptersController');
const AdapterBuilderController = require('../../controllers/extension/adapterBuilderController');
const FillReportController = require('../../controllers/extension/fillReportController');

// Profile endpoint
router.get('/fill-profile', authenticate, FillProfileController.getFillProfile);

// Adapter endpoints
router.get('/adapters', authenticate, AdaptersController.listAdapters);
router.get('/adapters/registered', authenticate, AdapterBuilderController.listRegistered);
router.get('/adapters/detect', authenticate, AdaptersController.detectExam);
router.post('/adapters/build', authenticate, requireExtensionAdmin, AdapterBuilderController.buildSection);
router.get('/adapters/:examId', authenticate, AdaptersController.getAdapter);

// Fill report endpoints
router.post('/fill-report', authenticate, FillReportController.submitReport);
router.get('/fill-reports', authenticate, FillReportController.getReports);

module.exports = router;
