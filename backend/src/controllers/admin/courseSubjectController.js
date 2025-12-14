const CourseSubject = require('../../models/college/CourseSubject');
const { validationResult } = require('express-validator');

class CourseSubjectController {
  /**
   * Get all course subjects
   * GET /api/admin/course-subjects
   */
  static async getAllCourseSubjects(req, res) {
    try {
      const subjects = await CourseSubject.findAll();
      res.json({
        success: true,
        data: { subjects }
      });
    } catch (error) {
      console.error('Error fetching course subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course subjects'
      });
    }
  }

  /**
   * Get subject by ID
   * GET /api/admin/course-subjects/:id
   */
  static async getCourseSubjectById(req, res) {
    try {
      const { id } = req.params;
      const subject = await CourseSubject.findById(parseInt(id));

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Course subject not found'
        });
      }

      res.json({
        success: true,
        data: { subject }
      });
    } catch (error) {
      console.error('Error fetching course subject:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course subject'
      });
    }
  }

  /**
   * Create new course subject
   * POST /api/admin/course-subjects
   */
  static async createCourseSubject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { course_id, subject_id } = req.body;

      const subject = await CourseSubject.create({
        course_id: parseInt(course_id),
        subject_id: parseInt(subject_id)
      });

      res.status(201).json({
        success: true,
        message: 'Course subject created successfully',
        data: { subject }
      });
    } catch (error) {
      console.error('Error creating course subject:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create course subject'
      });
    }
  }

  /**
   * Update course subject
   * PUT /api/admin/course-subjects/:id
   */
  static async updateCourseSubject(req, res) {
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
      const { course_id, subject_id } = req.body;

      const existing = await CourseSubject.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Course subject not found'
        });
      }

      const subject = await CourseSubject.update(parseInt(id), {
        course_id: course_id ? parseInt(course_id) : undefined,
        subject_id: subject_id ? parseInt(subject_id) : undefined
      });

      res.json({
        success: true,
        message: 'Course subject updated successfully',
        data: { subject }
      });
    } catch (error) {
      console.error('Error updating course subject:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update course subject'
      });
    }
  }

  /**
   * Delete course subject
   * DELETE /api/admin/course-subjects/:id
   */
  static async deleteCourseSubject(req, res) {
    try {
      const { id } = req.params;
      const subject = await CourseSubject.findById(parseInt(id));

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Course subject not found'
        });
      }

      await CourseSubject.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Course subject deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting course subject:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete course subject'
      });
    }
  }
}

module.exports = CourseSubjectController;

