const MockTest = require('../../models/test/MockTest');
const MockQuestion = require('../../models/test/MockQuestion');
const TestAttempt = require('../../models/test/TestAttempt');
const QuestionAttempt = require('../../models/test/QuestionAttempt');
const Question = require('../../models/test/Question');
const Exam = require('../../models/taxonomy/Exam');
const db = require('../../config/database');
const { getMockGenerationQueue } = require('../../jobs/queues/mockGenerationQueue');

class MockTestController {
  /**
   * Determine and return the next mock for the authenticated user on a given exam.
   * The mock number is based on how many mocks the user has completed for this exam.
   *
   * GET /api/mock-tests/exams/:examId/next
   */
  static async getNextMock(req, res) {
    try {
      const examId = parseInt(req.params.examId, 10);
      const userId = req.user.id;

      if (Number.isNaN(examId) || examId < 1) {
        return res.status(400).json({ success: false, message: 'Invalid exam ID' });
      }

      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      const completedCount = await MockTestController._countCompletedMocks(userId, examId);
      const nextMockNumber = completedCount + 1;

      const mock = await MockTest.findByExamAndNumber(examId, nextMockNumber);

      if (!mock) {
        return res.json({
          success: true,
          data: {
            mock: null,
            next_mock_number: nextMockNumber,
            status: 'not_generated',
            message: 'No mock test available yet. Please try again shortly.',
          },
        });
      }

      return res.json({
        success: true,
        data: {
          mock: {
            id: mock.id,
            mock_number: mock.mock_number,
            status: mock.status,
            total_questions: mock.total_questions,
          },
          next_mock_number: nextMockNumber,
          completed_mocks: completedCount,
        },
      });
    } catch (error) {
      console.error('Error fetching next mock:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch next mock' });
    }
  }

  /**
   * Start a mock test attempt for the authenticated user.
   * - Resolves the user's next mock (completed + 1).
   * - Creates a test_attempt linked to the mock.
   * - Pre-inserts empty question_attempts for every question in the mock.
   * - Triggers background generation of mock N+1 if it doesn't exist yet.
   *
   * POST /api/mock-tests/exams/:examId/start
   */
  static async startMockTest(req, res) {
    try {
      const examId = parseInt(req.params.examId, 10);
      const userId = req.user.id;

      if (Number.isNaN(examId) || examId < 1) {
        return res.status(400).json({ success: false, message: 'Invalid exam ID' });
      }

      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      // --- Progression logic ---
      const completedCount = await MockTestController._countCompletedMocks(userId, examId);
      const nextMockNumber = completedCount + 1;

      const mock = await MockTest.findByExamAndNumber(examId, nextMockNumber);

      if (!mock) {
        return res.status(503).json({
          success: false,
          message: 'Mock test not available yet. Please try again in a moment.',
          data: { next_mock_number: nextMockNumber, status: 'not_generated' },
        });
      }

      if (mock.status !== 'ready') {
        return res.status(503).json({
          success: false,
          message: mock.status === 'generating'
            ? 'Mock test is being prepared. Please try again shortly.'
            : 'Mock test generation failed. Please contact support.',
          data: { next_mock_number: nextMockNumber, status: mock.status },
        });
      }

      // --- Check for an existing incomplete attempt for this mock ---
      const existingIncomplete = await MockTestController._findIncompleteAttempt(userId, mock.id);
      if (existingIncomplete) {
        return res.json({
          success: true,
          message: 'Resuming existing mock test attempt',
          data: {
            test_attempt_id: existingIncomplete.id,
            mock_test_id: mock.id,
            mock_number: mock.mock_number,
            is_resume: true,
          },
        });
      }

      // --- Create test_attempt linked to this mock ---
      const testAttempt = await db.query(`
        INSERT INTO test_attempts (user_id, exam_id, mock_test_id, test_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [userId, examId, mock.id, null]);

      const attempt = testAttempt.rows[0];

      // --- Pre-insert empty question_attempts for all questions in the mock ---
      const mockQuestions = await MockQuestion.findByMockTestId(mock.id);

      if (mockQuestions.length > 0) {
        const emptyAttempts = mockQuestions.map((mq, idx) => ({
          user_id: userId,
          question_id: mq.id,  // q.id from q.* in findByMockTestId JOIN result
          test_attempt_id: attempt.id,
          selected_option: null,
          is_correct: false,
          time_spent_seconds: 0,
          attempt_order: idx + 1,
        }));

        await QuestionAttempt.bulkCreate(emptyAttempts);
      }

      // --- Trigger generation of mock N+1 (non-blocking) ---
      MockTestController._triggerNextMockGeneration(examId, nextMockNumber + 1).catch((err) => {
        console.error(`⚠️  Failed to trigger mock ${nextMockNumber + 1} generation:`, err.message);
      });

      return res.json({
        success: true,
        message: 'Mock test started successfully',
        data: {
          test_attempt_id: attempt.id,
          mock_test_id: mock.id,
          mock_number: mock.mock_number,
          total_questions: mock.total_questions,
          is_resume: false,
        },
      });
    } catch (error) {
      console.error('Error starting mock test:', error);
      return res.status(500).json({ success: false, message: 'Failed to start mock test' });
    }
  }

  /**
   * Get questions for a specific mock test (for the test interface to load all at once).
   * Strips correct_option and solution_text before returning.
   *
   * GET /api/mock-tests/:mockTestId/questions
   */
  static async getMockQuestions(req, res) {
    try {
      const mockTestId = parseInt(req.params.mockTestId, 10);
      const userId = req.user.id;

      if (Number.isNaN(mockTestId) || mockTestId < 1) {
        return res.status(400).json({ success: false, message: 'Invalid mock test ID' });
      }

      const mock = await MockTest.findById(mockTestId);
      if (!mock) {
        return res.status(404).json({ success: false, message: 'Mock test not found' });
      }
      if (mock.status !== 'ready') {
        return res.status(503).json({ success: false, message: 'Mock test is not ready yet' });
      }

      const questions = await MockQuestion.findByMockTestId(mockTestId);

      // Strip sensitive fields before sending to client
      const sanitized = questions.map((q) => ({
        id: q.id,
        mock_question_id: q.mock_question_id,
        order_index: q.order_index,
        question_text: q.question_text,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        marks: q.marks,
        negative_marks: q.negative_marks,
        difficulty: q.difficulty,
        subject: q.subject,
        topic: q.topic,
        question_type: q.question_type,
        section_name: q.section_name,
        section_type: q.section_type,
        image_url: q.image_url || null,
      }));

      return res.json({
        success: true,
        data: {
          mock_test_id: mockTestId,
          mock_number: mock.mock_number,
          total_questions: mock.total_questions,
          questions: sanitized,
        },
      });
    } catch (error) {
      console.error('Error fetching mock questions:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch mock questions' });
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Count how many mock tests the user has fully completed for a given exam.
   * A test_attempt is "completed" when completed_at IS NOT NULL.
   */
  static async _countCompletedMocks(userId, examId) {
    const result = await db.query(`
      SELECT COUNT(*) as count
      FROM test_attempts ta
      JOIN mock_tests mt ON ta.mock_test_id = mt.id
      WHERE ta.user_id = $1
        AND ta.exam_id = $2
        AND ta.completed_at IS NOT NULL
    `, [userId, examId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Find an existing incomplete attempt for a user + mock test combination.
   */
  static async _findIncompleteAttempt(userId, mockTestId) {
    const result = await db.query(`
      SELECT * FROM test_attempts
      WHERE user_id = $1
        AND mock_test_id = $2
        AND completed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId, mockTestId]);
    return result.rows[0] || null;
  }

  /**
   * Creates a mock_tests record with status='generating' and enqueues a BullMQ job.
   * The UNIQUE(exam_id, mock_number) constraint on mock_tests prevents duplicate generation.
   */
  static async _triggerNextMockGeneration(examId, mockNumber) {
    const created = await MockTest.createGenerating(examId, mockNumber, 'system');
    if (!created) {
      // Row already existed — generation is already in progress or done
      return;
    }

    const queue = getMockGenerationQueue();
    await queue.add('generate', {
      examId,
      mockNumber,
      mockTestId: created.id,
    });

    console.log(`🚀 Triggered generation of mock ${mockNumber} for exam ${examId}`);
  }
}

module.exports = MockTestController;
