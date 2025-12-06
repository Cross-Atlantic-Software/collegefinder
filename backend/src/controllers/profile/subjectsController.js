const Subject = require('../../models/taxonomy/Subject');

class SubjectsController {
  /**
   * Get all active subjects (for users - public endpoint)
   * GET /api/subjects
   */
  static async getAll(req, res) {
    try {
      const subjects = await Subject.findActive();
      res.json({
        success: true,
        data: { subjects }
      });
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects'
      });
    }
  }
}

module.exports = SubjectsController;


