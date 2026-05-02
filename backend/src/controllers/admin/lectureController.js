const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const XLSX = require('xlsx');
const Lecture = require('../../models/taxonomy/Lecture');
const Topic = require('../../models/taxonomy/Topic');
const Subtopic = require('../../models/taxonomy/Subtopic');
const Subject = require('../../models/taxonomy/Subject');
const Exam = require('../../models/taxonomy/Exam');
const { validationResult } = require('express-validator');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');
const { buildLogoMapFromRequest, processMissingLogosFromZip, parseLogosFromZip } = require('../../utils/logoUploadUtils');
const { splitList, getCell } = require('../../utils/bulkUploadUtils');
const {
  enrichDescriptionFromYoutubeIframe,
  enrichThumbnailFromYoutubeIframe,
  extractYouTubeVideoId,
  fetchYouTubeLectureMetadata,
  pickBestThumbnailUrl,
} = require('../../utils/youtubeMetadata');
const multer = require('multer');
const db = require('../../config/database');
const { generateAndPersistLectureHookSummary } = require('../../utils/lectureHookSummary');
const {
  enqueueLectureHookSummary,
  enqueueLectureHookSummaryIfPending,
  getLectureHookSummaryQueue,
} = require('../../jobs/queues/lectureHookSummaryQueue');
const UploadJob = require('../../models/UploadJob');
const { enqueueLectureBulkUploadJob } = require('../../jobs/queues/lectureBulkUploadQueue');

const LECTURE_BULK_UPLOAD_DIR = path.join(__dirname, '../../../uploads/lecture-bulk');

/** Safe string for Excel cells (length cap; timestamps as ISO). */
function excelCell(val, maxLen = 32000) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (val instanceof Date) return val.toISOString();
  let s = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (s.length > maxLen) return `${s.slice(0, maxLen - 24)}…[truncated]`;
  return s;
}

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

function toStoredYoutubeIframe(rawValue) {
  if (rawValue == null) return null;
  const input = String(rawValue).trim();
  if (!input) return null;

  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return input;

  return `<iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}

/** For Excel export: one column for the link admins paste in bulk upload. */
function exportYoutubeOrVideoLink(lec) {
  const id = extractYouTubeVideoId(String(lec.iframe_code || ''));
  if (id) return `https://www.youtube.com/watch?v=${id}`;
  return lec.video_file || '';
}

