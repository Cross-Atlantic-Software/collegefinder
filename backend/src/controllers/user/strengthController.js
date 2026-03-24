const StrengthPayment = require('../../models/strength/StrengthPayment');
const StrengthResult = require('../../models/strength/StrengthResult');
const User = require('../../models/user/User');
const UserAcademics = require('../../models/user/UserAcademics');
const { sendStrengthPaymentNotification } = require('../../../utils/email/emailService');
const { calculateAgeFromDOB } = require('../../utils/dateUtils');

class StrengthController {
  /**
   * GET /api/strength/payment-status
   */
  static async getPaymentStatus(req, res) {
    try {
      const payment = await StrengthPayment.findByUserId(req.user.id);
      res.json({
        success: true,
        data: {
          payment_status: payment?.payment_status || 'not_paid',
          paid_at: payment?.paid_at || null
        }
      });
    } catch (error) {
      console.error('Error fetching payment status:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payment status' });
    }
  }

  /**
   * GET /api/strength/form-data
   * Returns auto-fill data for the strength form
   */
  static async getFormData(req, res) {
    try {
      const user = req.user;
      const academics = await UserAcademics.findByUserId(user.id);

      const age = calculateAgeFromDOB(user.date_of_birth);

      const classInfo = academics?.is_pursuing_12th ? '12th (Pursuing)' :
        academics?.postmatric_passing_year ? '12th' :
        academics?.matric_passing_year ? '10th' : null;

      res.json({
        success: true,
        data: {
          name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
          email: user.email || null,
          phone: user.phone_number || null,
          class_info: classInfo,
          school: academics?.postmatric_school_name || academics?.matric_school_name || null,
          age: age,
          is_complete: !!(user.name && user.email && user.phone_number)
        }
      });
    } catch (error) {
      console.error('Error fetching form data:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch form data' });
    }
  }

  /**
   * POST /api/strength/pay
   * Dummy payment - marks payment as done and sends email notification
   */
  static async pay(req, res) {
    try {
      const user = req.user;

      const existing = await StrengthPayment.findByUserId(user.id);
      if (existing?.payment_status === 'paid') {
        return res.status(400).json({ success: false, message: 'Payment already completed' });
      }

      const payment = await StrengthPayment.markPaid(user.id, 0);

      const academics = await UserAcademics.findByUserId(user.id);
      const classInfo = academics?.is_pursuing_12th ? '12th (Pursuing)' :
        academics?.postmatric_passing_year ? '12th' :
        academics?.matric_passing_year ? '10th' : null;

      sendStrengthPaymentNotification({
        id: user.id,
        name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email,
        phone: user.phone_number,
        class_info: classInfo,
        school: academics?.postmatric_school_name || academics?.matric_school_name || null
      }).catch(err => {
        console.error('Failed to send strength payment notification:', err);
      });

      res.json({
        success: true,
        message: 'Payment completed successfully',
        data: { payment }
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ success: false, message: 'Failed to process payment' });
    }
  }

  /**
   * GET /api/strength/results
   * Get strength results for the current user (only if paid)
   */
  static async getResults(req, res) {
    try {
      const isPaid = await StrengthPayment.isPaid(req.user.id);
      if (!isPaid) {
        return res.status(403).json({
          success: false,
          message: 'Payment required to view results'
        });
      }

      const results = await StrengthResult.findByUserId(req.user.id);
      res.json({
        success: true,
        data: {
          results: results || null,
          has_results: !!results
        }
      });
    } catch (error) {
      console.error('Error fetching results:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch results' });
    }
  }
}

module.exports = StrengthController;
