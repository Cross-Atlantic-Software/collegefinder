const EmailTemplate = require('../../models/taxonomy/EmailTemplate');
const { validationResult } = require('express-validator');

class EmailTemplateController {
  /**
   * Get all email templates
   * GET /api/admin/email-templates
   */
  static async getAllTemplates(req, res) {
    try {
      const templates = await EmailTemplate.findAll();
      res.json({
        success: true,
        data: {
          templates,
          total: templates.length
        }
      });
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email templates'
      });
    }
  }

  /**
   * Get email template by ID
   * GET /api/admin/email-templates/:id
   */
  static async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await EmailTemplate.findById(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        });
      }

      res.json({
        success: true,
        data: { template }
      });
    } catch (error) {
      console.error('Error fetching email template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email template'
      });
    }
  }

  /**
   * Create email template
   * POST /api/admin/email-templates
   */
  static async createTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { type, subject, body_html } = req.body;

      // Check if template type already exists
      const existing = await EmailTemplate.findByType(type);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Template type already exists'
        });
      }

      const template = await EmailTemplate.create(type, subject, body_html);

      res.status(201).json({
        success: true,
        message: 'Email template created successfully',
        data: { template }
      });
    } catch (error) {
      console.error('Error creating email template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create email template'
      });
    }
  }

  /**
   * Update email template
   * PUT /api/admin/email-templates/:id
   */
  static async updateTemplate(req, res) {
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
      const { subject, body_html } = req.body;

      // Check if template exists
      const existing = await EmailTemplate.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        });
      }

      const template = await EmailTemplate.update(id, subject, body_html);

      res.json({
        success: true,
        message: 'Email template updated successfully',
        data: { template }
      });
    } catch (error) {
      console.error('Error updating email template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update email template'
      });
    }
  }

  /**
   * Delete email template
   * DELETE /api/admin/email-templates/:id
   */
  static async deleteTemplate(req, res) {
    try {
      const { id } = req.params;

      const template = await EmailTemplate.findById(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        });
      }

      await EmailTemplate.delete(id);

      res.json({
        success: true,
        message: 'Email template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting email template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete email template'
      });
    }
  }
}

module.exports = EmailTemplateController;


