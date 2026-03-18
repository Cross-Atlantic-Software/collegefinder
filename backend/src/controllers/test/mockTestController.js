const MockTest = require('../../models/test/MockTest');
const MockQuestion = require('../../models/test/MockQuestion');
const TestAttempt = require('../../models/test/TestAttempt');
const Exam = require('../../models/taxonomy/Exam');
const db = require('../../config/database');

/** Lazy getter for mock generation queue; returns null if bullmq/redis not available (e.g. in Docker without deps). */
function getMockGenerationQueueLazy() {
  try {
    const { getMockGenerationQueue } = require('../../jobs/queues/mockGenerationQueue');
    return getMockGenerationQueue();
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') return null;
    throw err;
  }
}

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

      const numberOfPapers = exam.number_of_papers || 1;
      const completedCount = await MockTestController._countCompletedMocks(userId, examId, numberOfPapers);
      const nextMockNumber = completedCount + 1;

      let mock = await MockTest.findByExamAndNumber(examId, nextMockNumber, 1);

      if (!mock) {
        MockTestController._triggerNextMockGeneration(examId, nextMockNumber, numberOfPapers).catch((err) => {
          console.error(`⚠️  Failed to trigger mock ${nextMockNumber} generation:`, err.message);
        });
        return res.json({
          success: true,
          data: {
            mock: null,
            next_mock_number: nextMockNumber,
            number_of_papers: numberOfPapers,
            status: 'generating',
            message: 'Your mock test is being generated. This takes a few minutes — please check back shortly.',
          },
        });
      }

      return res.json({
        success: true,
        data: {
          mock: {
            id: mock.id,
            order_index: mock.order_index,
            status: mock.status,
            total_questions: mock.total_questions,
          },
          next_mock_number: nextMockNumber,
          completed_mocks: completedCount,
          number_of_papers: numberOfPapers,
          status: mock.status,
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
   * - For multi-paper exams, accepts paper_number in body.
   * - Creates a test_attempt linked to the mock + paper.
   * - Triggers background generation of mock N+1 if it doesn't exist yet.
   *
   * POST /api/mock-tests/exams/:examId/start
   * Body: { paper_number?: number } (defaults to 1)
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

      const numberOfPapers = exam.number_of_papers || 1;
      const paperNumber = parseInt(req.body?.paper_number, 10) || 1;

      if (paperNumber < 1 || paperNumber > numberOfPapers) {
        return res.status(400).json({
          success: false,
          message: `Invalid paper number. This exam has ${numberOfPapers} paper(s).`,
        });
      }

      // --- Progression logic ---
      const completedCount = await MockTestController._countCompletedMocks(userId, examId, numberOfPapers);
      const nextMockNumber = completedCount + 1;

      // For multi-paper exams: enforce that earlier papers are completed before later ones
      if (numberOfPapers > 1 && paperNumber > 1) {
        for (let p = 1; p < paperNumber; p++) {
          const prevPaperMock = await MockTest.findByExamAndNumber(examId, nextMockNumber, p);
          if (!prevPaperMock) {
            return res.status(400).json({
              success: false,
              message: `Paper ${p} must be attempted first.`,
            });
          }
          const prevAttempt = await MockTestController._findCompletedPaperAttempt(userId, prevPaperMock.id, p);
          if (!prevAttempt) {
            return res.status(400).json({
              success: false,
              message: `Complete Paper ${p} before starting Paper ${paperNumber}.`,
            });
          }
        }
      }

      const mock = await MockTest.findByExamAndNumber(examId, nextMockNumber, paperNumber);

      if (!mock) {
        MockTestController._triggerNextMockGeneration(examId, nextMockNumber, numberOfPapers).catch((err) => {
          console.error(`⚠️  Failed to trigger mock ${nextMockNumber} generation:`, err.message);
        });
        return res.status(202).json({
          success: false,
          message: 'Your mock test is being generated. This takes a few minutes — please try again shortly.',
          data: { next_mock_number: nextMockNumber, paper_number: paperNumber, status: 'generating' },
        });
      }

      if (mock.status !== 'ready') {
        const isStuck = mock.status === 'failed' ||
          (mock.status === 'generating' && mock.total_questions === 0);

        if (isStuck) {
          await MockTest.setStatus(mock.id, 'generating');
          const queue = getMockGenerationQueueLazy();
          if (queue) {
            await queue.add('generate', { examId, mockNumber: nextMockNumber, mockTestId: mock.id, paperNumber }, {
              jobId: `mock-gen-${examId}-${nextMockNumber}-p${paperNumber}`,
            });
            console.log(`🔄 Re-triggered mock ${nextMockNumber} p${paperNumber} generation for exam ${examId} (BullMQ)`);
          } else {
            console.log(`🔄 Re-triggering mock ${nextMockNumber} p${paperNumber} generation for exam ${examId} (inline)`);
            const mockId = mock.id;
            setImmediate(() => {
              let runMockGenerationSync;
              try {
                ({ runMockGenerationSync } = require('../../jobs/workers/mockGenerationWorker'));
              } catch (loadErr) {
                console.error('❌ Could not load mockGenerationWorker:', loadErr.message);
                db.query("UPDATE exam_mocks SET status = 'failed' WHERE id = $1", [mockId]).catch(() => {});
                return;
              }
              runMockGenerationSync({ examId, mockNumber: nextMockNumber, mockTestId: mockId, paperNumber })
                .then(() => console.log(`✅ Mock ${nextMockNumber} p${paperNumber} for exam ${examId} generated`))
                .catch((err) => {
                  console.error(`❌ Mock ${nextMockNumber} p${paperNumber} generation failed:`, err.message);
                  db.query("UPDATE exam_mocks SET status = 'failed' WHERE id = $1", [mockId]).catch(() => {});
                });
            });
          }
        }

        return res.status(202).json({
          success: false,
          message: isStuck
            ? 'Generating your mock test. This takes a few minutes — please try again shortly.'
            : 'Mock test is being prepared. Please try again shortly.',
          data: { next_mock_number: nextMockNumber, paper_number: paperNumber, status: 'generating' },
        });
      }

      // --- Check for an existing incomplete attempt for this mock + paper ---
      const existingIncomplete = await MockTestController._findIncompleteAttempt(userId, mock.id, paperNumber);
      if (existingIncomplete) {
        return res.json({
          success: true,
          message: 'Resuming existing mock test attempt',
          data: {
            test_attempt_id: existingIncomplete.id,
            mock_test_id: mock.id,
            order_index: mock.order_index,
            paper_number: paperNumber,
            number_of_papers: numberOfPapers,
            is_resume: true,
          },
        });
      }

      // --- Create test_attempt linked to this mock + paper ---
      const testAttempt = await db.query(`
        INSERT INTO user_exam_attempts (user_id, exam_id, exam_mock_id, test_id, paper_number)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userId, examId, mock.id, null, paperNumber]);

      const attempt = testAttempt.rows[0];

      // --- Trigger generation of mock N+1 (non-blocking) ---
      MockTestController._triggerNextMockGeneration(examId, nextMockNumber + 1, numberOfPapers).catch((err) => {
        console.error(`⚠️  Failed to trigger mock ${nextMockNumber + 1} generation:`, err.message);
      });

      return res.json({
        success: true,
        message: 'Mock test started successfully',
        data: {
          test_attempt_id: attempt.id,
          mock_test_id: mock.id,
          order_index: mock.order_index,
          paper_number: paperNumber,
          number_of_papers: numberOfPapers,
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

      const sanitized = questions.map((q) => ({
        id: q.id,
        mock_question_id: q.mock_question_id,
        mock_id: q.exam_mock_id,
        exam_id: q.exam_id,
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
          order_index: mock.order_index,
          paper_number: mock.paper_number || 1,
          exam_id: mock.exam_id,
          total_questions: mock.total_questions,
          questions: sanitized,
        },
      });
    } catch (error) {
      console.error('Error fetching mock questions:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch mock questions' });
    }
  }

  /**
   * Get paper status for a specific mock number of an exam.
   * Returns the status of each paper (locked/unlocked/completed).
   *
   * GET /api/mock-tests/exams/:examId/mock/:mockNumber/paper-status
   */
  static async getPaperStatus(req, res) {
    try {
      const examId = parseInt(req.params.examId, 10);
      const mockNumber = parseInt(req.params.mockNumber, 10);
      const userId = req.user.id;

      if (Number.isNaN(examId) || examId < 1) {
        return res.status(400).json({ success: false, message: 'Invalid exam ID' });
      }
      if (Number.isNaN(mockNumber) || mockNumber < 1) {
        return res.status(400).json({ success: false, message: 'Invalid mock number' });
      }

      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      const numberOfPapers = exam.number_of_papers || 1;
      const mockRows = await MockTest.findByExamOrderAndPapers(examId, mockNumber);

      const papers = [];
      let previousPaperCompleted = true;

      for (let p = 1; p <= numberOfPapers; p++) {
        const mockRow = mockRows.find(m => m.paper_number === p);
        const mockReady = mockRow && mockRow.status === 'ready';

        let attemptStatus = 'not_started';
        let attemptId = null;
        let attemptData = null;

        if (mockRow) {
          const completedAttempt = await MockTestController._findCompletedPaperAttempt(userId, mockRow.id, p);
          if (completedAttempt) {
            attemptStatus = 'completed';
            attemptId = completedAttempt.id;
            attemptData = {
              total_score: completedAttempt.total_score,
              attempted_count: completedAttempt.attempted_count,
              correct_count: completedAttempt.correct_count,
              incorrect_count: completedAttempt.incorrect_count,
              skipped_count: completedAttempt.skipped_count,
              accuracy_percentage: completedAttempt.accuracy_percentage,
              time_spent_minutes: completedAttempt.time_spent_minutes,
              completed_at: completedAttempt.completed_at,
            };
          } else {
            const incompleteAttempt = await MockTestController._findIncompleteAttempt(userId, mockRow.id, p);
            if (incompleteAttempt) {
              attemptStatus = 'in_progress';
              attemptId = incompleteAttempt.id;
            }
          }
        }

        let paperStatus;
        if (attemptStatus === 'completed') {
          paperStatus = 'completed';
        } else if (!previousPaperCompleted) {
          paperStatus = 'locked';
        } else if (!mockReady) {
          paperStatus = mockRow ? mockRow.status : 'not_generated';
        } else {
          paperStatus = attemptStatus === 'in_progress' ? 'in_progress' : 'unlocked';
        }

        papers.push({
          paper_number: p,
          status: paperStatus,
          mock_id: mockRow?.id || null,
          attempt_id: attemptId,
          attempt_data: attemptData,
          total_questions: mockRow?.total_questions || 0,
        });

        previousPaperCompleted = attemptStatus === 'completed';
      }

      return res.json({
        success: true,
        data: {
          exam_id: examId,
          mock_number: mockNumber,
          number_of_papers: numberOfPapers,
          papers,
        },
      });
    } catch (error) {
      console.error('Error fetching paper status:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch paper status' });
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Count how many mock tests the user has fully completed for a given exam.
   * For multi-paper exams, a mock is "completed" only when ALL papers have completed attempts.
   */
  static async _countCompletedMocks(userId, examId, numberOfPapers = 1) {
    if (numberOfPapers <= 1) {
      const result = await db.query(`
        SELECT COUNT(*) as count
        FROM user_exam_attempts ta
        JOIN exam_mocks mt ON ta.exam_mock_id = mt.id
        WHERE ta.user_id = $1
          AND ta.exam_id = $2
          AND ta.completed_at IS NOT NULL
      `, [userId, examId]);
      return parseInt(result.rows[0].count, 10);
    }

    // Multi-paper: count mock order_indexes where ALL paper_numbers 1..N are completed
    const result = await db.query(`
      SELECT mt.order_index
      FROM user_exam_attempts ta
      JOIN exam_mocks mt ON ta.exam_mock_id = mt.id
      WHERE ta.user_id = $1
        AND ta.exam_id = $2
        AND ta.completed_at IS NOT NULL
      GROUP BY mt.order_index
      HAVING COUNT(DISTINCT mt.paper_number) >= $3
    `, [userId, examId, numberOfPapers]);
    return result.rows.length;
  }

  /**
   * Find an existing incomplete attempt for a user + mock test + paper combination.
   */
  static async _findIncompleteAttempt(userId, mockTestId, paperNumber = 1) {
    const result = await db.query(`
      SELECT * FROM user_exam_attempts
      WHERE user_id = $1
        AND exam_mock_id = $2
        AND paper_number = $3
        AND completed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId, mockTestId, paperNumber]);
    return result.rows[0] || null;
  }

  /**
   * Find a completed attempt for a user + mock test + paper.
   */
  static async _findCompletedPaperAttempt(userId, mockTestId, paperNumber = 1) {
    const result = await db.query(`
      SELECT * FROM user_exam_attempts
      WHERE user_id = $1
        AND exam_mock_id = $2
        AND paper_number = $3
        AND completed_at IS NOT NULL
      ORDER BY completed_at DESC
      LIMIT 1
    `, [userId, mockTestId, paperNumber]);
    return result.rows[0] || null;
  }

  /**
   * Creates exam_mocks rows with status='generating' for all papers of a mock number
   * and either enqueues BullMQ jobs or runs generation inline.
   */
  static async _triggerNextMockGeneration(examId, mockNumber, numberOfPapers = 1) {
    for (let p = 1; p <= numberOfPapers; p++) {
      const created = await MockTest.createGenerating(examId, mockNumber, 'system', p);
      if (!created) continue;

      const queue = getMockGenerationQueueLazy();
      if (queue) {
        await queue.add('generate', { examId, mockNumber, mockTestId: created.id, paperNumber: p }, {
          jobId: `mock-gen-${examId}-${mockNumber}-p${p}`,
        });
        console.log(`🚀 Triggered generation of mock ${mockNumber} paper ${p} for exam ${examId} (BullMQ)`);
      } else {
        console.log(`🚀 Triggering generation of mock ${mockNumber} paper ${p} for exam ${examId} (inline fallback)`);
        const mockId = created.id;
        const paperNum = p;
        setImmediate(() => {
          let runMockGenerationSync;
          try {
            ({ runMockGenerationSync } = require('../../jobs/workers/mockGenerationWorker'));
          } catch (loadErr) {
            console.error('❌ Could not load mockGenerationWorker:', loadErr.message);
            db.query("UPDATE exam_mocks SET status = 'failed' WHERE id = $1", [mockId]).catch(() => {});
            return;
          }
          runMockGenerationSync({ examId, mockNumber, mockTestId: mockId, paperNumber: paperNum })
            .then(() => console.log(`✅ Mock ${mockNumber} paper ${paperNum} for exam ${examId} generated successfully`))
            .catch((err) => {
              console.error(`❌ Mock ${mockNumber} paper ${paperNum} generation failed for exam ${examId}:`, err.message);
              db.query("UPDATE exam_mocks SET status = 'failed' WHERE id = $1", [mockId]).catch(() => {});
            });
        });
      }
    }
  }
}

module.exports = MockTestController;
