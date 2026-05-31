const express = require('express');
const router = express.Router();
const PublicCollegesController = require('../../controllers/public/collegesController');

/**
 * @route   GET /api/colleges
 * @desc    Colleges for public directory (requires program_id)
 * @access  Public
 */
router.get('/', PublicCollegesController.list);

module.exports = router;
