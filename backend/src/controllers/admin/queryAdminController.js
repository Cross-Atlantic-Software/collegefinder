const UserQuery = require('../../models/UserQuery');
const { sendQueryResolutionEmail } = require('../../../utils/email/emailService');

class QueryAdminController {
  static async list(req, res) {
    try {
      const queries = await UserQuery.getAllForAdmin();
      return res.json({
        success: true,
        data: { queries },
      });
    } catch (error) {
      console.error('Error fetching user queries:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch queries',
      });
    }
  }

  static async resolve(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const answer = typeof req.body?.answer === 'string' ? req.body.answer.trim() : '';

      if (Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid query id' });
      }
      if (!answer) {
        return res.status(400).json({ success: false, message: 'Answer is required' });
      }

      const row = await UserQuery.resolve({
        id,
        admin_answer: answer,
        resolved_by_admin_id: req.admin?.id || null,
      });

      if (!row) {
        return res.status(404).json({ success: false, message: 'Query not found' });
      }

      try {
        await sendQueryResolutionEmail({
          toEmail: row.email,
          name: row.name,
          queryType: row.query_type,
          queryDescription: row.description,
          answer,
        });
      } catch (mailError) {
        console.error('Failed to send query resolution email:', mailError);
        return res.status(500).json({
          success: false,
          message: 'Query resolved but failed to send email. Please check SMTP settings.',
          data: { query: row },
        });
      }

      return res.json({
        success: true,
        message: 'Query resolved and email sent successfully',
        data: { query: row },
      });
    } catch (error) {
      console.error('Error resolving user query:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to resolve query',
      });
    }
  }
}

module.exports = QueryAdminController;
