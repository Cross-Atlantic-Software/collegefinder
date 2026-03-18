const express = require('express');
const router = express.Router();
const MockTestController = require('../../controllers/test/mockTestController');
const { authenticate } = require('../../middleware/auth');
const { param } = require('express-validator');

const validateExamId = [
  param('examId')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer'),
];

const validateMockTestId = [
  param('mockTestId')
    .isInt({ min: 1 })
    .withMessage('Mock test ID must be a positive integer'),
];

const validateMockNumber = [
  param('mockNumber')
    .isInt({ min: 1 })
    .withMessage('Mock number must be a positive integer'),
];

/**
 * @route   GET /api/mock-tests/exams/:examId/next
 * @desc    Get the next mock test for the authenticated user (based on progression)
 * @access  Private
 */
router.get(
  '/exams/:examId/next',
  authenticate,
  validateExamId,
  MockTestController.getNextMock
);

/**
 * @route   POST /api/mock-tests/exams/:examId/start
 * @desc    Start a mock test attempt; triggers background generation of the next mock
 * @access  Private
 */
router.post(
  '/exams/:examId/start',
  authenticate,
  validateExamId,
  MockTestController.startMockTest
);

/**
 * @route   GET /api/mock-tests/exams/:examId/mock/:mockNumber/paper-status
 * @desc    Get paper status for a specific mock number (locked/unlocked/completed per paper)
 * @access  Private
 */
router.get(
  '/exams/:examId/mock/:mockNumber/paper-status',
  authenticate,
  validateExamId,
  validateMockNumber,
  MockTestController.getPaperStatus
);

/**
 * @route   GET /api/mock-tests/:mockTestId/questions
 * @desc    Get all questions for a mock test (sanitized — no correct answers)
 * @access  Private
 */
router.get(
  '/:mockTestId/questions',
  authenticate,
  validateMockTestId,
  MockTestController.getMockQuestions
);

module.exports = router;
