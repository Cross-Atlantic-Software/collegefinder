const express = require('express');
const router = express.Router();
const PublicApplicationsDirectoryController = require('../../controllers/public/applicationsDirectoryController');

/**
 * @route   GET /api/applications/directory
 * @desc    Public applications preview for marketing directory
 * @access  Public
 */
router.get('/directory', PublicApplicationsDirectoryController.list);

module.exports = router;
