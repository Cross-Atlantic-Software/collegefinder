const Topic = require('../../models/taxonomy/Topic');
const Subtopic = require('../../models/taxonomy/Subtopic');
const Lecture = require('../../models/taxonomy/Lecture');

class TopicsController {
  /**
   * Get topic by name (for dynamic routing)
   * GET /api/auth/profile/topics/:topicName
   */
  static async getTopicByName(req, res) {
    try {
      const { topicName } = req.params;
      const decodedName = decodeURIComponent(topicName);
      
      const topic = await Topic.findByName(decodedName);
      
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }

      // Get subtopics for this topic
      const subtopics = await Subtopic.findByTopicId(topic.id);
      
      // Get lectures for each subtopic with purposes
      const subtopicsWithLectures = await Promise.all(
        subtopics.map(async (subtopic) => {
          const lectures = await Lecture.findBySubtopicIdWithPurposes(subtopic.id);
          return {
            id: subtopic.id,
            name: subtopic.name,
            description: subtopic.description,
            sort_order: subtopic.sort_order,
            lectures: lectures.map(lecture => ({
              id: lecture.id,
              name: lecture.name,
              content_type: lecture.content_type,
              video_file: lecture.video_file,
              iframe_code: lecture.iframe_code,
              article_content: lecture.article_content,
              thumbnail: lecture.thumbnail,
              description: lecture.description,
              purposes: lecture.purposes || [],
              sort_order: lecture.sort_order
            }))
          };
        })
      );

      res.json({
        success: true,
        data: {
          topic: {
            id: topic.id,
            name: topic.name,
            thumbnail: topic.thumbnail,
            description: topic.description,
            sub_id: topic.sub_id
          },
          subtopics: subtopicsWithLectures
        }
      });
    } catch (error) {
      console.error('Error fetching topic:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch topic'
      });
    }
  }

  /**
   * Get topics by subject ID
   * GET /api/auth/profile/topics/subject/:subjectId
   */
  static async getTopicsBySubjectId(req, res) {
    try {
      const { subjectId } = req.params;
      const { home_display_only, limit } = req.query;
      
      const homeDisplayOnly = home_display_only === 'true';
      const limitNum = limit ? parseInt(limit, 10) : null;
      
      const topics = await Topic.findBySubjectIdWithHomeDisplay(
        parseInt(subjectId, 10),
        homeDisplayOnly,
        limitNum
      );
      
      res.json({
        success: true,
        data: {
          topics: topics.map(topic => ({
            id: topic.id,
            name: topic.name,
            thumbnail: topic.thumbnail,
            description: topic.description,
            home_display: topic.home_display,
            sort_order: topic.sort_order
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching topics by subject:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch topics'
      });
    }
  }
}

module.exports = TopicsController;

