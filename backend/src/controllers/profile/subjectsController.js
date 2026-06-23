const Subject = require('../../models/taxonomy/Subject');
const UserAcademics = require('../../models/user/UserAcademics');
const Chapter = require('../../models/taxonomy/Chapter');
const Topic = require('../../models/taxonomy/Topic');

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

  /**
   * Get subjects by user's stream_id with topic lists (authenticated endpoint)
   * GET /api/auth/profile/subjects
   */
  static async getByUserStream(req, res) {
    try {
      const userId = req.user.id;
      const academics = await UserAcademics.findByUserId(userId);

      if (!academics || !academics.stream_id) {
        return res.json({
          success: true,
          data: {
            subjects: [],
            requiresStreamSelection: true,
            message: 'Please select your stream in your academics profile first'
          }
        });
      }

      // Get subjects filtered by stream_id
      const subjects = await Subject.findByStreamId(academics.stream_id);
      
      console.log(`Found ${subjects.length} subjects for stream_id ${academics.stream_id}:`, 
        subjects.map(s => ({ id: s.id, name: s.name, streams: s.streams })));

      if (subjects.length === 0) {
        return res.json({
          success: true,
          data: {
            subjects: [],
            requiresStreamSelection: false,
            stream_id: academics.stream_id
          }
        });
      }

      // Get topics for each subject (with home_display filter for initial display)
      const subjectsWithChapters = await Promise.all(subjects.map(async (subject) => {
        const chapters = await Chapter.findBySubjectId(subject.id);
        const chaptersWithTopics = await Promise.all(chapters.map(async (chapter) => {
          const homeDisplayTopics = await Topic.findByChapterIdWithHomeDisplay(chapter.id, true, 3);
          const allTopics = await Topic.findByChapterIdWithHomeDisplay(chapter.id, false);
          const mapTopic = (topic) => ({
            id: topic.id,
            name: topic.name,
            thumbnail: topic.thumbnail,
            description: topic.description,
            home_display: topic.home_display,
            sort_order: topic.sort_order,
          });
          return {
            id: chapter.id,
            name: chapter.name,
            sort_order: chapter.sort_order,
            topics: homeDisplayTopics.map(mapTopic),
            allTopics: allTopics.map(mapTopic),
          };
        }));

        const flatAllTopics = chaptersWithTopics.flatMap((ch) => ch.allTopics);

        return {
          id: subject.id.toString(),
          name: subject.name,
          chapters: chaptersWithTopics,
          topics: flatAllTopics.filter((t) => t.home_display).slice(0, 3),
          allTopics: flatAllTopics,
        };
      }));

      res.json({
        success: true,
        data: {
          subjects: subjectsWithChapters,
          requiresStreamSelection: false,
          stream_id: academics.stream_id
        }
      });
    } catch (error) {
      console.error('Error fetching subjects by stream:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects'
      });
    }
  }
}

module.exports = SubjectsController;


