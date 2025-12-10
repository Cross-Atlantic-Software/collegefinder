const Lecture = require('../../models/taxonomy/Lecture');
const Purpose = require('../../models/taxonomy/Purpose');
const { validationResult } = require('express-validator');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for videos
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

class LectureController {
  /**
   * Get all lectures
   * GET /api/admin/lectures
   */
  static async getAllLectures(req, res) {
    try {
      const lectures = await Lecture.findAll();
      res.json({
        success: true,
        data: { lectures }
      });
    } catch (error) {
      console.error('Error fetching lectures:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lectures'
      });
    }
  }

  /**
   * Get lecture by ID
   * GET /api/admin/lectures/:id
   */
  static async getLectureById(req, res) {
    try {
      const { id } = req.params;
      const lecture = await Lecture.findById(parseInt(id));

      if (!lecture) {
        return res.status(404).json({
          success: false,
          message: 'Lecture not found'
        });
      }

      res.json({
        success: true,
        data: { lecture }
      });
    } catch (error) {
      console.error('Error fetching lecture:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lecture'
      });
    }
  }

  /**
   * Get lectures by subtopic ID
   * GET /api/admin/lectures/subtopic/:subtopicId
   */
  static async getLecturesBySubtopicId(req, res) {
    try {
      const { subtopicId } = req.params;
      const lectures = await Lecture.findBySubtopicId(parseInt(subtopicId));
      res.json({
        success: true,
        data: { lectures }
      });
    } catch (error) {
      console.error('Error fetching lectures by subtopic:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lectures'
      });
    }
  }

  /**
   * Create new lecture
   * POST /api/admin/lectures
   */
  static async createLecture(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { subtopic_id, name, content_type = 'VIDEO', status, description, sort_order, article_content } = req.body;

      // Check if lecture with same name exists for this subtopic
      const existing = await Lecture.findByNameAndSubtopicId(name, parseInt(subtopic_id));
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Lecture with this name already exists for this subtopic'
        });
      }

      // Validate content_type specific fields
      if (content_type === 'VIDEO') {
        if (!req.files || !req.files.video_file) {
          return res.status(400).json({
            success: false,
            message: 'Video file is required when content_type is VIDEO'
          });
        }
      } else if (content_type === 'ARTICLE') {
        if (!article_content || article_content.trim() === '') {
          return res.status(400).json({
            success: false,
            message: 'Article content is required when content_type is ARTICLE'
          });
        }
      }

      // Handle video file upload if content_type is VIDEO
      let video_file = null;
      if (content_type === 'VIDEO' && req.files && req.files.video_file) {
        const fileBuffer = req.files.video_file[0].buffer;
        const fileName = req.files.video_file[0].originalname;
        video_file = await uploadToS3(fileBuffer, fileName, 'lecture_videos');
      }

      // Handle thumbnail upload if provided
      let thumbnail = null;
      if (req.files && req.files.thumbnail) {
        const fileBuffer = req.files.thumbnail[0].buffer;
        const fileName = req.files.thumbnail[0].originalname;
        thumbnail = await uploadToS3(fileBuffer, fileName, 'lecture_thumbnails');
      }

      const lecture = await Lecture.create({
        subtopic_id: parseInt(subtopic_id),
        name,
        content_type,
        video_file,
        article_content: content_type === 'ARTICLE' ? article_content : null,
        thumbnail,
        status: status !== undefined ? (status === 'true' || status === true) : true,
        description: description || null,
        sort_order: sort_order ? parseInt(sort_order) : 0
      });

      // Handle purposes if provided
      if (req.body.purposes) {
        let purposeIds = [];
        try {
          // Parse purposes if it's a JSON string
          if (typeof req.body.purposes === 'string') {
            purposeIds = JSON.parse(req.body.purposes);
          } else if (Array.isArray(req.body.purposes)) {
            purposeIds = req.body.purposes;
          }
          // Ensure all are integers
          purposeIds = purposeIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        } catch (e) {
          console.error('Error parsing purposes:', e);
        }
        if (purposeIds.length > 0) {
          await Purpose.setLecturePurposes(lecture.id, purposeIds);
        }
      }

      // Fetch lecture with purposes
      const lectureWithPurposes = await Lecture.findById(lecture.id);

      res.status(201).json({
        success: true,
        message: 'Lecture created successfully',
        data: { lecture: lectureWithPurposes }
      });
    } catch (error) {
      console.error('Error creating lecture:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create lecture'
      });
    }
  }

  /**
   * Update lecture
   * PUT /api/admin/lectures/:id
   */
  static async updateLecture(req, res) {
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
      const existingLecture = await Lecture.findById(parseInt(id));

      if (!existingLecture) {
        return res.status(404).json({
          success: false,
          message: 'Lecture not found'
        });
      }

      const { subtopic_id, name, content_type, status, description, sort_order, article_content } = req.body;

      // Check if name is being changed and if it already exists for this subtopic
      const subtopicId = subtopic_id ? parseInt(subtopic_id) : existingLecture.subtopic_id;
      if (name && name !== existingLecture.name) {
        const nameExists = await Lecture.findByNameAndSubtopicId(name, subtopicId);
        if (nameExists && nameExists.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'Lecture with this name already exists for this subtopic'
          });
        }
      }

      // Validate content_type specific fields
      const finalContentType = content_type || existingLecture.content_type || 'VIDEO';
      if (finalContentType === 'VIDEO') {
        // If switching to VIDEO or updating VIDEO, ensure video file is provided or exists
        if (content_type === 'VIDEO' && !req.files?.video_file && !existingLecture.video_file) {
          return res.status(400).json({
            success: false,
            message: 'Video file is required when content_type is VIDEO'
          });
        }
      } else if (finalContentType === 'ARTICLE') {
        // If switching to ARTICLE or updating ARTICLE, ensure article_content is provided
        if (article_content === undefined && !existingLecture.article_content) {
          return res.status(400).json({
            success: false,
            message: 'Article content is required when content_type is ARTICLE'
          });
        }
      }

      // Handle video file upload if content_type is VIDEO
      let video_file = undefined;
      if (finalContentType === 'VIDEO' && req.files && req.files.video_file) {
        // Delete old video if exists
        if (existingLecture.video_file) {
          await deleteFromS3(existingLecture.video_file);
        }
        const fileBuffer = req.files.video_file[0].buffer;
        const fileName = req.files.video_file[0].originalname;
        video_file = await uploadToS3(fileBuffer, fileName, 'lecture_videos');
      }

      // Handle thumbnail upload if provided
      let thumbnail = undefined;
      if (req.files && req.files.thumbnail) {
        // Delete old thumbnail if exists
        if (existingLecture.thumbnail) {
          await deleteFromS3(existingLecture.thumbnail);
        }
        const fileBuffer = req.files.thumbnail[0].buffer;
        const fileName = req.files.thumbnail[0].originalname;
        thumbnail = await uploadToS3(fileBuffer, fileName, 'lecture_thumbnails');
      }

      const updateData = {};
      if (subtopic_id !== undefined) updateData.subtopic_id = parseInt(subtopic_id);
      if (name !== undefined) updateData.name = name;
      if (content_type !== undefined) updateData.content_type = content_type;
      if (video_file !== undefined) updateData.video_file = video_file;
      if (article_content !== undefined) updateData.article_content = article_content;
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
      if (status !== undefined) updateData.status = status === 'true' || status === true;
      if (description !== undefined) updateData.description = description;
      if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order);

      const lecture = await Lecture.update(parseInt(id), updateData);

      // Handle purposes if provided
      if (req.body.purposes !== undefined) {
        let purposeIds = [];
        try {
          // Parse purposes if it's a JSON string
          if (typeof req.body.purposes === 'string') {
            purposeIds = JSON.parse(req.body.purposes);
          } else if (Array.isArray(req.body.purposes)) {
            purposeIds = req.body.purposes;
          }
          // Ensure all are integers
          purposeIds = purposeIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        } catch (e) {
          console.error('Error parsing purposes:', e);
        }
        await Purpose.setLecturePurposes(parseInt(id), purposeIds);
      }

      // Fetch lecture with purposes
      const lectureWithPurposes = await Lecture.findById(parseInt(id));

      res.json({
        success: true,
        message: 'Lecture updated successfully',
        data: { lecture: lectureWithPurposes }
      });
    } catch (error) {
      console.error('Error updating lecture:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update lecture'
      });
    }
  }

  /**
   * Delete lecture
   * DELETE /api/admin/lectures/:id
   */
  static async deleteLecture(req, res) {
    try {
      const { id } = req.params;
      const lecture = await Lecture.findById(parseInt(id));

      if (!lecture) {
        return res.status(404).json({
          success: false,
          message: 'Lecture not found'
        });
      }

      // Delete video and thumbnail from S3 if exists
      if (lecture.video_file) {
        await deleteFromS3(lecture.video_file);
      }
      if (lecture.thumbnail) {
        await deleteFromS3(lecture.thumbnail);
      }

      await Lecture.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Lecture deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting lecture:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete lecture'
      });
    }
  }

  /**
   * Upload video for lecture
   * POST /api/admin/lectures/upload-video
   */
  static async uploadVideo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No video file provided'
        });
      }

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const s3Url = await uploadToS3(fileBuffer, fileName, 'lecture_videos');

      res.json({
        success: true,
        data: { videoUrl: s3Url }
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload video'
      });
    }
  }

  /**
   * Upload thumbnail for lecture
   * POST /api/admin/lectures/upload-thumbnail
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
      const s3Url = await uploadToS3(fileBuffer, fileName, 'lecture_thumbnails');

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

  /**
   * Upload image for rich text editor (article content)
   * POST /api/admin/lectures/upload-image
   */
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const s3Url = await uploadToS3(fileBuffer, fileName, 'lecture_images');

      res.json({
        success: true,
        data: { imageUrl: s3Url }
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload image'
      });
    }
  }
}

module.exports = LectureController;
module.exports.upload = upload;

