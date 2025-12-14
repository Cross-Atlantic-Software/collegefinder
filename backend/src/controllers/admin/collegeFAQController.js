const CollegeFAQ = require('../../models/college/CollegeFAQ');
const { validationResult } = require('express-validator');

class CollegeFAQController {
  /**
   * Get all college FAQs
   * GET /api/admin/college-faqs
   */
  static async getAllCollegeFAQs(req, res) {
    try {
      const faqs = await CollegeFAQ.findAll();
      res.json({
        success: true,
        data: { faqs }
      });
    } catch (error) {
      console.error('Error fetching college FAQs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch college FAQs'
      });
    }
  }

  /**
   * Get FAQ by ID
   * GET /api/admin/college-faqs/:id
   */
  static async getCollegeFAQById(req, res) {
    try {
      const { id } = req.params;
      const faq = await CollegeFAQ.findById(parseInt(id));

      if (!faq) {
        return res.status(404).json({
          success: false,
          message: 'College FAQ not found'
        });
      }

      res.json({
        success: true,
        data: { faq }
      });
    } catch (error) {
      console.error('Error fetching college FAQ:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch college FAQ'
      });
    }
  }

  /**
   * Create new FAQ
   * POST /api/admin/college-faqs
   */
  static async createCollegeFAQ(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { college_id, question, answer } = req.body;

      const faq = await CollegeFAQ.create({
        college_id: parseInt(college_id),
        question,
        answer
      });

      res.status(201).json({
        success: true,
        message: 'College FAQ created successfully',
        data: { faq }
      });
    } catch (error) {
      console.error('Error creating college FAQ:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create college FAQ'
      });
    }
  }

  /**
   * Update FAQ
   * PUT /api/admin/college-faqs/:id
   */
  static async updateCollegeFAQ(req, res) {
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
      const { college_id, question, answer } = req.body;

      const existing = await CollegeFAQ.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'College FAQ not found'
        });
      }

      const faq = await CollegeFAQ.update(parseInt(id), {
        college_id: college_id ? parseInt(college_id) : undefined,
        question,
        answer
      });

      res.json({
        success: true,
        message: 'College FAQ updated successfully',
        data: { faq }
      });
    } catch (error) {
      console.error('Error updating college FAQ:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update college FAQ'
      });
    }
  }

  /**
   * Delete FAQ
   * DELETE /api/admin/college-faqs/:id
   */
  static async deleteCollegeFAQ(req, res) {
    try {
      const { id } = req.params;
      const faq = await CollegeFAQ.findById(parseInt(id));

      if (!faq) {
        return res.status(404).json({
          success: false,
          message: 'College FAQ not found'
        });
      }

      await CollegeFAQ.delete(parseInt(id));

      res.json({
        success: true,
        message: 'College FAQ deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting college FAQ:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete college FAQ'
      });
    }
  }
}

module.exports = CollegeFAQController;

