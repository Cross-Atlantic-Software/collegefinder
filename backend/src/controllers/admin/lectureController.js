const XLSX = require('xlsx');
const Lecture = require('../../models/taxonomy/Lecture');
const Purpose = require('../../models/taxonomy/Purpose');
const Topic = require('../../models/taxonomy/Topic');
const Subtopic = require('../../models/taxonomy/Subtopic');
const Stream = require('../../models/taxonomy/Stream');
const Subject = require('../../models/taxonomy/Subject');
const Exam = require('../../models/taxonomy/Exam');
const { validationResult } = require('express-validator');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');
const { buildLogoMapFromRequest, processMissingLogosFromZip, parseLogosFromZip } = require('../../utils/logoUploadUtils');
const { splitList, parseBool, getCell } = require('../../utils/bulkUploadUtils');
const {
  enrichDescriptionFromYoutubeIframe,
  enrichThumbnailFromYoutubeIframe,
  extractYouTubeVideoId,
  fetchYouTubeSnippet,
  pickBestThumbnailUrl,
  MAX_LECTURE_DESCRIPTION_LENGTH,
} = require('../../utils/youtubeMetadata');
const multer = require('multer');
const db = require('../../config/database');

function parseIdArrayField(raw) {
  if (raw === undefined || raw === null || raw === '') return [];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => parseInt(x, 10)).filter((n) => !isNaN(n));
  } catch {
    return [];
  }
}

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
   * Preview YouTube title/description from iframe or URL (Data API v3).
   * POST /api/admin/lectures/youtube-metadata  JSON { iframe_code }
   */
  static async getYoutubeMetadata(req, res) {
    try {
      const iframe_code = req.body?.iframe_code;
      if (iframe_code == null || !String(iframe_code).trim()) {
        return res.status(400).json({
          success: false,
          message: 'iframe_code is required',
        });
      }
      const apiKey =
        process.env.YOUTUBE_API_KEY ||
        process.env.GOOGLE_YOUTUBE_API_KEY ||
        process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          success: false,
          message:
            'YouTube metadata is not configured. Add YOUTUBE_API_KEY from Google Cloud Console (YouTube Data API v3 enabled). AI Studio / Gemini keys are not valid for YouTube.',
        });
      }
      const videoId = extractYouTubeVideoId(String(iframe_code));
      if (!videoId) {
        return res.status(400).json({
          success: false,
          message: 'Could not find a YouTube video id in iframe_code',
        });
      }
      const meta = await fetchYouTubeSnippet(videoId, apiKey);
      if (!meta) {
        return res.status(404).json({
          success: false,
          message: 'Video not found or unavailable',
        });
      }
      const thumbnailUrl = pickBestThumbnailUrl(meta.thumbnails);
      return res.json({
        success: true,
        data: {
          videoId,
          title: meta.title,
          description: meta.description,
          thumbnailUrl: thumbnailUrl || null,
        },
      });
    } catch (error) {
      console.error('getYoutubeMetadata:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch YouTube metadata',
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

      const {
        topic_id,
        subtopic_id,
        name,
        content_type = 'VIDEO',
        status,
        description,
        sort_order,
        article_content,
        iframe_code,
        thumbnail_filename,
      } = req.body;

      // Check if lecture with same name exists for this subtopic
      const existing = await Lecture.findByNameAndSubtopicId(name, parseInt(subtopic_id));
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Lecture with this name already exists for this subtopic'
        });
      }

      // Validate content_type specific fields
      if (content_type === 'ARTICLE') {
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

      const iframeStored =
        content_type === 'VIDEO' && iframe_code && String(iframe_code).trim()
          ? String(iframe_code).trim()
          : null;
      const effectiveIframe =
        content_type === 'VIDEO' && !video_file ? iframeStored : null;
      const finalDescription = await enrichDescriptionFromYoutubeIframe(
        effectiveIframe,
        description
      );

      let finalThumbnail = thumbnail;
      if (!finalThumbnail && effectiveIframe) {
        finalThumbnail = await enrichThumbnailFromYoutubeIframe(effectiveIframe, null);
      }

      const lecture = await Lecture.create({
        topic_id: parseInt(topic_id),
        subtopic_id: parseInt(subtopic_id),
        name,
        content_type,
        video_file,
        iframe_code: content_type === 'VIDEO' ? iframeStored : null,
        article_content: content_type === 'ARTICLE' ? article_content : null,
        thumbnail: finalThumbnail,
        thumbnail_filename: thumbnail_filename != null ? String(thumbnail_filename).trim() || null : null,
        status: status !== undefined ? (status === 'true' || status === true) : true,
        description: finalDescription,
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

      if (req.body.stream_ids !== undefined) {
        await Lecture.setStreams(lecture.id, parseIdArrayField(req.body.stream_ids));
      }
      if (req.body.subject_ids !== undefined) {
        await Lecture.setSubjects(lecture.id, parseIdArrayField(req.body.subject_ids));
      }
      if (req.body.exam_ids !== undefined) {
        await Lecture.setExams(lecture.id, parseIdArrayField(req.body.exam_ids));
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

      const {
        topic_id,
        subtopic_id,
        name,
        content_type,
        status,
        description,
        sort_order,
        article_content,
        iframe_code,
        thumbnail_filename,
      } = req.body;

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
      if (finalContentType === 'ARTICLE') {
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
      if (topic_id !== undefined) updateData.topic_id = parseInt(topic_id);
      if (subtopic_id !== undefined) updateData.subtopic_id = parseInt(subtopic_id);
      if (name !== undefined) updateData.name = name;
      if (content_type !== undefined) updateData.content_type = content_type;
      if (video_file !== undefined) updateData.video_file = video_file;
      // Handle iframe_code - if empty string is sent, clear it (set to null)
      if (iframe_code !== undefined) {
        updateData.iframe_code = iframe_code && iframe_code.trim() !== '' ? iframe_code.trim() : null;
      }
      // If video_file is being set (and not null), clear iframe_code
      if (video_file !== undefined && video_file !== null) {
        updateData.iframe_code = null;
      }
      if (article_content !== undefined) updateData.article_content = article_content;
      if (status !== undefined) updateData.status = status === 'true' || status === true;
      if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order);

      const mergedVideoFile =
        updateData.video_file !== undefined
          ? updateData.video_file
          : existingLecture.video_file;
      const mergedIframe =
        updateData.iframe_code !== undefined
          ? updateData.iframe_code
          : existingLecture.iframe_code;
      const effectiveIframe =
        finalContentType === 'VIDEO' &&
        !(mergedVideoFile && String(mergedVideoFile).trim())
          ? mergedIframe && String(mergedIframe).trim()
            ? String(mergedIframe).trim()
            : null
          : null;
      const baseDesc =
        description !== undefined ? description : existingLecture.description;
      updateData.description = await enrichDescriptionFromYoutubeIframe(
        effectiveIframe,
        baseDesc
      );

      const mergedThumbBefore =
        thumbnail !== undefined ? thumbnail : existingLecture.thumbnail;
      const finalThumbnail = await enrichThumbnailFromYoutubeIframe(
        effectiveIframe,
        mergedThumbBefore
      );
      if (finalThumbnail !== null && finalThumbnail !== existingLecture.thumbnail) {
        updateData.thumbnail = finalThumbnail;
      } else if (thumbnail !== undefined) {
        updateData.thumbnail = thumbnail;
      }

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

      if (req.body.stream_ids !== undefined) {
        await Lecture.setStreams(parseInt(id), parseIdArrayField(req.body.stream_ids));
      }
      if (req.body.subject_ids !== undefined) {
        await Lecture.setSubjects(parseInt(id), parseIdArrayField(req.body.subject_ids));
      }
      if (req.body.exam_ids !== undefined) {
        await Lecture.setExams(parseInt(id), parseIdArrayField(req.body.exam_ids));
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
   * Delete all lectures (S3 video/thumbnail cleanup, then DB; junction rows cascade)
   * DELETE /api/admin/lectures/all
   */
  static async deleteAllLectures(req, res) {
    try {
      const { rows } = await db.query('SELECT id, video_file, thumbnail FROM lectures');
      for (const row of rows) {
        if (row.video_file) {
          try {
            await deleteFromS3(row.video_file);
          } catch (s3Err) {
            console.error('Non-blocking: failed to delete lecture video from S3', row.id, s3Err.message);
          }
        }
        if (row.thumbnail) {
          try {
            await deleteFromS3(row.thumbnail);
          } catch (s3Err) {
            console.error('Non-blocking: failed to delete lecture thumbnail from S3', row.id, s3Err.message);
          }
        }
      }
      const del = await db.query('DELETE FROM lectures');
      const n = del.rowCount ?? 0;
      res.json({
        success: true,
        message: n === 0 ? 'No lectures to delete' : `All ${n} self study item(s) deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting all lectures:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete all lectures',
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

  /**
   * Excel template for bulk self-study material (lectures)
   */
  static async downloadBulkTemplate(req, res) {
    try {
      const headers = [
        'topic_name',
        'subtopic_name',
        'name',
        'content_type',
        'status',
        'description',
        'sort_order',
        'thumbnail_filename',
        'stream_names',
        'subject_names',
        'exam_names',
        'purpose_names',
        'video_file',
        'iframe_code',
        'article_content',
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        [
          'Algebra',
          'Linear Equation',
          'Introduction video',
          'VIDEO',
          'TRUE',
          '',
          '0',
          'intro-thumb.png',
          'Science (PCM)',
          'Physics',
          'JEE Main',
          'Revision',
          '',
          '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>',
          '',
        ],
        [
          'Algebra',
          'Linear Equation',
          'Hosted MP4 lecture',
          'VIDEO',
          'TRUE',
          'Manual description when using video_file URL (not iframe).',
          '0',
          '',
          'Science (PCM)',
          '',
          '',
          '',
          'https://example.com/lecture-video.mp4',
          '',
          '',
        ],
        [
          'Algebra',
          'Linear Equation',
          'Notes article',
          'ARTICLE',
          'TRUE',
          'Manual description for articles.',
          '1',
          '',
          'Science (PCM)',
          '',
          '',
          '',
          '',
          '',
          '<p>Article HTML here</p>',
        ],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'SelfStudyMaterial');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=self-study-material-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating lecture bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  static async downloadAllExcel(req, res) {
    try {
      const lectures = await Lecture.findAll();
      const headers = [
        'topic_name',
        'subtopic_name',
        'name',
        'content_type',
        'status',
        'description',
        'sort_order',
        'thumbnail_filename',
        'stream_names',
        'subject_names',
        'exam_names',
        'purpose_names',
        'video_file',
        'iframe_code',
        'article_content',
      ];
      const rows = [headers];
      for (const lec of lectures) {
        const topic = lec.topic_id ? await Topic.findById(lec.topic_id) : null;
        const sub = lec.subtopic_id ? await Subtopic.findById(lec.subtopic_id) : null;
        const streamsStr = (lec.streams || []).map((s) => s.name).join(', ');
        const subjectsStr = (lec.subjects || []).map((s) => s.name).join(', ');
        const examsStr = (lec.exams || []).map((e) => e.name).join(', ');
        const purposesStr = (lec.purposes || []).map((p) => p.name).join(', ');
        rows.push([
          topic?.name || '',
          sub?.name || '',
          lec.name || '',
          lec.content_type || '',
          lec.status ? 'TRUE' : 'FALSE',
          lec.description || '',
          lec.sort_order != null ? String(lec.sort_order) : '',
          lec.thumbnail_filename || '',
          streamsStr,
          subjectsStr,
          examsStr,
          purposesStr,
          lec.video_file || '',
          lec.iframe_code || '',
          lec.article_content || '',
        ]);
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'SelfStudyMaterial');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=self-study-material-all.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error exporting lectures Excel:', error);
      res.status(500).json({ success: false, message: 'Failed to export data' });
    }
  }

  static async bulkUpload(req, res) {
    try {
      const excelFile = req.files?.excel?.[0] || req.file;
      if (!excelFile?.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Use field name "excel".',
        });
      }

      const thumbnailMap = buildLogoMapFromRequest(req.files || {}, 'thumbnails_zip', 'thumbnails');

      let workbook;
      try {
        workbook = XLSX.read(excelFile.buffer, { type: 'buffer', raw: true });
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid Excel file or format.' });
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const dataRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (!dataRows.length) {
        return res.status(400).json({ success: false, message: 'Excel file has no data rows.' });
      }

      const created = [];
      const errors = [];
      const dupKey = new Set();

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2;
        const topicName = getCell(row, 'topic_name', 'topic_Name');
        const subtopicName = getCell(row, 'subtopic_name', 'subtopic_Name');
        const lecName = getCell(row, 'name');
        if (!topicName) {
          errors.push({ row: rowNum, message: 'topic_name is required' });
          continue;
        }
        if (!subtopicName) {
          errors.push({ row: rowNum, message: 'subtopic_name is required' });
          continue;
        }
        if (!lecName) {
          errors.push({ row: rowNum, message: 'name is required' });
          continue;
        }

        const topic = await Topic.findByName(topicName);
        if (!topic) {
          errors.push({ row: rowNum, message: `topic not found: "${topicName}"` });
          continue;
        }
        const subtopic = await Subtopic.findByTopicIdAndNameInsensitive(topic.id, subtopicName);
        if (!subtopic) {
          errors.push({ row: rowNum, message: `subtopic not found under topic: "${subtopicName}"` });
          continue;
        }

        const key = `${subtopic.id}:${lecName.toLowerCase()}`;
        if (dupKey.has(key)) {
          errors.push({ row: rowNum, message: `duplicate name "${lecName}" for this subtopic in file` });
          continue;
        }
        const existing = await Lecture.findByNameAndSubtopicId(lecName, subtopic.id);
        if (existing) {
          errors.push({ row: rowNum, message: `lecture "${lecName}" already exists for this subtopic` });
          continue;
        }
        dupKey.add(key);

        const contentTypeRaw = (getCell(row, 'content_type', 'content_Type') || 'VIDEO').toUpperCase();
        const content_type = contentTypeRaw === 'ARTICLE' ? 'ARTICLE' : 'VIDEO';
        const status = parseBool(getCell(row, 'status'), true);
        const descriptionRaw = getCell(row, 'description') || null;
        const sortOrderRaw = getCell(row, 'sort_order', 'sort_Order');
        const sort_order = sortOrderRaw !== '' ? parseInt(String(sortOrderRaw), 10) : 0;
        const thumbFn = getCell(row, 'thumbnail_filename', 'thumbnail_Filename') || null;
        const streamNames = getCell(row, 'stream_names', 'stream_Names');
        const subjectNames = getCell(row, 'subject_names', 'subject_Names');
        const examNames = getCell(row, 'exam_names', 'exam_Names');
        const purposeNames = getCell(row, 'purpose_names', 'purpose_Names');
        const video_file_raw = getCell(row, 'video_file', 'video_File');
        const iframe_code = getCell(row, 'iframe_code', 'iframe_Code') || null;
        const article_content = getCell(row, 'article_content', 'article_Content') || null;

        let video_file = null;
        if (content_type === 'VIDEO') {
          const hasVideoUrl =
            video_file_raw && /^https?:\/\//i.test(String(video_file_raw).trim());
          const hasIframe = iframe_code && String(iframe_code).trim();
          if (!hasVideoUrl && !hasIframe) {
            errors.push({ row: rowNum, message: 'VIDEO row needs video_file (URL) or iframe_code' });
            continue;
          }
          if (hasVideoUrl) {
            video_file = String(video_file_raw).trim();
          }
        } else if (!article_content || !String(article_content).trim()) {
          errors.push({ row: rowNum, message: 'ARTICLE row needs article_content' });
          continue;
        }

        let thumbnail = null;
        if (thumbFn && thumbnailMap.size > 0) {
          const tf = thumbnailMap.get(String(thumbFn).toLowerCase());
          if (tf?.buffer) {
            try {
              thumbnail = await uploadToS3(tf.buffer, tf.originalname || thumbFn, 'lecture_thumbnails');
            } catch (e) {
              errors.push({ row: rowNum, message: `thumbnail upload failed: ${e.message}` });
              continue;
            }
          }
        }

        const iframeNorm =
          content_type === 'VIDEO' && iframe_code && String(iframe_code).trim()
            ? String(iframe_code).trim()
            : null;

        let description;
        if (content_type === 'ARTICLE') {
          const t =
            descriptionRaw != null && String(descriptionRaw).trim() !== ''
              ? String(descriptionRaw).trim()
              : '';
          description =
            t.length > MAX_LECTURE_DESCRIPTION_LENGTH
              ? t.slice(0, MAX_LECTURE_DESCRIPTION_LENGTH)
              : t || null;
        } else {
          description = await enrichDescriptionFromYoutubeIframe(
            iframeNorm,
            descriptionRaw
          );
        }

        let thumbnailFinal = thumbnail;
        if (!thumbnailFinal && iframeNorm) {
          thumbnailFinal = await enrichThumbnailFromYoutubeIframe(iframeNorm, null);
        }

        try {
          const lecture = await Lecture.create({
            topic_id: topic.id,
            subtopic_id: subtopic.id,
            name: lecName,
            content_type,
            video_file: content_type === 'VIDEO' ? video_file : null,
            iframe_code: content_type === 'VIDEO' ? iframe_code : null,
            article_content: content_type === 'ARTICLE' ? article_content : null,
            thumbnail: thumbnailFinal,
            thumbnail_filename: thumbFn ? String(thumbFn).trim() : null,
            status,
            description,
            sort_order: Number.isNaN(sort_order) ? 0 : sort_order,
          });

          const streamIds = [];
          for (const nm of splitList(streamNames)) {
            const s = await Stream.findByName(nm);
            if (s) streamIds.push(s.id);
          }
          const subjectIds = [];
          for (const nm of splitList(subjectNames)) {
            const s = await Subject.findByName(nm);
            if (s) subjectIds.push(s.id);
          }
          const examIds = [];
          for (const nm of splitList(examNames)) {
            const e = await Exam.findByName(nm);
            if (e) examIds.push(e.id);
          }
          if (streamIds.length) await Lecture.setStreams(lecture.id, streamIds);
          if (subjectIds.length) await Lecture.setSubjects(lecture.id, subjectIds);
          if (examIds.length) await Lecture.setExams(lecture.id, examIds);

          const purposeIds = [];
          for (const nm of splitList(purposeNames)) {
            const p = await Purpose.findByNameInsensitive(nm);
            if (p) purposeIds.push(p.id);
          }
          if (purposeIds.length) await Purpose.setLecturePurposes(lecture.id, purposeIds);

          created.push({ id: lecture.id, name: lecture.name });
        } catch (createErr) {
          errors.push({ row: rowNum, message: createErr.message || 'Failed to create row' });
        }
      }

      res.json({
        success: true,
        data: {
          created: created.length,
          createdItems: created,
          errors: errors.length,
          errorDetails: errors,
        },
        message: `Created ${created.length} row(s).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`,
      });
    } catch (error) {
      console.error('Error in lectures bulk upload:', error);
      res.status(500).json({ success: false, message: error.message || 'Bulk upload failed' });
    }
  }

  static async uploadMissingThumbnails(req, res) {
    try {
      const zipFile = req.files?.thumbnails_zip?.[0] || req.file;
      if (!zipFile?.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No ZIP file uploaded. Use field name "thumbnails_zip".',
        });
      }
      const logoMap = parseLogosFromZip(zipFile.buffer);
      if (logoMap.size === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or empty ZIP. Include image files only (.jpg, .png, .webp, etc.).',
        });
      }
      const result = await processMissingLogosFromZip(logoMap, {
        findRecordsByFilename: (f) => Lecture.findMissingThumbnailsByFilename(f),
        uploadToS3,
        s3Folder: 'lecture_thumbnails',
        logoColumn: 'thumbnail',
        updateRecord: (id, data) => Lecture.update(id, data),
        toResultItem: (r) => ({
          id: r.id,
          name: r.name,
          thumbnail_filename: r.thumbnail_filename,
        }),
      });
      res.json({
        success: true,
        data: result,
        message: `Added ${result.updated.length} thumbnail(s). ${result.skipped.length} file(s) had no matching rows.`,
      });
    } catch (error) {
      console.error('Error uploading missing lecture thumbnails:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload missing thumbnails',
      });
    }
  }
}

module.exports = LectureController;
module.exports.upload = upload;

