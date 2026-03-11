const UserOtherInfo = require('../../models/user/UserOtherInfo');

class UserOtherInfoController {
  /**
   * Get user other info
   * GET /api/auth/profile/other-info
   */
  static async getOtherInfo(req, res) {
    try {
      const userId = req.user.id;
      const otherInfo = await UserOtherInfo.findByUserId(userId);

      res.json({
        success: true,
        data: otherInfo || null
      });
    } catch (error) {
      console.error('Error fetching user other info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch other info'
      });
    }
  }

  /**
   * Update user other info
   * PUT /api/auth/profile/other-info
   */
  static async updateOtherInfo(req, res) {
    try {
      const userId = req.user.id;
      const { medium, language, program_ids, exam_city_ids } = req.body;

      // Validate program_ids - ensure no duplicates and max 3
      if (program_ids && Array.isArray(program_ids)) {
        const uniqueProgramIds = [...new Set(program_ids)];
        if (uniqueProgramIds.length !== program_ids.length) {
          return res.status(400).json({
            success: false,
            message: 'Program preferences cannot have duplicate values'
          });
        }
        if (program_ids.length > 3) {
          return res.status(400).json({
            success: false,
            message: 'Maximum 3 program preferences allowed'
          });
        }
      }

      // Validate exam_city_ids - ensure no duplicates and max 4
      if (exam_city_ids && Array.isArray(exam_city_ids)) {
        const uniqueCityIds = [...new Set(exam_city_ids)];
        if (uniqueCityIds.length !== exam_city_ids.length) {
          return res.status(400).json({
            success: false,
            message: 'Exam city preferences cannot have duplicate values'
          });
        }
        if (exam_city_ids.length > 4) {
          return res.status(400).json({
            success: false,
            message: 'Maximum 4 exam city preferences allowed'
          });
        }
      }

      const otherInfo = await UserOtherInfo.upsert(userId, {
        medium,
        language,
        program_ids,
        exam_city_ids
      });

      res.json({
        success: true,
        message: 'Other info updated successfully',
        data: otherInfo
      });
    } catch (error) {
      console.error('Error updating user other info:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update other info'
      });
    }
  }
}

module.exports = UserOtherInfoController;


