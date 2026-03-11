const GovernmentIdentification = require('../../models/user/GovernmentIdentification');
const { validationResult } = require('express-validator');

class GovernmentIdentificationController {
  /**
   * Get government identification for current user
   * GET /api/auth/profile/government-identification
   */
  static async getGovernmentIdentification(req, res) {
    try {
      const userId = req.user.id;
      const govId = await GovernmentIdentification.findByUserId(userId);

      if (!govId) {
        return res.json({
          success: true,
          data: null
        });
      }

      res.json({
        success: true,
        data: {
          id: govId.id,
          user_id: govId.user_id,
          aadhar_number: govId.aadhar_number,
          apaar_id: govId.apaar_id,
          created_at: govId.created_at,
          updated_at: govId.updated_at
        }
      });
    } catch (error) {
      console.error('Error getting government identification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get government identification'
      });
    }
  }

  /**
   * Create or update government identification for current user
   * PUT /api/auth/profile/government-identification
   */
  static async upsertGovernmentIdentification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const {
        aadhar_number,
        apaar_id
      } = req.body;

      // Check if apaar_id is already used by another user
      if (apaar_id) {
        const existingGovId = await GovernmentIdentification.findByApaarId(apaar_id);
        if (existingGovId && existingGovId.user_id !== userId) {
          return res.status(400).json({
            success: false,
            message: 'APAAR ID is already registered to another student',
            errors: [{ param: 'apaar_id', msg: 'APAAR ID must be unique' }]
          });
        }
      }

      const govId = await GovernmentIdentification.upsert(userId, {
        aadhar_number,
        apaar_id
      });

      res.json({
        success: true,
        message: 'Government identification saved successfully',
        data: {
          id: govId.id,
          user_id: govId.user_id,
          aadhar_number: govId.aadhar_number,
          apaar_id: govId.apaar_id,
          created_at: govId.created_at,
          updated_at: govId.updated_at
        }
      });
    } catch (error) {
      console.error('Error saving government identification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save government identification'
      });
    }
  }

  /**
   * Delete government identification for current user
   * DELETE /api/auth/profile/government-identification
   */
  static async deleteGovernmentIdentification(req, res) {
    try {
      const userId = req.user.id;
      const deleted = await GovernmentIdentification.deleteByUserId(userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Government identification not found'
        });
      }

      res.json({
        success: true,
        message: 'Government identification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting government identification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete government identification'
      });
    }
  }
}

module.exports = GovernmentIdentificationController;

