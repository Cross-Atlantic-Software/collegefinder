const OtherPersonalDetails = require('../../models/user/OtherPersonalDetails');
const { validationResult } = require('express-validator');

class OtherPersonalDetailsController {
  /**
   * Get other personal details for current user
   * GET /api/auth/profile/other-personal-details
   */
  static async getOtherPersonalDetails(req, res) {
    try {
      const userId = req.user.id;
      const details = await OtherPersonalDetails.findByUserId(userId);

      if (!details) {
        return res.json({
          success: true,
          data: null
        });
      }

      res.json({
        success: true,
        data: {
          id: details.id,
          user_id: details.user_id,
          religion: details.religion,
          mother_tongue: details.mother_tongue,
          annual_family_income: details.annual_family_income,
          occupation_of_father: details.occupation_of_father,
          occupation_of_mother: details.occupation_of_mother,
          created_at: details.created_at,
          updated_at: details.updated_at
        }
      });
    } catch (error) {
      console.error('Error getting other personal details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get other personal details'
      });
    }
  }

  /**
   * Create or update other personal details for current user
   * PUT /api/auth/profile/other-personal-details
   */
  static async upsertOtherPersonalDetails(req, res) {
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
        religion,
        mother_tongue,
        annual_family_income,
        occupation_of_father,
        occupation_of_mother
      } = req.body;

      const details = await OtherPersonalDetails.upsert(userId, {
        religion,
        mother_tongue,
        annual_family_income,
        occupation_of_father,
        occupation_of_mother
      });

      res.json({
        success: true,
        message: 'Other personal details saved successfully',
        data: {
          id: details.id,
          user_id: details.user_id,
          religion: details.religion,
          mother_tongue: details.mother_tongue,
          annual_family_income: details.annual_family_income,
          occupation_of_father: details.occupation_of_father,
          occupation_of_mother: details.occupation_of_mother,
          created_at: details.created_at,
          updated_at: details.updated_at
        }
      });
    } catch (error) {
      console.error('Error saving other personal details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save other personal details'
      });
    }
  }

  /**
   * Delete other personal details for current user
   * DELETE /api/auth/profile/other-personal-details
   */
  static async deleteOtherPersonalDetails(req, res) {
    try {
      const userId = req.user.id;
      const deleted = await OtherPersonalDetails.deleteByUserId(userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Other personal details not found'
        });
      }

      res.json({
        success: true,
        message: 'Other personal details deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting other personal details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete other personal details'
      });
    }
  }
}

module.exports = OtherPersonalDetailsController;

