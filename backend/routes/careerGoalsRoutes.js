const express = require('express');
const router = express.Router();
const CareerGoalsController = require('../controllers/careerGoalsController');

/**
 * @route   GET /api/career-goals
 * @desc    Get all career goals (public endpoint for users)
 * @access  Public
 */
router.get('/', CareerGoalsController.getAll);

module.exports = router;

