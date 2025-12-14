const CourseCutoff = require('../../models/college/CourseCutoff');
const { validationResult } = require('express-validator');

class CourseCutoffController {
  /**
   * Get all course cutoffs
   * GET /api/admin/course-cutoffs
   */
  static async getAllCourseCutoffs(req, res) {
    try {
      const cutoffs = await CourseCutoff.findAll();
      res.json({
        success: true,
        data: { cutoffs }
      });
    } catch (error) {
      console.error('Error fetching course cutoffs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course cutoffs'
      });
    }
  }

  /**
   * Get cutoff by ID
   * GET /api/admin/course-cutoffs/:id
   */
  static async getCourseCutoffById(req, res) {
    try {
      const { id } = req.params;
      const cutoff = await CourseCutoff.findById(parseInt(id));

      if (!cutoff) {
        return res.status(404).json({
          success: false,
          message: 'Course cutoff not found'
        });
      }

      res.json({
        success: true,
        data: { cutoff }
      });
    } catch (error) {
      console.error('Error fetching course cutoff:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course cutoff'
      });
    }
  }

  /**
   * Create new cutoff
   * POST /api/admin/course-cutoffs
   */
  static async createCourseCutoff(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { course_id, exam_id, year, category_id, cutoff_value } = req.body;

      const cutoff = await CourseCutoff.create({
        course_id: parseInt(course_id),
        exam_id: parseInt(exam_id),
        year: parseInt(year),
        category_id: category_id ? parseInt(category_id) : null,
        cutoff_value: parseFloat(cutoff_value)
      });

      res.status(201).json({
        success: true,
        message: 'Course cutoff created successfully',
        data: { cutoff }
      });
    } catch (error) {
      console.error('Error creating course cutoff:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create course cutoff'
      });
    }
  }

  /**
   * Update cutoff
   * PUT /api/admin/course-cutoffs/:id
   */
  static async updateCourseCutoff(req, res) {
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
      const { course_id, exam_id, year, category_id, cutoff_value } = req.body;

      const existing = await CourseCutoff.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Course cutoff not found'
        });
      }

      const cutoff = await CourseCutoff.update(parseInt(id), {
        course_id: course_id ? parseInt(course_id) : undefined,
        exam_id: exam_id ? parseInt(exam_id) : undefined,
        year: year ? parseInt(year) : undefined,
        category_id: category_id ? parseInt(category_id) : undefined,
        cutoff_value: cutoff_value ? parseFloat(cutoff_value) : undefined
      });

      res.json({
        success: true,
        message: 'Course cutoff updated successfully',
        data: { cutoff }
      });
    } catch (error) {
      console.error('Error updating course cutoff:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update course cutoff'
      });
    }
  }

  /**
   * Delete cutoff
   * DELETE /api/admin/course-cutoffs/:id
   */
  static async deleteCourseCutoff(req, res) {
    try {
      const { id } = req.params;
      const cutoff = await CourseCutoff.findById(parseInt(id));

      if (!cutoff) {
        return res.status(404).json({
          success: false,
          message: 'Course cutoff not found'
        });
      }

      await CourseCutoff.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Course cutoff deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting course cutoff:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete course cutoff'
      });
    }
  }
}

module.exports = CourseCutoffController;

