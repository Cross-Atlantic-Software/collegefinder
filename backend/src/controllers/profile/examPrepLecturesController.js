const UserAcademics = require('../../models/user/UserAcademics');
const Lecture = require('../../models/taxonomy/Lecture');
const { extractYouTubeVideoId } = require('../../utils/youtubeMetadata');

class ExamPrepLecturesController {
  /**
   * Self-study video lectures for the user's stream (from admin lectures + lecture_streams).
   * GET /api/auth/profile/exam-prep-lectures
   */
  static async getLecturesByUserStream(req, res) {
    try {
      const userId = req.user.id;
      const academics = await UserAcademics.findByUserId(userId);

      if (!academics || !academics.stream_id) {
        return res.json({
          success: true,
          data: {
            lectures: [],
            requiresStreamSelection: true,
            message: 'Please select your stream in your academics profile first',
          },
        });
      }

      const rows = await Lecture.findVideoLecturesForExamPrepByStream(academics.stream_id);
      const lectures = [];

      for (const row of rows) {
        const iframe = row.iframe_code != null ? String(row.iframe_code) : '';
        const file = row.video_file != null ? String(row.video_file) : '';
        const youtubeId = extractYouTubeVideoId(iframe) || extractYouTubeVideoId(file);
        if (!youtubeId) continue;

        const likes = row.youtube_like_count != null ? Number(row.youtube_like_count) : 0;
        const subs = row.youtube_subscriber_count != null ? Number(row.youtube_subscriber_count) : 0;
        const rankScore =
          row.rank_score != null && !Number.isNaN(Number(row.rank_score))
            ? Number(row.rank_score)
            : likes + subs / 1000;

        lectures.push({
          id: row.id,
          youtubeId,
          title: (row.youtube_title && String(row.youtube_title).trim()) || 'Untitled lecture',
          channel: (row.youtube_channel_name && String(row.youtube_channel_name).trim()) || 'YouTube',
          hookSummary:
            row.hook_summary != null && String(row.hook_summary).trim() !== ''
              ? String(row.hook_summary).trim()
              : null,
          likes: Number.isFinite(likes) ? likes : 0,
          subscribers: Number.isFinite(subs) ? subs : 0,
          rankScore,
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date(0).toISOString(),
          subjectId: String(row.subject_id),
          subjectName: row.subject_name || 'Subject',
          topicId: row.topic_id,
          topicName: row.topic_name || 'Topic',
        });
      }

      return res.json({
        success: true,
        data: {
          lectures,
          requiresStreamSelection: false,
          stream_id: academics.stream_id,
        },
      });
    } catch (error) {
      console.error('Error fetching exam prep lectures:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to load exam prep lectures',
      });
    }
  }
}

module.exports = ExamPrepLecturesController;
