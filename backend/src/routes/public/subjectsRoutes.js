const express = require('express');
const router = express.Router();
const SubjectsController = require('../../controllers/profile/subjectsController');

/**
 * @route   GET /api/subjects
 * @desc    Get all active subjects (public endpoint)
 * @access  Public
 */
router.get('/', SubjectsController.getAll);

module.exports = router;

