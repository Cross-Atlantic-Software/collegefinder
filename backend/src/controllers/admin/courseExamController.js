const CourseExam = require('../../models/college/CourseExam');
const { validationResult } = require('express-validator');

class CourseExamController {
  /**
   * Get all course exams
   * GET /api/admin/course-exams
   */
  static async getAllCourseExams(req, res) {
    try {
      const exams = await CourseExam.findAll();
      res.json({
        success: true,
        data: { exams }
      });
    } catch (error) {
      console.error('Error fetching course exams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course exams'
      });
    }
  }

  /**
   * Get exam by ID
   * GET /api/admin/course-exams/:id
   */
  static async getCourseExamById(req, res) {
    try {
      const { id } = req.params;
      const exam = await CourseExam.findById(parseInt(id));

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Course exam not found'
        });
      }

      res.json({
        success: true,
        data: { exam }
      });
    } catch (error) {
      console.error('Error fetching course exam:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course exam'
      });
    }
  }

  /**
   * Create new exam
   * POST /api/admin/course-exams
   */
  static async createCourseExam(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { course_id, exam_name } = req.body;

      const exam = await CourseExam.create({
        course_id: parseInt(course_id),
        exam_name
      });

      res.status(201).json({
        success: true,
        message: 'Course exam created successfully',
        data: { exam }
      });
    } catch (error) {
      console.error('Error creating course exam:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create course exam'
      });
    }
  }

  /**
   * Update exam
   * PUT /api/admin/course-exams/:id
   */
  static async updateCourseExam(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { course_id, exam_name } = req.body;

      const existing = await CourseExam.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Course exam not found'
        });
      }

      const exam = await CourseExam.update(parseInt(id), {
        course_id: course_id ? parseInt(course_id) : undefined,
        exam_name
      });

      res.json({
        success: true,
        message: 'Course exam updated successfully',
        data: { exam }
      });
    } catch (error) {
      console.error('Error updating course exam:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update course exam'
      });
    }
  }

  /**
   * Delete exam
   * DELETE /api/admin/course-exams/:id
   */
  static async deleteCourseExam(req, res) {
    try {
      const { id } = req.params;
      const exam = await CourseExam.findById(parseInt(id));

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Course exam not found'
        });
      }

      await CourseExam.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Course exam deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting course exam:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete course exam'
      });
    }
  }
}

module.exports = CourseExamController;

