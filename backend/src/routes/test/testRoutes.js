const express = require('express');
const router = express.Router();
const TestController = require('../../controllers/test/testController');
const { authenticate } = require('../../middleware/auth');
const { body, param } = require('express-validator');

// Validation middleware for creating tests
const validateCreateTest = [
  body('exam_id')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('test_type')
    .isIn(['full_length', 'subject_wise', 'topic_wise'])
    .withMessage('Test type must be one of: full_length, subject_wise, topic_wise'),
  body('duration_minutes')
    .isInt({ min: 1, max: 600 })
    .withMessage('Duration must be between 1 and 600 minutes'),
  body('total_marks')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total marks must be a non-negative integer')
];

// Validation middleware for getting next question
const validateGetNextQuestion = [
  body('exam_id')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer'),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject must be between 2 and 100 characters'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be one of: easy, medium, hard'),
  body('topic')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Topic must be at most 100 characters'),
  body('question_type')
    .optional()
    .isIn(['mcq', 'numerical'])
    .withMessage('Question type must be one of: mcq, numerical'),
  body('section_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Section name must be between 1 and 100 characters'),
  body('section_type')
    .optional()
    .isIn(['MCQ', 'Numerical'])
    .withMessage('Section type must be MCQ or Numerical')
];

// Validation middleware for submitting answers
const validateSubmitAnswer = [
  body('selected_option')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Selected option must be between 1 and 10 characters'),
  body('time_spent_seconds')
    .optional()
    .isInt({ min: 0, max: 3600 })
    .withMessage('Time spent must be between 0 and 3600 seconds')
];

// Parameter validation
const validateTestId = [
  param('testId')
    .isInt({ min: 1 })
    .withMessage('Test ID must be a positive integer')
];

const validateTestAttemptId = [
  param('testAttemptId')
    .isInt({ min: 1 })
    .withMessage('Test attempt ID must be a positive integer')
];

const validateQuestionId = [
  param('questionId')
    .isInt({ min: 1 })
    .withMessage('Question ID must be a positive integer')
];

const validateExamId = [
  param('examId')
    .isInt({ min: 1 })
    .withMessage('Exam ID must be a positive integer')
];

// Test management routes
/**
 * @route   GET /api/tests
 * @desc    Get all tests
 * @access  Private
 */
router.get('/', authenticate, TestController.getAllTests);

/**
 * @route   GET /api/tests/:testId
 * @desc    Get test by ID
 * @access  Private
 */
router.get('/:testId', authenticate, validateTestId, TestController.getTestById);

/**
 * @route   GET /api/tests/exams/:examId
 * @desc    Get tests by exam ID
 * @access  Private
 */
router.get('/exams/:examId', authenticate, validateExamId, TestController.getTestsByExam);

/**
 * @route   POST /api/tests/exams/:examId/start
 * @desc    Start a practice test by exam (finds or creates default test)
 * @access  Private
 */
router.post('/exams/:examId/start', authenticate, validateExamId, TestController.startTestByExam);

/**
 * @route   POST /api/tests
 * @desc    Create new test (admin only)
 * @access  Private (Admin)
 */
router.post('/', authenticate, validateCreateTest, TestController.createTest);

// Test attempt routes
/**
 * @route   POST /api/tests/:testId/start
 * @desc    Start a test attempt by test ID
 * @access  Private
 */
router.post('/:testId/start', authenticate, validateTestId, TestController.startTest);

/**
 * @route   POST /api/tests/attempts/:testAttemptId/next-question
 * @desc    Get next question for test attempt
 * @access  Private
 */
router.post('/attempts/:testAttemptId/next-question', 
  authenticate, 
  validateTestAttemptId, 
  validateGetNextQuestion, 
  TestController.getNextQuestion
);

/**
 * @route   POST /api/tests/attempts/:testAttemptId/questions/:questionId/submit
 * @desc    Submit answer for a question
 * @access  Private
 */
router.post('/attempts/:testAttemptId/questions/:questionId/submit',
  authenticate,
  validateTestAttemptId,
  validateQuestionId,
  validateSubmitAnswer,
  TestController.submitAnswer
);

/**
 * @route   POST /api/tests/attempts/:testAttemptId/complete
 * @desc    Complete test attempt and calculate final scores
 * @access  Private
 */
router.post('/attempts/:testAttemptId/complete',
  authenticate,
  validateTestAttemptId,
  TestController.completeTest
);

// Results and history routes
/**
 * @route   GET /api/tests/attempts/:testAttemptId/results
 * @desc    Get test attempt results
 * @access  Private
 */
router.get('/attempts/:testAttemptId/results',
  authenticate,
  validateTestAttemptId,
  TestController.getTestResults
);

/**
 * @route   GET /api/tests/history
 * @desc    Get user's test history
 * @access  Private
 */
router.get('/history', authenticate, TestController.getUserTestHistory);

// Format-specific routes
/**
 * @route   GET /api/tests/exams/:examId/formats
 * @desc    Get available formats for an exam
 * @access  Private
 */
router.get('/exams/:examId/formats', authenticate, validateExamId, TestController.getExamFormats);

/**
 * @route   POST /api/tests/exams/:examId/formats/:formatId/start
 * @desc    Start a format-specific test attempt
 * @access  Private
 */
router.post('/exams/:examId/formats/:formatId/start', 
  authenticate, 
  validateExamId,
  [
    param('formatId')
      .notEmpty()
      .withMessage('Format ID is required')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Format ID must be between 1 and 100 characters')
  ],
  TestController.startTestByExam
);

/**
 * @route   GET /api/tests/exams/:examId/formats/:formatId/rules
 * @desc    Get format-specific test rules and configuration
 * @access  Private
 */
router.get('/exams/:examId/formats/:formatId/rules',
  authenticate,
  validateExamId,
  [
    param('formatId')
      .notEmpty()
      .withMessage('Format ID is required')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Format ID must be between 1 and 100 characters')
  ],
  TestController.getTestRules
);

/**
 * @route   GET /api/tests/attempts/:testAttemptId/sections/:sectionName/next-question
 * @desc    Get next question for a specific section
 * @access  Private
 */
router.post('/attempts/:testAttemptId/sections/:sectionName/next-question',
  authenticate,
  validateTestAttemptId,
  [
    param('sectionName')
      .notEmpty()
      .withMessage('Section name is required')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Section name must be between 1 and 100 characters'),
    body('exam_id')
      .isInt({ min: 1 })
      .withMessage('Exam ID must be a positive integer'),
    body('subject')
      .notEmpty()
      .withMessage('Subject is required')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Subject must be between 2 and 100 characters'),
    body('difficulty')
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be one of: easy, medium, hard'),
    body('section_type')
      .optional()
      .isIn(['MCQ', 'Numerical'])
      .withMessage('Section type must be MCQ or Numerical'),
    body('topic')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Topic must be at most 100 characters'),
    body('question_type')
      .optional()
      .isIn(['mcq', 'numerical'])
      .withMessage('Question type must be mcq or numerical')
  ],
  TestController.getNextQuestion
);

/**
 * @route   GET /api/tests/attempts/:testAttemptId/progress
 * @desc    Get section-wise progress for test attempt
 * @access  Private
 */
router.get('/attempts/:testAttemptId/progress',
  authenticate,
  validateTestAttemptId,
  TestController.getSectionProgress
);

// Utility routes
/**
 * @route   GET /api/tests/utils/test-gemini
 * @desc    Test Gemini service (for debugging)
 * @access  Private
 */
router.get('/utils/test-gemini', authenticate, TestController.testGeminiService);

module.exports = router;