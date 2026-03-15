const Topic = require('../../models/taxonomy/Topic');
const { validationResult } = require('express-validator');

function parseExamIdsBody(examIds) {
  if (examIds == null || examIds === '') return [];
  if (Array.isArray(examIds)) return examIds.slice(0, 10).map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
  if (typeof examIds === 'string') {
    try {
      const parsed = JSON.parse(examIds);
      return Array.isArray(parsed) ? parsed.slice(0, 10).map((id) => parseInt(id, 10)).filter((n) => !isNaN(n)) : [];
    } catch {
      return examIds.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n)).slice(0, 10);
    }
  }
  return [];
}
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

class TopicController {
  /**
   * Get all topics
   * GET /api/admin/topics
   */
  static async getAllTopics(req, res) {
    try {
      const topics = await Topic.findAll();
      const topicIds = topics.map((t) => t.id);
      const examIdsByTopic = topicIds.length > 0 ? await Topic.getExamIdsByTopicIds(topicIds) : {};
      const topicsWithExams = topics.map((t) => ({ ...t, exam_ids: examIdsByTopic[t.id] || [] }));
      res.json({
        success: true,
        data: { topics: topicsWithExams }
      });
    } catch (error) {
      console.error('Error fetching topics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch topics'
      });
    }
  }

  /**
   * Get topic by ID
   * GET /api/admin/topics/:id
   */
  static async getTopicById(req, res) {
    try {
      const { id } = req.params;
      const topicId = parseInt(id);
      const topic = await Topic.findById(topicId);

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }

      const examIds = await Topic.getExamIds(topicId);
      res.json({
        success: true,
        data: { topic: { ...topic, exam_ids: examIds } }
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
   * Create new topic
   * POST /api/admin/topics
   */
  static async createTopic(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { sub_id, name, home_display, status, description, sort_order, exam_ids } = req.body;

      // Check if topic with same name exists for this subject
      const existing = await Topic.findByNameAndSubjectId(name, parseInt(sub_id));
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Topic with this name already exists for this subject'
        });
      }

      // Handle thumbnail upload if provided
      let thumbnail = null;
      if (req.file) {
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        thumbnail = await uploadToS3(fileBuffer, fileName, 'topic_thumbnails');
      }

      const topic = await Topic.create({
        sub_id: parseInt(sub_id),
        name,
        thumbnail,
        home_display: home_display === 'true' || home_display === true,
        status: status !== undefined ? (status === 'true' || status === true) : true,
        description: description || null,
        sort_order: sort_order ? parseInt(sort_order) : 0
      });

      const parsedExamIds = parseExamIdsBody(exam_ids);
      if (parsedExamIds.length > 0) await Topic.setExamIds(topic.id, parsedExamIds);

      const topicWithExams = { ...topic, exam_ids: parsedExamIds.length > 0 ? parsedExamIds : await Topic.getExamIds(topic.id) };
      res.status(201).json({
        success: true,
        message: 'Topic created successfully',
        data: { topic: topicWithExams }
      });
    } catch (error) {
      console.error('Error creating topic:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create topic'
      });
    }
  }

  /**
   * Update topic
   * PUT /api/admin/topics/:id
   */
  static async updateTopic(req, res) {
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
      const existingTopic = await Topic.findById(parseInt(id));

      if (!existingTopic) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }

      const { sub_id, name, home_display, status, description, sort_order, exam_ids } = req.body;

      // Check if name is being changed and if it already exists for this subject
      const subjectId = sub_id ? parseInt(sub_id) : existingTopic.sub_id;
      if (name && name !== existingTopic.name) {
        const nameExists = await Topic.findByNameAndSubjectId(name, subjectId);
        if (nameExists && nameExists.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'Topic with this name already exists for this subject'
          });
        }
      }

      // Handle thumbnail upload if provided
      let thumbnail = undefined;
      if (req.file) {
        // Delete old thumbnail if exists
        if (existingTopic.thumbnail) {
          await deleteFromS3(existingTopic.thumbnail);
        }
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        thumbnail = await uploadToS3(fileBuffer, fileName, 'topic_thumbnails');
      }

      const updateData = {};
      if (sub_id !== undefined) updateData.sub_id = parseInt(sub_id);
      if (name !== undefined) updateData.name = name;
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
      if (home_display !== undefined) updateData.home_display = home_display === 'true' || home_display === true;
      if (status !== undefined) updateData.status = status === 'true' || status === true;
      if (description !== undefined) updateData.description = description;
      if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order);

      const topic = await Topic.update(parseInt(id), updateData);
      if (exam_ids !== undefined) {
        const parsedExamIds = parseExamIdsBody(exam_ids);
        await Topic.setExamIds(parseInt(id), parsedExamIds);
      }
      const examIds = await Topic.getExamIds(parseInt(id));
      res.json({
        success: true,
        message: 'Topic updated successfully',
        data: { topic: { ...topic, exam_ids: examIds } }
      });
    } catch (error) {
      console.error('Error updating topic:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update topic'
      });
    }
  }

  /**
   * Delete topic
   * DELETE /api/admin/topics/:id
   */
  static async deleteTopic(req, res) {
    try {
      const { id } = req.params;
      const topic = await Topic.findById(parseInt(id));

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }

      // Delete thumbnail from S3 if exists
      if (topic.thumbnail) {
        await deleteFromS3(topic.thumbnail);
      }

      await Topic.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Topic deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting topic:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete topic'
      });
    }
  }

  /**
   * Upload thumbnail for topic
   * POST /api/admin/topics/upload-thumbnail
   */
  static async uploadThumbnail(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const s3Url = await uploadToS3(fileBuffer, fileName, 'topic_thumbnails');

      res.json({
        success: true,
        data: { imageUrl: s3Url }
      });
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload thumbnail'
      });
    }
  }
}

module.exports = TopicController;
module.exports.upload = upload;

