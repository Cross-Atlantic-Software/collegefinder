const express = require('express');
const router = express.Router();
const ExamsController = require('../../controllers/profile/examsController');

/**
 * @route   GET /api/exams
 * @desc    Get all exams (public endpoint for users)
 * @access  Public
 */
router.get('/', ExamsController.getAll);

/**
 * @route   GET /api/exams/count
 * @desc    Total exam count (lightweight; sidebar badges)
 * @access  Public
 */
router.get('/count', ExamsController.getCount);

/**
 * @route   GET /api/exams/:id
 * @desc    Single exam by id, code, name, or slug (enriched)
 * @access  Public
 */
router.get('/:id', ExamsController.getById);

module.exports = router;

