/**
 * User Automation Routes
 * Student-facing routes for exam automation applications
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const automationController = require('../../controllers/user/automationController');

/**
 * @route   GET /api/user/automation-exams
 * @desc    Get available automation exams (active only)
 * @access  Private (authenticated user)
 */
router.get('/automation-exams', authenticate, automationController.getAvailableExams);

/**
 * @route   GET /api/user/automation-applications
 * @desc    Get user's automation applications
 * @access  Private (authenticated user)
 */
router.get('/automation-applications', authenticate, automationController.getMyApplications);

/**
 * @route   GET /api/user/automation-applications/:id
 * @desc    Get single automation application by ID
 * @access  Private (authenticated user)
 */
router.get('/automation-applications/:id', authenticate, automationController.getApplication);

/**
 * @route   POST /api/user/automation-applications
 * @desc    Create a new automation application (auto-approved)
 * @access  Private (authenticated user)
 */
router.post('/automation-applications', authenticate, automationController.createApplication);

/**
 * @route   PUT /api/user/automation-applications/:id
 * @desc    Update automation application (status, session_id)
 * @access  Private (authenticated user)
 */
router.put('/automation-applications/:id', authenticate, automationController.updateApplication);

module.exports = router;
