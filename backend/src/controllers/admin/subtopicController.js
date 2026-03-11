const Subtopic = require('../../models/taxonomy/Subtopic');
const { validationResult } = require('express-validator');

class SubtopicController {
  /**
   * Get all subtopics
   * GET /api/admin/subtopics
   */
  static async getAllSubtopics(req, res) {
    try {
      const subtopics = await Subtopic.findAll();
      res.json({
        success: true,
        data: { subtopics }
      });
    } catch (error) {
      console.error('Error fetching subtopics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subtopics'
      });
    }
  }

  /**
   * Get subtopic by ID
   * GET /api/admin/subtopics/:id
   */
  static async getSubtopicById(req, res) {
    try {
      const { id } = req.params;
      const subtopic = await Subtopic.findById(parseInt(id));

      if (!subtopic) {
        return res.status(404).json({
          success: false,
          message: 'Subtopic not found'
        });
      }

      res.json({
        success: true,
        data: { subtopic }
      });
    } catch (error) {
      console.error('Error fetching subtopic:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subtopic'
      });
    }
  }

  /**
   * Get subtopics by topic ID
   * GET /api/admin/subtopics/topic/:topicId
   */
  static async getSubtopicsByTopicId(req, res) {
    try {
      const { topicId } = req.params;
      const subtopics = await Subtopic.findByTopicId(parseInt(topicId));
      res.json({
        success: true,
        data: { subtopics }
      });
    } catch (error) {
      console.error('Error fetching subtopics by topic:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subtopics'
      });
    }
  }

  /**
   * Create new subtopic
   * POST /api/admin/subtopics
   */
  static async createSubtopic(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { topic_id, name, status, description, sort_order } = req.body;

      // Check if subtopic with same name exists for this topic
      const existing = await Subtopic.findByNameAndTopicId(name, parseInt(topic_id));
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Subtopic with this name already exists for this topic'
        });
      }

      const subtopic = await Subtopic.create({
        topic_id: parseInt(topic_id),
        name,
        status: status !== undefined ? (status === 'true' || status === true) : true,
        description: description || null,
        sort_order: sort_order ? parseInt(sort_order) : 0
      });

      res.status(201).json({
        success: true,
        message: 'Subtopic created successfully',
        data: { subtopic }
      });
    } catch (error) {
      console.error('Error creating subtopic:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create subtopic'
      });
    }
  }

  /**
   * Update subtopic
   * PUT /api/admin/subtopics/:id
   */
  static async updateSubtopic(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const existingSubtopic = await Subtopic.findById(parseInt(id));

      if (!existingSubtopic) {
        return res.status(404).json({
          success: false,
          message: 'Subtopic not found'
        });
      }

      const { topic_id, name, status, description, sort_order } = req.body;

      // Check if name is being changed and if it already exists for this topic
      const topicId = topic_id ? parseInt(topic_id) : existingSubtopic.topic_id;
      if (name && name !== existingSubtopic.name) {
        const nameExists = await Subtopic.findByNameAndTopicId(name, topicId);
        if (nameExists && nameExists.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'Subtopic with this name already exists for this topic'
          });
        }
      }

      const updateData = {};
      if (topic_id !== undefined) updateData.topic_id = parseInt(topic_id);
      if (name !== undefined) updateData.name = name;
      if (status !== undefined) updateData.status = status === 'true' || status === true;
      if (description !== undefined) updateData.description = description;
      if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order);

      const subtopic = await Subtopic.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Subtopic updated successfully',
        data: { subtopic }
      });
    } catch (error) {
      console.error('Error updating subtopic:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update subtopic'
      });
    }
  }

  /**
   * Delete subtopic
   * DELETE /api/admin/subtopics/:id
   */
  static async deleteSubtopic(req, res) {
    try {
      const { id } = req.params;
      const subtopic = await Subtopic.findById(parseInt(id));

      if (!subtopic) {
        return res.status(404).json({
          success: false,
          message: 'Subtopic not found'
        });
      }

      await Subtopic.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Subtopic deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting subtopic:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete subtopic'
      });
    }
  }
}

module.exports = SubtopicController;

