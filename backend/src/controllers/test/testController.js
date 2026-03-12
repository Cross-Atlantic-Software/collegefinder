const Test = require('../../models/test/Test');
const Question = require('../../models/test/Question');
const TestAttempt = require('../../models/test/TestAttempt');
const QuestionAttempt = require('../../models/test/QuestionAttempt');
const geminiService = require('../../services/geminiService');
const Exam = require('../../models/taxonomy/Exam');
const { validationResult } = require('express-validator');

class TestController {
  /**
   * Get all tests
   */
  static async getAllTests(req, res) {
    try {
      const tests = await Test.findAll();
      
      res.json({
        success: true,
        data: { tests }
      });
    } catch (error) {
      console.error('Error fetching tests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tests'
      });
    }
  }

  /**
   * Get test by ID
   */
  static async getTestById(req, res) {
    try {
      const testId = parseInt(req.params.testId, 10);
      if (Number.isNaN(testId) || testId < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid test ID'
        });
      }
      const test = await Test.findById(testId);
      
      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Test not found'
        });
      }

      res.json({
        success: true,
        data: { test }
      });
    } catch (error) {
      console.error('Error fetching test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test'
      });
    }
  }

  /**
   * Get tests by exam ID
   */
  static async getTestsByExam(req, res) {
    try {
      const { examId } = req.params;
      const tests = await Test.findByExamId(parseInt(examId));
      
      res.json({
        success: true,
        data: { tests }
      });
    } catch (error) {
      console.error('Error fetching tests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tests'
      });
    }
  }

  /**
   * Create a new test
   */
  static async createTest(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { exam_id, title, test_type, duration_minutes, total_marks } = req.body;
      
      // Verify exam exists
      const exam = await Exam.findById(exam_id);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found'
        });
      }

      const test = await Test.create({
        exam_id,
        title,
        test_type,
        duration_minutes,
        total_marks
      });

      res.status(201).json({
        success: true,
        message: 'Test created successfully',
        data: { test }
      });
    } catch (error) {
      console.error('Error creating test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test'
      });
    }
  }

  /**
   * Start a practice test by exam ID (finds or creates a default test for the exam)
   */
  static async startTestByExam(req, res) {
    try {
      const { examId, formatId } = req.params;
      const { format_id } = req.body;
      const format_id_to_use = formatId || format_id;
      const userId = req.user.id;
      const examIdInt = parseInt(examId);

      // Verify exam exists
      const exam = await Exam.findByIdWithFormat(examIdInt);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found'
        });
      }

      // If format_id is provided, validate it exists in exam format
      let formatConfig = null;
      if (format_id_to_use) {
        formatConfig = await Exam.getFormatConfig(examIdInt, format_id_to_use);
        if (!formatConfig) {
          return res.status(400).json({
            success: false,
            message: 'Invalid format for this exam'
          });
        }
      }

      // Find existing test for this exam and format, or create one
      let tests = await Test.findByExamId(examIdInt);
      let test = null;
      
      if (format_id_to_use) {
        test = tests.find(t => t.format_id === format_id_to_use);
      } else {
        test = tests.find(t => !t.format_id) || tests[0];
      }

      if (!test) {
        // Create format-specific test
        const testData = {
          exam_id: examIdInt,
          format_id: format_id_to_use || null,
          title: format_id_to_use ? `${formatConfig.name} - Practice Test` : `Practice Test - ${exam.name}`,
          test_type: 'full_length',
          duration_minutes: formatConfig ? formatConfig.duration_minutes : 60,
          total_marks: formatConfig ? formatConfig.total_marks : 0
        };

        // Add sections configuration if format is available
        if (formatConfig && formatConfig.sections) {
          testData.sections = formatConfig.sections;
        }

        test = await Test.create(testData);
      }

      // Reuse startTest logic: check incomplete attempt, then create attempt
      const existingAttempts = await TestAttempt.findUserTestAttempts(userId, test.id);
      const incompleteAttempt = existingAttempts.find(attempt => !attempt.completed_at);

      if (incompleteAttempt) {
        return res.json({
          success: true,
          message: 'Resuming existing test attempt',
          data: {
            test_attempt_id: incompleteAttempt.id,
            is_resume: true
          }
        });
      }

      const testAttempt = await TestAttempt.create({
        user_id: userId,
        test_id: test.id,
        exam_id: examIdInt
      });

      res.json({
        success: true,
        message: 'Test started successfully',
        data: {
          test_attempt_id: testAttempt.id,
          is_resume: false
        }
      });
    } catch (error) {
      console.error('Error starting test by exam:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start test'
      });
    }
  }

  /**
   * Start a test attempt (by test ID)
   */
  static async startTest(req, res) {
    try {
      const { testId } = req.params;
      const userId = req.user.id;
      
      // Verify test exists
      const test = await Test.findById(parseInt(testId));
      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Test not found'
        });
      }

      // Check if user already has an incomplete attempt for this test
      const existingAttempts = await TestAttempt.findUserTestAttempts(userId, parseInt(testId));
      const incompleteAttempt = existingAttempts.find(attempt => !attempt.completed_at);
      
      if (incompleteAttempt) {
        return res.json({
          success: true,
          message: 'Resuming existing test attempt',
          data: { 
            test_attempt_id: incompleteAttempt.id,
            is_resume: true
          }
        });
      }

      // Create new test attempt
      const testAttempt = await TestAttempt.create({
        user_id: userId,
        test_id: parseInt(testId),
        exam_id: test.exam_id
      });

      res.json({
        success: true,
        message: 'Test started successfully',
        data: { 
          test_attempt_id: testAttempt.id,
          is_resume: false
        }
      });
    } catch (error) {
      console.error('Error starting test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start test'
      });
    }
  }

  /**
   * Get next question for a test attempt
   * This is the core function that implements the question retrieval logic with Gemini fallback
   */
  static async getNextQuestion(req, res) {
    try {
      const { testAttemptId } = req.params;
      const { exam_id, subject, difficulty, topic, question_type = 'mcq', section_name, section_type } = req.body;
      const userId = req.user.id;

      // Verify test attempt belongs to user
      const testAttempt = await TestAttempt.findById(parseInt(testAttemptId));
      if (!testAttempt) {
        return res.status(404).json({
          success: false,
          message: 'Test attempt not found'
        });
      }

      if (testAttempt.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access to test attempt'
        });
      }

      // Check if test is already completed
      if (testAttempt.completed_at) {
        return res.status(400).json({
          success: false,
          message: 'Test attempt is already completed'
        });
      }

      // Get questions already attempted in this test
      const attemptedQuestions = await QuestionAttempt.findByTestAttemptId(parseInt(testAttemptId));
      const attemptedQuestionIds = attemptedQuestions.map(qa => qa.question_id);

      let selectedQuestion = null;

      // 1) First: any existing unattempted question for this exam + subject + section (any difficulty)
      const anyDifficultyFilters = {
        exam_id,
        subject,
        question_type,
        limit: 10
      };
      if (section_name) anyDifficultyFilters.section_name = section_name;
      if (section_type) anyDifficultyFilters.section_type = section_type;

      let questions = await Question.findByFilters(anyDifficultyFilters);
      questions = questions.filter(q => !attemptedQuestionIds.includes(q.id));

      if (questions.length > 0) {
        selectedQuestion = questions[0];
        console.log(`✅ Using existing unattempted question (ID: ${selectedQuestion.id}) for ${subject} - ${selectedQuestion.difficulty} (any difficulty)`);
      }

      // 2) If none found, try matching requested difficulty (and topic/section) as before
      if (!selectedQuestion) {
        const filters = {
          exam_id,
          subject,
          difficulty,
          topic,
          question_type,
          limit: 10
        };
        if (section_name) filters.section_name = section_name;
        if (section_type) filters.section_type = section_type;

        questions = await Question.findByFilters(filters);
        questions = questions.filter(q => !attemptedQuestionIds.includes(q.id));

        if (questions.length === 0 && (section_name || section_type)) {
          const relaxedFilters = { exam_id, subject, difficulty, topic, question_type, limit: 10 };
          const relaxedQuestions = await Question.findByFilters(relaxedFilters);
          questions = relaxedQuestions.filter(q => !attemptedQuestionIds.includes(q.id));
          if (questions.length > 0) {
            console.log(`✅ Found ${questions.length} existing question(s) without section match - using for ${subject}`);
          }
        }

        if (questions.length > 0) {
          selectedQuestion = questions[0];
          console.log(`✅ Found existing question (ID: ${selectedQuestion.id}) for ${subject} - ${difficulty}`);
        }
      }

      if (!selectedQuestion) {
        // Generate new question using Gemini
        try {
          console.log(`🤖 No existing questions found, generating new question for ${subject} - ${difficulty}`);
          
          const exam = await Exam.findById(exam_id);
          if (!exam) {
            return res.status(404).json({
              success: false,
              message: 'Exam not found'
            });
          }

          const questionData = await geminiService.generateQuestion({
            exam_name: exam.name,
            subject,
            difficulty,
            topic,
            question_type,
            section_name,
            section_type
          });

          // Save generated question to database
          const newQuestion = await Question.create({
            exam_id,
            ...questionData
          });
          
          selectedQuestion = newQuestion;
          console.log(`✅ Generated and saved new question (ID: ${newQuestion.id})`);
          
        } catch (geminiError) {
          console.error('❌ Failed to generate question with Gemini:', geminiError);
          
          // Fallback: try to get any question from the same exam and subject (ignoring difficulty/topic)
          const fallbackQuestions = await Question.findByFilters({
            exam_id,
            subject,
            limit: 10
          });
          
          const availableFallback = fallbackQuestions.filter(q => !attemptedQuestionIds.includes(q.id));
          
          if (availableFallback.length > 0) {
            selectedQuestion = availableFallback[0];
            console.log(`⚠️  Using fallback question (ID: ${selectedQuestion.id})`);
          } else {
            return res.status(500).json({
              success: false,
              message: 'Failed to generate question and no fallback questions available',
              error: geminiError.message
            });
          }
        }
      }

      // Increment usage count
      await Question.incrementUsageCount(selectedQuestion.id);

      // Prepare question data for frontend (without correct answer)
      const questionForFrontend = {
        id: selectedQuestion.id,
        question_text: selectedQuestion.question_text,
        options: typeof selectedQuestion.options === 'string' 
          ? JSON.parse(selectedQuestion.options) 
          : selectedQuestion.options,
        marks: selectedQuestion.marks,
        difficulty: selectedQuestion.difficulty,
        subject: selectedQuestion.subject,
        topic: selectedQuestion.topic,
        question_type: selectedQuestion.question_type,
        negative_marks: selectedQuestion.negative_marks,
        image_url: selectedQuestion.image_url || null
      };

      res.json({
        success: true,
        data: {
          question: questionForFrontend,
          attempt_order: attemptedQuestions.length + 1,
          total_attempted: attemptedQuestions.length
        }
      });

    } catch (error) {
      console.error('Error getting next question:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get next question'
      });
    }
  }

  /**
   * Submit answer for a question
   */
  static async submitAnswer(req, res) {
    try {
      const { testAttemptId, questionId } = req.params;
      const { selected_option, time_spent_seconds } = req.body;
      const userId = req.user.id;

      // Verify test attempt belongs to user
      const testAttempt = await TestAttempt.findById(parseInt(testAttemptId));
      if (!testAttempt || testAttempt.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access to test attempt'
        });
      }

      // Get question to check correct answer
      const question = await Question.findById(parseInt(questionId));
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      // Check for unknown question type and send alert email (don't let this break submit)
      try {
        const emailAlertService = require('../../services/emailAlertService');
        await emailAlertService.sendUnknownQuestionTypeAlert(question.question_type, question.id, {
          subject: question.subject,
          difficulty: question.difficulty,
          topic: question.topic
        });
      } catch (emailErr) {
        console.warn('Email alert skipped:', emailErr?.message);
      }

      // Check if already answered with a real answer (selected_option != null)
      // Pre-inserted empty rows (from mock test flow) have selected_option = null and are not considered "answered"
      const existingAttempts = await QuestionAttempt.findByTestAttemptId(parseInt(testAttemptId));
      const qIdNum = parseInt(questionId, 10);
      const existingForQuestion = existingAttempts.find(qa => Number(qa.question_id) === qIdNum);
      const alreadyAnswered = existingForQuestion && existingForQuestion.selected_option !== null;

      if (alreadyAnswered) {
        return res.status(400).json({
          success: false,
          message: 'Question already answered'
        });
      }

      // Determine if answer is correct based on question type
      let isCorrect = false;
      const selectedStr = selected_option == null ? '' : (typeof selected_option === 'string' ? selected_option : JSON.stringify(selected_option));
      const qType = question.question_type || 'mcq_single';
      const correctOption = question.correct_option != null ? String(question.correct_option) : '';

      switch (qType) {
        case 'mcq_single':
        case 'numerical':
        case 'true_false':
        case 'fill_blank':
        case 'assertion_reason':
          isCorrect = selectedStr === correctOption;
          break;

        case 'mcq_multiple':
          try {
            const selected = Array.isArray(selected_option) ? [...selected_option].sort() : JSON.parse(selectedStr || '[]');
            const correct = typeof question.correct_option === 'string' && question.correct_option.startsWith('[')
              ? JSON.parse(question.correct_option)
              : [question.correct_option];
            const correctSorted = Array.isArray(correct) ? [...correct].sort() : [correct];
            const selSorted = Array.isArray(selected) ? [...selected].sort() : [selected];
            isCorrect = JSON.stringify(selSorted) === JSON.stringify(correctSorted);
          } catch (e) {
            isCorrect = false;
          }
          break;

        case 'match_following':
          try {
            const selectedMatches = typeof selected_option === 'object' ? selected_option : (selectedStr ? JSON.parse(selectedStr) : {});
            const correctMatches = typeof question.correct_option === 'object' ? question.correct_option : (question.correct_option ? JSON.parse(question.correct_option) : {});
            isCorrect = JSON.stringify(selectedMatches) === JSON.stringify(correctMatches);
          } catch (e) {
            isCorrect = false;
          }
          break;

        case 'paragraph':
          isCorrect = selectedStr === correctOption;
          break;

        default:
          console.warn(`Unknown question type: ${qType}`);
          isCorrect = selectedStr === correctOption;
      }

      // Attempt order: use existing order if row was pre-inserted, otherwise assign next order
      const answeredCount = existingAttempts.filter(qa => qa.selected_option != null && qa.selected_option !== '').length;
      const attemptOrder = existingForQuestion != null ? Number(existingForQuestion.attempt_order) : answeredCount + 1;

      // Get exam_id and mock_id from test_attempt
      const testAttemptRecord = await TestAttempt.findById(parseInt(testAttemptId));
      const examId = testAttemptRecord.exam_id;
      const mockId = testAttemptRecord.exam_mock_id ?? testAttemptRecord.mock_test_id ?? null;

      // Upsert: updates pre-inserted empty rows OR inserts new row (old flow)
      const questionAttempt = await QuestionAttempt.upsert({
        user_id: userId,
        question_id: parseInt(questionId),
        test_attempt_id: parseInt(testAttemptId),
        exam_id: examId,
        mock_id: mockId,
        selected_option: selectedStr, // Store as string for all types
        is_correct: isCorrect,
        time_spent_seconds: time_spent_seconds || 0,
        attempt_order: attemptOrder
      });

      res.json({
        success: true,
        message: 'Answer submitted successfully',
        data: {
          is_correct: isCorrect,
          correct_option: question.correct_option != null ? String(question.correct_option) : '',
          solution_text: question.solution_text || '',
          marks_awarded: isCorrect ? question.marks : -question.negative_marks
        }
      });

    } catch (error) {
      console.error('Error submitting answer:', error?.message || error);
      if (error?.stack) console.error(error.stack);
      res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' && error?.message ? error.message : 'Failed to submit answer'
      });
    }
  }

  /**
   * Complete test attempt and calculate final scores
   */
  static async completeTest(req, res) {
    try {
      const { testAttemptId } = req.params;
      const userId = req.user.id;

      // Verify test attempt belongs to user
      const testAttempt = await TestAttempt.findById(parseInt(testAttemptId));
      if (!testAttempt || testAttempt.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access to test attempt'
        });
      }

      if (testAttempt.completed_at) {
        return res.status(400).json({
          success: false,
          message: 'Test attempt is already completed'
        });
      }

      // Get all question attempts for this test
      const questionAttempts = await QuestionAttempt.findByTestAttemptId(parseInt(testAttemptId));
      
      // Calculate basic statistics
      const stats = await QuestionAttempt.getTestAttemptStats(parseInt(testAttemptId));
      const subjectStats = await QuestionAttempt.getSubjectWiseStats(parseInt(testAttemptId));
      const difficultyStats = await QuestionAttempt.getDifficultyWiseStats(parseInt(testAttemptId));

      // Calculate total score
      let totalScore = 0;
      for (const qa of questionAttempts) {
        const question = await Question.findById(qa.question_id);
        if (qa.is_correct) {
          totalScore += question.marks;
        } else if (qa.selected_option) { // Only apply negative marking if an option was selected
          totalScore -= question.negative_marks;
        }
      }

      // Prepare subject-wise and difficulty-wise stats
      const subjectWiseStats = {};
      subjectStats.forEach(stat => {
        subjectWiseStats[stat.subject] = {
          total_questions: parseInt(stat.total_questions),
          attempted: parseInt(stat.attempted_questions),
          correct: parseInt(stat.correct_answers),
          incorrect: parseInt(stat.incorrect_answers),
          accuracy: parseFloat(stat.accuracy_percentage) || 0,
          avg_time: parseFloat(stat.avg_time_per_question) || 0
        };
      });

      const difficultyWiseStats = {};
      difficultyStats.forEach(stat => {
        difficultyWiseStats[stat.difficulty] = {
          total_questions: parseInt(stat.total_questions),
          attempted: parseInt(stat.attempted_questions),
          correct: parseInt(stat.correct_answers),
          incorrect: parseInt(stat.incorrect_answers),
          accuracy: parseFloat(stat.accuracy_percentage) || 0,
          avg_time: parseFloat(stat.avg_time_per_question) || 0
        };
      });

      // Complete the test attempt
      const completedAttempt = await TestAttempt.complete(parseInt(testAttemptId), {
        total_score: Math.max(0, totalScore), // Ensure score doesn't go negative
        attempted_count: parseInt(stats.attempted_questions),
        correct_count: parseInt(stats.correct_answers),
        incorrect_count: parseInt(stats.incorrect_answers),
        skipped_count: parseInt(stats.skipped_questions),
        accuracy_percentage: parseFloat(stats.accuracy_percentage) || 0,
        time_spent_minutes: Math.ceil(parseInt(stats.total_time_seconds) / 60),
        subject_wise_stats: subjectWiseStats,
        difficulty_wise_stats: difficultyWiseStats
      });

      // Calculate and update rankings
      await TestAttempt.updateRankings(parseInt(testAttemptId));

      // Get updated attempt with rankings
      const finalAttempt = await TestAttempt.getWithDetails(parseInt(testAttemptId));

      res.json({
        success: true,
        message: 'Test completed successfully',
        data: {
          test_attempt: finalAttempt,
          summary: {
            total_score: finalAttempt.total_score,
            total_questions: parseInt(stats.total_questions),
            attempted: parseInt(stats.attempted_questions),
            correct: parseInt(stats.correct_answers),
            incorrect: parseInt(stats.incorrect_answers),
            skipped: parseInt(stats.skipped_questions),
            accuracy: parseFloat(stats.accuracy_percentage) || 0,
            percentile: finalAttempt.percentile,
            rank: finalAttempt.rank_position,
            time_taken: finalAttempt.time_spent_minutes
          }
        }
      });

    } catch (error) {
      console.error('Error completing test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete test'
      });
    }
  }

  /**
   * Get test attempt results
   */
  static async getTestResults(req, res) {
    try {
      const { testAttemptId } = req.params;
      const userId = req.user.id;

      // Verify test attempt belongs to user
      const testAttempt = await TestAttempt.getWithDetails(parseInt(testAttemptId));
      if (!testAttempt || testAttempt.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access to test results'
        });
      }

      // Get question attempts with details
      const questionAttempts = await QuestionAttempt.findByTestAttemptId(parseInt(testAttemptId));

      res.json({
        success: true,
        data: {
          test_attempt: testAttempt,
          question_attempts: questionAttempts
        }
      });

    } catch (error) {
      console.error('Error fetching test results:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test results'
      });
    }
  }

  /**
   * Get user's test history
   */
  static async getUserTestHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const testAttempts = await TestAttempt.findByUserId(userId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: { test_attempts: testAttempts }
      });

    } catch (error) {
      console.error('Error fetching test history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test history'
      });
    }
  }

  /**
   * Test Gemini service (for debugging)
   */
  static async testGeminiService(req, res) {
    try {
      const result = await geminiService.testService();
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error testing Gemini service:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test Gemini service',
        error: error.message
      });
    }
  }

  /**
   * Get available formats for an exam
   */
  static async getExamFormats(req, res) {
    try {
      const { examId } = req.params;
      const examIdInt = parseInt(examId);

      const formats = await Exam.getFormats(examIdInt);
      
      if (!formats) {
        return res.json({
          success: true,
          data: { formats: {} },
          message: 'No formats configured for this exam'
        });
      }

      res.json({
        success: true,
        data: { formats }
      });
    } catch (error) {
      console.error('Error fetching exam formats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exam formats'
      });
    }
  }

  /**
   * Get section-wise progress for a test attempt
   */
  static async getSectionProgress(req, res) {
    try {
      const { testAttemptId } = req.params;
      const userId = req.user.id;

      // Verify test attempt belongs to user
      const testAttempt = await TestAttempt.findById(parseInt(testAttemptId));
      if (!testAttempt) {
        return res.status(404).json({
          success: false,
          message: 'Test attempt not found'
        });
      }

      if (testAttempt.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access to test attempt'
        });
      }

      // Get question attempts for this test
      const questionAttempts = await QuestionAttempt.findByTestAttemptId(parseInt(testAttemptId));
      
      // Get test details to understand format structure
      const test = await Test.findById(testAttempt.test_id);
      
      // Calculate section-wise progress
      const sectionProgress = {};
      
      if (test && test.sections && Object.keys(test.sections).length > 0) {
        // Format-based test - calculate progress by sections
        for (const [sectionKey, sectionConfig] of Object.entries(test.sections)) {
          const sectionAttempts = questionAttempts.filter(qa => {
            // Match by section_name in question attempts
            return qa.question && qa.question.section_name === sectionKey;
          });

          const totalQuestions = Object.values(sectionConfig.subsections || {})
            .reduce((sum, subsection) => sum + (subsection.questions || 0), 0);

          sectionProgress[sectionKey] = {
            name: sectionConfig.name,
            attempted: sectionAttempts.length,
            total: totalQuestions,
            correct: sectionAttempts.filter(qa => qa.is_correct).length,
            marks_scored: sectionAttempts.reduce((sum, qa) => sum + (qa.is_correct ? qa.marks || 0 : 0), 0),
            total_marks: sectionConfig.marks || 0
          };
        }
      } else {
        // Legacy test - calculate by subject
        const subjects = [...new Set(questionAttempts.map(qa => qa.question?.subject).filter(Boolean))];
        
        for (const subject of subjects) {
          const subjectAttempts = questionAttempts.filter(qa => qa.question?.subject === subject);
          
          sectionProgress[subject] = {
            name: subject,
            attempted: subjectAttempts.length,
            total: subjectAttempts.length, // We don't know the total for legacy tests
            correct: subjectAttempts.filter(qa => qa.is_correct).length,
            marks_scored: subjectAttempts.reduce((sum, qa) => sum + (qa.is_correct ? qa.marks || 0 : 0), 0)
          };
        }
      }

      res.json({
        success: true,
        data: {
          section_progress: sectionProgress,
          overall: {
            total_attempted: questionAttempts.length,
            total_correct: questionAttempts.filter(qa => qa.is_correct).length,
            total_marks: questionAttempts.reduce((sum, qa) => sum + (qa.is_correct ? qa.marks || 0 : 0), 0)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching section progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch section progress'
      });
    }
  }

  /**
   * Build format baseline from a regular test's sections.
   */
  static _getFormatBaseline(test) {
    if (!test) return null;
    const sections = typeof test.sections === 'string' ? JSON.parse(test.sections || '{}') : (test.sections || {});
    const totalMarks = parseInt(test.total_marks, 10) || 0;
    if (Object.keys(sections).length === 0) return { total_marks: totalMarks, total_questions: 0, subjects: [] };

    const subjects = [];
    let totalQuestions = 0;
    for (const [key, config] of Object.entries(sections)) {
      const name = config?.name || key;
      const subsections = config?.subsections || {};
      const sectionQuestions = Object.values(subsections).reduce((sum, sub) => sum + (sub?.questions || 0), 0);
      const sectionMarks = parseInt(config?.marks, 10) || 0;
      subjects.push({ key, name, total_questions: sectionQuestions, total_marks: sectionMarks });
      totalQuestions += sectionQuestions;
    }
    return { total_marks: totalMarks, total_questions: totalQuestions, subjects };
  }

  /**
   * Build format baseline from an exam's format JSON (used for mock tests that have no test_id).
   * Supports both the seeded format shape (total_questions, total_marks, sections.X.total_questions)
   * and the old shape (sections.X.subsections.Y.questions).
   */
  static _getMockFormatBaseline(exam) {
    if (!exam) return null;
    const fmt = typeof exam.format === 'string' ? JSON.parse(exam.format || '{}') : (exam.format || {});
    if (!fmt || Object.keys(fmt).length === 0) return null;

    // Top-level totals
    const totalMarks = parseInt(fmt.total_marks, 10) || 0;
    let totalQuestions = parseInt(fmt.total_questions, 10) || 0;

    const sections = fmt.sections || {};
    const subjects = [];
    let computedTotal = 0;

    for (const [key, config] of Object.entries(sections)) {
      const name = config?.name || key;
      // Support both shapes
      let sectionQuestions = parseInt(config?.total_questions, 10) || 0;
      if (!sectionQuestions && config?.subsections) {
        sectionQuestions = Object.values(config.subsections).reduce(
          (sum, sub) => sum + (parseInt(sub?.count, 10) || parseInt(sub?.questions, 10) || 0),
          0
        );
      }
      const sectionMarks = parseInt(config?.marks, 10) || parseInt(config?.total_marks, 10) || 0;
      subjects.push({ key, name, total_questions: sectionQuestions, total_marks: sectionMarks });
      computedTotal += sectionQuestions;
    }

    if (!totalQuestions) totalQuestions = computedTotal;

    return { total_marks: totalMarks, total_questions: totalQuestions, subjects };
  }

  /**
   * Get per-attempt analytics (full matrix breakdown).
   * Supports both regular tests (with test_id) and mock tests (with exam_mock_id).
   */
  static async getAttemptAnalytics(req, res) {
    try {
      const { testAttemptId } = req.params;
      const userId = req.user.id;

      const testAttempt = await TestAttempt.getWithDetails(parseInt(testAttemptId));
      if (!testAttempt || testAttempt.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access to test attempt'
        });
      }

      if (!testAttempt.completed_at) {
        return res.status(400).json({
          success: false,
          message: 'Test attempt is not yet completed'
        });
      }

      // Determine format baseline — prefer regular test, fall back to exam format for mock tests
      const test = testAttempt.test_id ? await Test.findById(testAttempt.test_id) : null;
      let formatBaseline = TestController._getFormatBaseline(test);
      if (!formatBaseline && testAttempt.exam_id) {
        const exam = await Exam.findById(testAttempt.exam_id);
        formatBaseline = TestController._getMockFormatBaseline(exam);
      }

      const [overallStats, subjectStats, topicStats, subTopicStats, negMarks] = await Promise.all([
        QuestionAttempt.getTestAttemptStats(parseInt(testAttemptId)),
        QuestionAttempt.getSubjectWiseStats(parseInt(testAttemptId)),
        QuestionAttempt.getTopicWiseStats(parseInt(testAttemptId)),
        QuestionAttempt.getSubTopicWiseStats(parseInt(testAttemptId)),
        QuestionAttempt.getNegativeMarksStats(parseInt(testAttemptId))
      ]);

      const attempted = parseInt(overallStats.attempted_questions) || 0;
      const correct = parseInt(overallStats.correct_answers) || 0;
      const incorrect = parseInt(overallStats.incorrect_answers) || 0;
      const skipped = parseInt(overallStats.skipped_questions) || 0;
      const totalTimeSecs = parseInt(overallStats.total_time_seconds) || 0;
      const negativeLost = parseFloat(negMarks?.total_negative_marks_lost) || 0;

      const formatTotalQuestions = formatBaseline && formatBaseline.total_questions > 0
        ? formatBaseline.total_questions
        : parseInt(overallStats.total_questions) || 0;
      const formatTotalMarks = formatBaseline && formatBaseline.total_marks > 0
        ? formatBaseline.total_marks
        : (test && parseInt(test.total_marks, 10)) || 0;

      const overall = {
        total_questions: formatTotalQuestions,
        attempted,
        correct,
        incorrect,
        skipped,
        attempt_rate: formatTotalQuestions > 0 ? parseFloat(((attempted / formatTotalQuestions) * 100).toFixed(2)) : 0,
        accuracy_percentage: attempted > 0 ? parseFloat(overallStats.accuracy_percentage) || 0 : 0,
        total_score: testAttempt.total_score,
        total_marks: formatTotalMarks,
        percentile: parseFloat(testAttempt.percentile) || null,
        rank_position: testAttempt.rank_position || null,
        total_time_seconds: totalTimeSecs,
        avg_time_per_question: attempted > 0 ? parseFloat((totalTimeSecs / attempted).toFixed(2)) : 0,
        negative_marks_lost: negativeLost
      };

      const formatDimension = (rows, groupKey) => rows.map(r => ({
        label: r[groupKey] || 'Unknown',
        subject: r.subject || null,
        topic: r.topic || null,
        total_questions: parseInt(r.total_questions) || 0,
        attempted: parseInt(r.attempted_questions) || 0,
        correct: parseInt(r.correct_answers) || 0,
        incorrect: parseInt(r.incorrect_answers) || 0,
        skipped: parseInt(r.skipped_questions) || 0,
        attempt_rate: parseInt(r.total_questions) > 0
          ? parseFloat(((parseInt(r.attempted_questions) / parseInt(r.total_questions)) * 100).toFixed(2))
          : 0,
        accuracy_percentage: parseFloat(r.accuracy_percentage) || 0,
        total_time_seconds: parseInt(r.total_time_seconds) || 0,
        avg_time_per_question: parseInt(r.attempted_questions) > 0
          ? parseFloat((parseInt(r.total_time_seconds) / parseInt(r.attempted_questions)).toFixed(2))
          : 0,
        negative_marks_lost: parseFloat(r.negative_marks_lost) || 0
      }));

      let bySubject = formatDimension(subjectStats, 'subject');
      if (formatBaseline && formatBaseline.subjects && formatBaseline.subjects.length > 0) {
        const subjectStatsByLabel = bySubject.reduce((acc, row) => {
          acc[row.label] = row;
          return acc;
        }, {});
        bySubject = formatBaseline.subjects.map(({ name, total_questions, total_marks }) => {
          const existing = subjectStatsByLabel[name];
          if (existing) {
            return {
              ...existing,
              total_questions,
              attempt_rate: total_questions > 0
                ? parseFloat(((existing.attempted / total_questions) * 100).toFixed(2))
                : 0
            };
          }
          return {
            label: name,
            subject: name,
            topic: null,
            total_questions,
            attempted: 0,
            correct: 0,
            incorrect: 0,
            skipped: 0,
            attempt_rate: 0,
            accuracy_percentage: 0,
            total_time_seconds: 0,
            avg_time_per_question: 0,
            negative_marks_lost: 0
          };
        });
      }

      res.json({
        success: true,
        data: {
          attempt: {
            id: testAttempt.id,
            test_title: testAttempt.test_title,
            exam_name: testAttempt.exam_name,
            completed_at: testAttempt.completed_at,
            duration_minutes: testAttempt.duration_minutes
          },
          format_baseline: formatBaseline ? {
            total_marks: formatBaseline.total_marks,
            total_questions: formatBaseline.total_questions
          } : null,
          overall,
          by_subject: bySubject,
          by_topic: formatDimension(topicStats, 'topic'),
          by_sub_topic: formatDimension(subTopicStats, 'sub_topic')
        }
      });
    } catch (error) {
      console.error('Error fetching attempt analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attempt analytics'
      });
    }
  }

  /**
   * Get aggregate analytics summary for current user
   */
  static async getUserAnalyticsSummary(req, res) {
    try {
      const userId = req.user.id;
      const { examId } = req.query;

      const examIdInt = examId ? parseInt(examId) : null;

      const [aggregate, attempts] = await Promise.all([
        TestAttempt.getUserAnalytics(userId, examIdInt),
        TestAttempt.findByUserId(userId, 50, 0)
      ]);

      let completedAttempts = attempts.filter(a => a.completed_at);
      if (examIdInt != null) {
        completedAttempts = completedAttempts.filter(a => a.exam_id === examIdInt);
      }

      res.json({
        success: true,
        data: {
          aggregate: {
            total_attempts: parseInt(aggregate.total_attempts) || 0,
            completed_attempts: parseInt(aggregate.completed_attempts) || 0,
            avg_score: parseFloat(aggregate.avg_score) || 0,
            best_score: parseFloat(aggregate.best_score) || 0,
            avg_accuracy: parseFloat(aggregate.avg_accuracy) || 0,
            avg_time_minutes: parseFloat(aggregate.avg_time) || 0
          },
          attempts: completedAttempts.map(a => ({
            id: a.id,
            exam_id: a.exam_id,
            test_title: a.test_title,
            exam_name: a.exam_name,
            total_score: a.total_score,
            accuracy_percentage: parseFloat(a.accuracy_percentage) || 0,
            percentile: parseFloat(a.percentile) || null,
            rank_position: a.rank_position || null,
            attempted_count: a.attempted_count,
            correct_count: a.correct_count,
            incorrect_count: a.incorrect_count,
            skipped_count: a.skipped_count,
            time_spent_minutes: a.time_spent_minutes,
            subject_wise_stats: a.subject_wise_stats,
            completed_at: a.completed_at
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching user analytics summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics summary'
      });
    }
  }

  /**
   * Get format-specific test rules
   */
  static async getTestRules(req, res) {
    try {
      const { examId, formatId } = req.params;
      const examIdInt = parseInt(examId);

      const formatConfig = await Exam.getFormatConfig(examIdInt, formatId);
      
      if (!formatConfig) {
        return res.status(404).json({
          success: false,
          message: 'Format not found for this exam'
        });
      }

      res.json({
        success: true,
        data: {
          format: formatConfig,
          rules: formatConfig.rules || [],
          marking_scheme: formatConfig.marking_scheme || {},
          sections: formatConfig.sections || {}
        }
      });
    } catch (error) {
      console.error('Error fetching test rules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test rules'
      });
    }
  }
}

module.exports = TestController;