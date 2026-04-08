const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const FillProfileController = require('../../controllers/extension/fillProfileController');
const AdaptersController = require('../../controllers/extension/adaptersController');
const FillReportController = require('../../controllers/extension/fillReportController');

// Profile endpoint
router.get('/fill-profile', authenticate, FillProfileController.getFillProfile);

// Adapter endpoints
router.get('/adapters', authenticate, AdaptersController.listAdapters);
router.get('/adapters/detect', authenticate, AdaptersController.detectExam);
router.get('/adapters/:examId', authenticate, AdaptersController.getAdapter);

// Fill report endpoints
router.post('/fill-report', authenticate, FillReportController.submitReport);
router.get('/fill-reports', authenticate, FillReportController.getReports);

module.exports = router;
