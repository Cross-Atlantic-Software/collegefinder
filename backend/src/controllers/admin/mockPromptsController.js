const Exam = require('../../models/taxonomy/Exam');
const ExamMockPrompt = require('../../models/taxonomy/ExamMockPrompt');

/**
 * Mock prompts are stored in exam_mock_prompts (by exam ID).
 * Used by the Mock Prompts admin section; mock generation reads from this table.
 */
class MockPromptsController {
  /**
   * List all exams with their mock prompt
   * GET /api/admin/mock-prompts
   */
  static async list(req, res) {
    try {
      const items = await ExamMockPrompt.getAllWithExams();
      res.json({
        success: true,
        data: { items }
      });
    } catch (error) {
      console.error('Error listing mock prompts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch mock prompts'
      });
    }
  }

  /**
   * Get mock prompt for one exam
   * GET /api/admin/mock-prompts/:examId
   */
  static async get(req, res) {
    try {
      const examId = parseInt(req.params.examId, 10);
      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }
      const prompt = await ExamMockPrompt.getByExamId(examId);
      res.json({
        success: true,
        data: {
          exam_id: examId,
          prompt: prompt || '',
          hasCustomPrompt: !!(prompt && prompt.trim())
        }
      });
    } catch (error) {
      console.error('Error fetching mock prompt:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch mock prompt'
      });
    }
  }

  /**
   * Update mock prompt for an exam
   * PUT /api/admin/mock-prompts/:examId
   */
  static async update(req, res) {
    try {
      const examId = parseInt(req.params.examId, 10);
      const { prompt } = req.body;
      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }
      await ExamMockPrompt.upsert(examId, typeof prompt === 'string' ? prompt : '');
      const updated = await ExamMockPrompt.getByExamId(examId);
      res.json({
        success: true,
        data: { exam_id: examId, prompt: updated || '' },
        message: 'Mock prompt saved successfully'
      });
    } catch (error) {
      console.error('Error updating mock prompt:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save mock prompt'
      });
    }
  }
}

module.exports = MockPromptsController;
