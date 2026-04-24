const Subject = require('../../models/taxonomy/Subject');
const UserAcademics = require('../../models/user/UserAcademics');
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
      const subjectsWithTopics = await Promise.all(subjects.map(async (subject) => {
        // Get first 3 topics with home_display = true
        const homeDisplayTopics = await Topic.findBySubjectIdWithHomeDisplay(subject.id, true, 3);
        // Get all topics for the subject (for "view more")
        const allTopics = await Topic.findBySubjectIdWithHomeDisplay(subject.id, false);
        
        return {
          id: subject.id.toString(),
          name: subject.name,
          topics: homeDisplayTopics.map(topic => ({
            id: topic.id,
            name: topic.name,
            thumbnail: topic.thumbnail,
            description: topic.description,
            home_display: topic.home_display,
            sort_order: topic.sort_order
          })),
          allTopics: allTopics.map(topic => ({
            id: topic.id,
            name: topic.name,
            thumbnail: topic.thumbnail,
            description: topic.description,
            home_display: topic.home_display,
            sort_order: topic.sort_order
          }))
        };
      }));

      res.json({
        success: true,
        data: {
          subjects: subjectsWithTopics,
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