async function getLectureYoutubeMetaFromIframe(iframeCode) {
  if (!iframeCode || !String(iframeCode).trim()) return null;
  const apiKey =
    process.env.YOUTUBE_API_KEY ||
    process.env.GOOGLE_YOUTUBE_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  const videoId = extractYouTubeVideoId(String(iframeCode));
  if (!videoId) return null;
  try {
    return await fetchYouTubeLectureMetadata(videoId, apiKey);
  } catch (e) {
    console.error('getLectureYoutubeMetaFromIframe:', e.message || e);
    return null;
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
   * Queue health / progress for lecture hook summary jobs.
   * GET /api/admin/lectures/hook-summary-queue-status
   */
  static async getHookSummaryQueueStatus(req, res) {
    try {
      let queueAvailable = true;
      let counts = null;
      try {
        const queue = getLectureHookSummaryQueue();
        counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
      } catch (queueErr) {
        queueAvailable = false;
        counts = null;
        console.warn('lecture hook summary queue status unavailable:', queueErr.message || queueErr);
      }

      const summaryResult = await db.query(
        `SELECT
           COUNT(*) FILTER (WHERE content_type = 'VIDEO')::int AS total_video_lectures,
           COUNT(*) FILTER (
             WHERE content_type = 'VIDEO'
               AND hook_summary IS NOT NULL
               AND TRIM(hook_summary) <> ''
           )::int AS completed_video_hook_summaries,
           COUNT(*) FILTER (
             WHERE content_type = 'VIDEO'
               AND (hook_summary IS NULL OR TRIM(hook_summary) = '')
           )::int AS pending_video_hook_summaries
         FROM lectures`
      );
      const summary = summaryResult.rows[0] || {
        total_video_lectures: 0,
        completed_video_hook_summaries: 0,
        pending_video_hook_summaries: 0,
      };

      res.json({
        success: true,
        data: {
          queueAvailable,
          queueCounts: counts,
          totalVideoLectures: summary.total_video_lectures || 0,
          completedVideoHookSummaries: summary.completed_video_hook_summaries || 0,
          pendingVideoHookSummaries: summary.pending_video_hook_summaries || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching lecture hook summary queue status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lecture hook summary queue status',
      });
    }
  }

  /**
   * Enqueue hook summary generation for all pending video lectures (manual trigger).
   * POST /api/admin/lectures/hook-summary-queue/generate-pending
   */
  static async enqueuePendingHookSummaries(req, res) {
    try {
      const pendingResult = await db.query(
        `SELECT id
         FROM lectures
         WHERE content_type = 'VIDEO'
           AND (hook_summary IS NULL OR TRIM(hook_summary) = '')`
      );
      const ids = pendingResult.rows.map((r) => parseInt(r.id, 10)).filter((n) => !Number.isNaN(n) && n > 0);

      let queued = 0;
      let skipped = 0;
      let failed = 0;
      for (const lectureId of ids) {
        try {
          const outcome = await enqueueLectureHookSummaryIfPending(lectureId);
          if (outcome.kind === 'queued') queued += 1;
          else skipped += 1;
        } catch (err) {
          failed += 1;
          console.warn(`Failed to enqueue hook summary for lecture ${lectureId}:`, err.message || err);
        }
      }

      return res.json({
        success: true,
        message: `Queued ${queued} lecture hook summary job(s)${skipped ? ` (${skipped} already in queue)` : ''}.`,
        data: {
          totalPending: ids.length,
          queued,
          skipped,
          failed,
        },
      });
    } catch (error) {
      console.error('Error enqueueing pending lecture hook summaries:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to enqueue pending lecture hook summaries',
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
      const meta = await fetchYouTubeLectureMetadata(videoId, apiKey);
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
          channelName: meta.channelName || null,
          channelId: meta.channelId || null,
          channelUrl: meta.channelUrl || null,
          likeCount: meta.likeCount ?? null,
          subscriberCount: meta.subscriberCount ?? null,
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
        content_type = 'VIDEO',
        status,
        description,
        key_topics_to_be_covered,
        sort_order,
        article_content,
        iframe_code,
        thumbnail_filename,
      } = req.body;

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
      const youtubeMeta = await getLectureYoutubeMetaFromIframe(effectiveIframe);
      const youtubeTitle = youtubeMeta?.title ? String(youtubeMeta.title).trim() : '';
      if (youtubeTitle) {
        const existing = await Lecture.findByYoutubeTitleAndSubtopicId(youtubeTitle, parseInt(subtopic_id, 10));
        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'Lecture with this YouTube title already exists for this subtopic',
          });
        }
      }

      let finalThumbnail = thumbnail;
      if (!finalThumbnail && effectiveIframe) {
        finalThumbnail = await enrichThumbnailFromYoutubeIframe(effectiveIframe, null);
      }

      const lecture = await Lecture.create({
        topic_id: parseInt(topic_id),
        subtopic_id: parseInt(subtopic_id),
        content_type,
        video_file,
        iframe_code: content_type === 'VIDEO' ? iframeStored : null,
        article_content: content_type === 'ARTICLE' ? article_content : null,
        thumbnail: finalThumbnail,
        thumbnail_filename: thumbnail_filename != null ? String(thumbnail_filename).trim() || null : null,
        status: status !== undefined ? (status === 'true' || status === true) : true,
        description: finalDescription,
        key_topics_to_be_covered:
          key_topics_to_be_covered != null && String(key_topics_to_be_covered).trim() !== ''
            ? String(key_topics_to_be_covered).trim()
            : null,
        sort_order: sort_order ? parseInt(sort_order) : 0,
        youtube_title: youtubeMeta?.title || null,
        youtube_channel_name: youtubeMeta?.channelName || null,
        youtube_channel_id: youtubeMeta?.channelId || null,
        youtube_channel_url: youtubeMeta?.channelUrl || null,
        youtube_like_count: youtubeMeta?.likeCount ?? null,
        youtube_subscriber_count: youtubeMeta?.subscriberCount ?? null,
      });

      if (req.body.stream_ids !== undefined) {
        await Lecture.setStreams(lecture.id, parseIdArrayField(req.body.stream_ids));
      }
      if (req.body.subject_ids !== undefined) {
        await Lecture.setSubjects(lecture.id, parseIdArrayField(req.body.subject_ids));
      }
      if (req.body.exam_ids !== undefined) {
        await Lecture.setExams(lecture.id, parseIdArrayField(req.body.exam_ids));
      }

      try {
        await generateAndPersistLectureHookSummary(lecture.id);
      } catch (hookErr) {
        console.error('lectureHookSummary (create):', hookErr.message || hookErr);
      }

      const lectureFull = await Lecture.findById(lecture.id);

      res.status(201).json({
        success: true,
        message: 'Lecture created successfully',
        data: { lecture: lectureFull }
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
        content_type,
        status,
        description,
        key_topics_to_be_covered,
        sort_order,
        article_content,
        iframe_code,
        thumbnail_filename,
      } = req.body;

      const subtopicId = subtopic_id ? parseInt(subtopic_id) : existingLecture.subtopic_id;

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
      if (key_topics_to_be_covered !== undefined) {
        updateData.key_topics_to_be_covered =
          key_topics_to_be_covered != null && String(key_topics_to_be_covered).trim() !== ''
            ? String(key_topics_to_be_covered).trim()
            : null;
      }

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
      const youtubeMeta = await getLectureYoutubeMetaFromIframe(effectiveIframe);
      const youtubeTitle = youtubeMeta?.title ? String(youtubeMeta.title).trim() : '';
      if (finalContentType === 'VIDEO' && youtubeTitle) {
        const titleExists = await Lecture.findByYoutubeTitleAndSubtopicId(youtubeTitle, subtopicId);
        if (titleExists && titleExists.id !== parseInt(id, 10)) {
          return res.status(400).json({
            success: false,
            message: 'Lecture with this YouTube title already exists for this subtopic',
          });
        }
      }
      if (finalContentType === 'VIDEO' && effectiveIframe) {
        updateData.youtube_title = youtubeMeta?.title || null;
        updateData.youtube_channel_name = youtubeMeta?.channelName || null;
        updateData.youtube_channel_id = youtubeMeta?.channelId || null;
        updateData.youtube_channel_url = youtubeMeta?.channelUrl || null;
        updateData.youtube_like_count = youtubeMeta?.likeCount ?? null;
        updateData.youtube_subscriber_count = youtubeMeta?.subscriberCount ?? null;
      } else if (finalContentType === 'ARTICLE') {
        updateData.youtube_title = null;
        updateData.youtube_channel_name = null;
        updateData.youtube_channel_id = null;
        updateData.youtube_channel_url = null;
        updateData.youtube_like_count = null;
        updateData.youtube_subscriber_count = null;
      }

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

      if (req.body.stream_ids !== undefined) {
        await Lecture.setStreams(parseInt(id), parseIdArrayField(req.body.stream_ids));
      }
      if (req.body.subject_ids !== undefined) {
        await Lecture.setSubjects(parseInt(id), parseIdArrayField(req.body.subject_ids));
      }
      if (req.body.exam_ids !== undefined) {
        await Lecture.setExams(parseInt(id), parseIdArrayField(req.body.exam_ids));
      }

      try {
        await generateAndPersistLectureHookSummary(parseInt(id, 10));
      } catch (hookErr) {
        console.error('lectureHookSummary (update):', hookErr.message || hookErr);
      }

      const lectureFull = await Lecture.findById(parseInt(id));

      res.json({
        success: true,
        message: 'Lecture updated successfully',
        data: { lecture: lectureFull }
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
        'key_topics_to_be_covered',
        'subject_names',
        'exam_names',
        'youtube_video_link',
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        [
          'Algebra',
          'Linear Equation',
          'Variables, isolating x, checking solutions.',
          'Physics',
          'JEE Main',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ],
        [
          'Algebra',
          'Linear Equation',
          'Optional outline for non-YouTube URLs.',
          '',
          '',
          'https://example.com/lecture-video.mp4',
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
      const [topicsAll, subtopicsAll] = await Promise.all([Topic.findAll(), Subtopic.findAll()]);
      const topicById = new Map(topicsAll.map((t) => [t.id, t]));
      const subById = new Map(subtopicsAll.map((s) => [s.id, s]));

      const headers = [
        'topic_name',
        'subtopic_name',
        'content_type',
        'video_file',
        'youtube_video_link',
        'iframe_code',
        'article_content',
        'thumbnail',
        'thumbnail_filename',
        'description',
        'key_topics_to_be_covered',
        'youtube_title',
        'youtube_channel_name',
        'youtube_channel_id',
        'youtube_channel_url',
        'youtube_like_count',
        'youtube_subscriber_count',
        'hook_summary',
        'status',
        'sort_order',
        'stream_names',
        'subject_names',
        'exam_names',
        'created_at',
        'updated_at',
      ];
      const rows = [headers];
      for (const lec of lectures) {
        const topic = lec.topic_id ? topicById.get(lec.topic_id) : null;
        const sub = lec.subtopic_id ? subById.get(lec.subtopic_id) : null;
        const streams = lec.streams || [];
        const subjects = lec.subjects || [];
        const exams = lec.exams || [];
        rows.push([
          excelCell(topic?.name),
          excelCell(sub?.name),
          excelCell(lec.content_type),
          excelCell(lec.video_file),
          excelCell(exportYoutubeOrVideoLink(lec)),
          excelCell(lec.iframe_code),
          excelCell(lec.article_content),
          excelCell(lec.thumbnail),
          excelCell(lec.thumbnail_filename),
          excelCell(lec.description),
          excelCell(lec.key_topics_to_be_covered),
          excelCell(lec.youtube_title),
          excelCell(lec.youtube_channel_name),
          excelCell(lec.youtube_channel_id),
          excelCell(lec.youtube_channel_url),
          excelCell(lec.youtube_like_count),
          excelCell(lec.youtube_subscriber_count),
          excelCell(lec.hook_summary),
          excelCell(lec.status),
          excelCell(lec.sort_order),
          excelCell(streams.map((s) => s.name).join(', ')),
          excelCell(subjects.map((s) => s.name).join(', ')),
          excelCell(exams.map((e) => e.name).join(', ')),
          excelCell(lec.created_at),
          excelCell(lec.updated_at),
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

  /**
   * Queue async bulk upload — stores Excel + optional thumbnails ZIP on disk, returns job id immediately.
   * POST /api/admin/lectures/bulk-upload
   */
  static async bulkUpload(req, res) {
    try {
      const excelFile = req.files?.excel?.[0] || req.file;
      if (!excelFile?.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Use field name "excel".',
        });
      }

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

      if (!fs.existsSync(LECTURE_BULK_UPLOAD_DIR)) {
        fs.mkdirSync(LECTURE_BULK_UPLOAD_DIR, { recursive: true });
      }

      const fileKey = randomUUID();
      const excelPath = path.join(LECTURE_BULK_UPLOAD_DIR, `${fileKey}.xlsx`);
      fs.writeFileSync(excelPath, excelFile.buffer);

      let zipPath = null;
      const zipFile = req.files?.thumbnails_zip?.[0];
      if (zipFile?.buffer) {
        zipPath = path.join(LECTURE_BULK_UPLOAD_DIR, `${fileKey}-thumbnails.zip`);
        fs.writeFileSync(zipPath, zipFile.buffer);
      }

      const adminId = req.admin?.id ?? null;
      const uploadJob = await UploadJob.create({
        module: 'lectures',
        file_path: excelPath,
        thumbnails_zip_path: zipPath,
        original_filename: excelFile.originalname || null,
        total_rows: dataRows.length,
        created_by_admin_id: adminId,
      });

      try {
        await enqueueLectureBulkUploadJob(uploadJob.id);
      } catch (queueErr) {
        console.error('[lectures bulkUpload] queue error:', queueErr);
        try {
          if (fs.existsSync(excelPath)) fs.unlinkSync(excelPath);
          if (zipPath && fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        } catch (_) {}
        await UploadJob.update(uploadJob.id, {
          status: 'failed',
          error_message: queueErr.message || 'Queue unavailable',
        });
        return res.status(503).json({
          success: false,
          message:
            'Background job queue unavailable (Redis). Start Redis or configure REDIS_HOST / REDIS_PORT. ' +
            (queueErr.message || ''),
        });
      }

      return res.status(202).json({
        success: true,
        data: {
          jobId: String(uploadJob.id),
        },
        message: 'Bulk upload job queued. Poll GET /api/admin/lectures/upload-jobs/:id/status for progress.',
      });
    } catch (error) {
      console.error('Error starting lectures bulk upload job:', error);
      res.status(500).json({ success: false, message: error.message || 'Bulk upload failed' });
    }
  }

  /**
   * GET /api/admin/lectures/upload-jobs/:id/status
   */
  static async getBulkUploadJobStatus(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid job id' });
      }
      const job = await UploadJob.findById(id);
      if (!job || job.module !== 'lectures') {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
      return res.json({
        success: true,
        data: {
          total: job.total_rows,
          processed: job.processed_rows,
          success: job.success_count,
          failed: job.failed_count,
          status: job.status,
          hookSummariesQueued: job.hook_summaries_queued,
          errorMessage: job.error_message || null,
          originalFilename: job.original_filename,
        },
      });
    } catch (error) {
      console.error('getBulkUploadJobStatus:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to load job status' });
    }
  }

  /**
   * GET /api/admin/lectures/upload-jobs/:id/failures.csv
   */
  static async downloadBulkUploadFailuresCsv(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid job id' });
      }
      const job = await UploadJob.findById(id);
      if (!job || job.module !== 'lectures') {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
      const rows = await UploadJob.listFailedRowsForCsv(id);
      const lines = ['row_number,error_message'];
      for (const r of rows) {
        const msg = String(r.error_message || '').replace(/"/g, '""');
        lines.push(`${r.row_number},"${msg}"`);
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=lecture-bulk-job-${id}-failures.csv`
      );
      res.send(lines.join('\n'));
    } catch (error) {
      console.error('downloadBulkUploadFailuresCsv:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to export CSV' });
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
          name: r.youtube_title || 'Untitled lecture',
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

