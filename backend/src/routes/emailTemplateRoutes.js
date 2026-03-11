const express = require('express');
const router = express.Router();
const EmailTemplateController = require('../controllers/emailTemplateController');
const { authenticateAdmin, requireSuperAdmin } = require('../../middleware/adminAuth');
const {
  validateCreateEmailTemplate,
  validateUpdateEmailTemplate
} = require('../../middleware/validators');

/**
 * @route   GET /api/admin/email-templates
 * @desc    Get all email templates
 * @access  Private (Admin)
 */
router.get('/', authenticateAdmin, EmailTemplateController.getAllTemplates);

/**
 * @route   GET /api/admin/email-templates/:id
 * @desc    Get email template by ID
 * @access  Private (Admin)
 */
router.get('/:id', authenticateAdmin, EmailTemplateController.getTemplateById);

/**
 * @route   POST /api/admin/email-templates
 * @desc    Create email template
 * @access  Private (Super Admin)
 */
router.post('/', authenticateAdmin, requireSuperAdmin, validateCreateEmailTemplate, EmailTemplateController.createTemplate);

/**
 * @route   PUT /api/admin/email-templates/:id
 * @desc    Update email template
 * @access  Private (Super Admin)
 */
router.put('/:id', authenticateAdmin, requireSuperAdmin, validateUpdateEmailTemplate, EmailTemplateController.updateTemplate);

/**
 * @route   DELETE /api/admin/email-templates/:id
 * @desc    Delete email template
 * @access  Private (Super Admin)
 */
router.delete('/:id', authenticateAdmin, requireSuperAdmin, EmailTemplateController.deleteTemplate);

module.exports = router;


