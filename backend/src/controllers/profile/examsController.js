const Exam = require('../../models/taxonomy/Exam');
const UserExamPreferences = require('../../models/user/UserExamPreferences');

class ExamsTaxonomyController {
  /**
   * Get all exams (for users - public endpoint)
   * GET /api/exams
   */
  static async getAll(req, res) {
    try {
      const exams = await Exam.findAll();
      res.json({
        success: true,
        data: { exams }
      });
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exams'
      });
    }
  }

  /**
   * Get all exams (for admin)
   * GET /api/admin/exams
   */
  static async getAllAdmin(req, res) {
    try {
      const exams = await Exam.findAll();
      res.json({
        success: true,
        data: { exams }
      });
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exams'
      });
    }
  }

  /**
   * Get exam by ID (for admin)
   * GET /api/admin/exams/:id
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const exam = await Exam.findById(parseInt(id));

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found'
        });
      }

      res.json({
        success: true,
        data: { exam }
      });
    } catch (error) {
      console.error('Error fetching exam:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exam'
      });
    }
  }

  /**
   * Create new exam (for admin)
   * POST /api/admin/exams
   */
  static async create(req, res) {
    try {
      const { name, code, description } = req.body;

      // Validate required fields
      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: 'Name and code are required'
        });
      }

      // Check if name or code already exists
      const existingByName = await Exam.findByName(name);
      if (existingByName) {
        return res.status(400).json({
          success: false,
          message: 'Exam with this name already exists'
        });
      }

      const existingByCode = await Exam.findByCode(code);
      if (existingByCode) {
        return res.status(400).json({
          success: false,
          message: 'Exam with this code already exists'
        });
      }

      const exam = await Exam.create({ name, code, description });
      res.status(201).json({
        success: true,
        data: { exam },
        message: 'Exam created successfully'
      });
    } catch (error) {
      console.error('Error creating exam:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create exam'
      });
    }
  }

  /**
   * Update exam (for admin)
   * PUT /api/admin/exams/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, code, description } = req.body;

      const existing = await Exam.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found'
        });
      }

      // Check if name or code conflicts with another exam
      if (name && name !== existing.name) {
        const duplicate = await Exam.findByName(name);
        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: 'Exam with this name already exists'
          });
        }
      }

      if (code && code !== existing.code) {
        const duplicate = await Exam.findByCode(code);
        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: 'Exam with this code already exists'
          });
        }
      }

      const exam = await Exam.update(parseInt(id), { name, code, description });
      res.json({
        success: true,
        data: { exam },
        message: 'Exam updated successfully'
      });
    } catch (error) {
      console.error('Error updating exam:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update exam'
      });
    }
  }

  /**
   * Delete exam (for admin)
   * DELETE /api/admin/exams/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const exam = await Exam.findById(parseInt(id));

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found'
        });
      }

      await Exam.delete(parseInt(id));
      res.json({
        success: true,
        message: 'Exam deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting exam:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete exam'
      });
    }
  }

  /**
   * Get user's exam preferences
   * GET /api/auth/profile/exam-preferences
   */
  static async getExamPreferences(req, res) {
    try {
      const userId = req.user.id;
      const userExamPreferences = await UserExamPreferences.findByUserId(userId);

      if (!userExamPreferences) {
        return res.json({
          success: true,
          data: {
            target_exams: [],
            previous_attempts: []
          }
        });
      }

      let targetExams = [];
      if (userExamPreferences.target_exams) {
        targetExams = Array.isArray(userExamPreferences.target_exams)
          ? userExamPreferences.target_exams.map(id => id.toString())
          : [userExamPreferences.target_exams.toString()];
      }

      let previousAttempts = [];
      if (userExamPreferences.previous_attempts) {
        previousAttempts = Array.isArray(userExamPreferences.previous_attempts)
          ? userExamPreferences.previous_attempts
          : JSON.parse(userExamPreferences.previous_attempts);
      }

      res.json({
        success: true,
        data: {
          target_exams: targetExams,
          previous_attempts: previousAttempts
        }
      });
    } catch (error) {
      console.error('Error fetching exam preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exam preferences'
      });
    }
  }

  /**
   * Update user's exam preferences
   * PUT /api/auth/profile/exam-preferences
   */
  static async updateExamPreferences(req, res) {
    try {
      const userId = req.user.id;
      const { target_exams, previous_attempts } = req.body;

      // Validate previous_attempts structure
      if (previous_attempts && Array.isArray(previous_attempts)) {
        for (const attempt of previous_attempts) {
          if (!attempt.exam_id || !attempt.year) {
            return res.status(400).json({
              success: false,
              message: 'Each previous attempt must have exam_id and year'
            });
          }
        }
      }

      const userExamPreferences = await UserExamPreferences.upsert(userId, {
        target_exams,
        previous_attempts
      });

      let targetExams = [];
      if (userExamPreferences.target_exams) {
        targetExams = Array.isArray(userExamPreferences.target_exams)
          ? userExamPreferences.target_exams.map(id => id.toString())
          : [userExamPreferences.target_exams.toString()];
      }

      let previousAttempts = [];
      if (userExamPreferences.previous_attempts) {
        previousAttempts = Array.isArray(userExamPreferences.previous_attempts)
          ? userExamPreferences.previous_attempts
          : JSON.parse(userExamPreferences.previous_attempts);
      }

      res.json({
        success: true,
        data: {
          target_exams: targetExams,
          previous_attempts: previousAttempts
        },
        message: 'Exam preferences updated successfully'
      });
    } catch (error) {
      console.error('Error updating exam preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update exam preferences'
      });
    }
  }
}

module.exports = ExamsTaxonomyController;

