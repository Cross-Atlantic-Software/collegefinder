const {
  getExamPrepRecommendedLecture,
  getExamPrepLecturesForSubject,
} = require('../../services/examPrepLectureResponse');

class ExamPrepLecturesController {
  /**
   * Self-study video lectures for the user's stream.
   * GET /api/auth/profile/exam-prep-lectures/recommended?sort=latest|popular
   */
  static async getRecommendedLecture(req, res) {
    try {
      const sort = String(req.query.sort || 'latest').toLowerCase();
      const data = await getExamPrepRecommendedLecture(req.user.id, { sort });
      return res.json({ success: true, data });
    } catch (error) {
      console.error('Error fetching exam prep recommended lecture:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to load recommended exam prep lecture',
      });
    }
  }

  /**
   * Lectures for one subject (lazy-loaded per subject tab).
   * GET /api/auth/profile/exam-prep-lectures/subject/:subjectId?search=
   */
  static async getLecturesBySubject(req, res) {
    try {
      const subjectId = req.params.subjectId;
      const search = req.query.search != null ? String(req.query.search) : '';
      const data = await getExamPrepLecturesForSubject(req.user.id, { subjectId, search });
      return res.json({ success: true, data });
    } catch (error) {
      console.error('Error fetching exam prep lectures by subject:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to load exam prep lectures',
      });
    }
  }
}

module.exports = ExamPrepLecturesController;
