const CollegeReview = require('../../models/college/CollegeReview');
const { validationResult } = require('express-validator');

class CollegeReviewController {
  /**
   * Get all college reviews
   * GET /api/admin/college-reviews
   */
  static async getAllCollegeReviews(req, res) {
    try {
      const reviews = await CollegeReview.findAll();
      res.json({
        success: true,
        data: { reviews }
      });
    } catch (error) {
      console.error('Error fetching college reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch college reviews'
      });
    }
  }

  /**
   * Get review by ID
   * GET /api/admin/college-reviews/:id
   */
  static async getCollegeReviewById(req, res) {
    try {
      const { id } = req.params;
      const review = await CollegeReview.findById(parseInt(id));

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'College review not found'
        });
      }

      res.json({
        success: true,
        data: { review }
      });
    } catch (error) {
      console.error('Error fetching college review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch college review'
      });
    }
  }

  /**
   * Create new review
   * POST /api/admin/college-reviews
   */
  static async createCollegeReview(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { college_id, user_id, rating, review_text, is_approved } = req.body;

      const review = await CollegeReview.create({ 
        college_id: parseInt(college_id),
        user_id: parseInt(user_id),
        rating: parseInt(rating),
        review_text: review_text || null,
        is_approved: is_approved !== undefined ? is_approved : false
      });

      res.status(201).json({
        success: true,
        message: 'College review created successfully',
        data: { review }
      });
    } catch (error) {
      console.error('Error creating college review:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create college review'
      });
    }
  }

  /**
   * Update review
   * PUT /api/admin/college-reviews/:id
   */
  static async updateCollegeReview(req, res) {
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
      const { college_id, user_id, rating, review_text, is_approved } = req.body;

      const existing = await CollegeReview.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'College review not found'
        });
      }

      const review = await CollegeReview.update(parseInt(id), { 
        college_id: college_id ? parseInt(college_id) : undefined,
        user_id: user_id ? parseInt(user_id) : undefined,
        rating: rating ? parseInt(rating) : undefined,
        review_text,
        is_approved
      });

      res.json({
        success: true,
        message: 'College review updated successfully',
        data: { review }
      });
    } catch (error) {
      console.error('Error updating college review:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update college review'
      });
    }
  }

  /**
   * Delete review
   * DELETE /api/admin/college-reviews/:id
   */
  static async deleteCollegeReview(req, res) {
    try {
      const { id } = req.params;
      const review = await CollegeReview.findById(parseInt(id));

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'College review not found'
        });
      }

      await CollegeReview.delete(parseInt(id));

      res.json({
        success: true,
        message: 'College review deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting college review:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete college review'
      });
    }
  }
}

module.exports = CollegeReviewController;

