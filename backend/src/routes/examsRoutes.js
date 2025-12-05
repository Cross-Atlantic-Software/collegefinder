const express = require('express');
const router = express.Router();
const ExamsController = require('../controllers/examsController');

/**
 * @route   GET /api/exams
 * @desc    Get all exams (public endpoint for users)
 * @access  Public
 */
router.get('/', ExamsController.getAll);

module.exports = router;

