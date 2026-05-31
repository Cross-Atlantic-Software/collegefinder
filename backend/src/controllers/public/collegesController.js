const College = require('../../models/college/College');
const { enrichCollegeRows } = require('../profile/collegesController');

class PublicCollegesController {
  /**
   * GET /api/colleges?program_id=
   * Public college directory — optional filter by program taxonomy id.
   */
  static async list(req, res) {
    try {
      const programId = req.query.program_id;
      if (programId == null || String(programId).trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'program_id query parameter is required',
        });
      }

      const rows = await College.findAllByProgramId(programId);
      const colleges = await enrichCollegeRows(rows);

      return res.json({
        success: true,
        data: { colleges },
      });
    } catch (error) {
      console.error('Error fetching public colleges:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch colleges',
      });
    }
  }
}

module.exports = PublicCollegesController;
