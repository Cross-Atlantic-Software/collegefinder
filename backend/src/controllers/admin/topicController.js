const Topic = require('../../models/taxonomy/Topic');
const Subject = require('../../models/taxonomy/Subject');
const Chapter = require('../../models/taxonomy/Chapter');
const { validationResult } = require('express-validator');
const XLSX = require('xlsx');
const { splitList, getCell } = require('../../utils/bulkUploadUtils');
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
  },
});

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/** Normalized composite key: same topic name is allowed under different chapters. */
function topicChapterKey(topicName, chapterName, subjectName) {
  const topic = String(topicName || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const chapter = String(chapterName || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const subject = String(subjectName || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return `${subject}::${chapter}::${topic}`;
}

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

      const { chapter_id, name, home_display, status, sort_order } = req.body;

      const nameSame = String(name || '').trim();
      if (!nameSame) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }

      const chapterId = parseInt(chapter_id, 10);
      const duplicates = await Topic.findByChapterIdAndNameInsensitive(chapterId, nameSame);
      if (duplicates) {
        return res.status(400).json({
          success: false,
          message: 'A topic with this name already exists for this chapter',
        });
      }

      const topic = await Topic.create({
        chapter_id: chapterId,
        name: nameSame,
        thumbnail: null,
        home_display: home_display === 'true' || home_display === true,
        status: status !== undefined ? (status === 'true' || status === true) : true,
        description: null,
        sort_order: sort_order != null ? parseInt(sort_order, 10) : 0,
      });

      const examIds = await Topic.getExamIds(topic.id);
      res.status(201).json({
        success: true,
        message: 'Topic created successfully',
        data: { topic: { ...topic, exam_ids: examIds } },
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

      const { chapter_id, name, home_display, status, sort_order } = req.body;

      const chapterId = chapter_id != null ? parseInt(chapter_id, 10) : existingTopic.chapter_id;
      const nextName = name !== undefined ? String(name).trim() : existingTopic.name;
      if (
        (name !== undefined && nextName !== String(existingTopic.name).trim()) ||
        (chapter_id !== undefined && chapterId !== existingTopic.chapter_id)
      ) {
        const inChapter = await Topic.findByChapterIdAndNameInsensitive(chapterId, nextName);
        if (inChapter && inChapter.id !== parseInt(id, 10)) {
          return res.status(400).json({
            success: false,
            message: 'A topic with this name already exists for this chapter',
          });
        }
      }

      const updateData = {};
      if (chapter_id !== undefined) updateData.chapter_id = chapterId;
      if (name !== undefined) updateData.name = nextName;
      if (home_display !== undefined) updateData.home_display = home_display === 'true' || home_display === true;
      if (status !== undefined) updateData.status = status === 'true' || status === true;
      if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order, 10);

      const topic = await Topic.update(parseInt(id, 10), updateData);
      const examIds = await Topic.getExamIds(parseInt(id, 10));
      res.json({
        success: true,
        message: 'Topic updated successfully',
        data: { topic: { ...topic, exam_ids: examIds } },
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
   * Delete all topics
   * DELETE /api/admin/topics/all
   */
  static async deleteAllTopics(req, res) {
    try {
      await Topic.deleteAll();
      res.json({
        success: true,
        message: 'All topics deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting all topics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete all topics'
      });
    }
  }

  /**
   * Upload thumbnail for topic
   * POST /api/admin/topics/upload-thumbnail
   */
  /**
   * Excel template: topic_name, chapter_name, subject_name (subject identifies chapter).
   * GET /api/admin/topics/bulk-upload-template
   */
  static async downloadBulkTemplate(req, res) {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['topic_name', 'chapter_name', 'subject_name'],
        ['Algebra Basics', 'General', 'Mathematics'],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Topics');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=topics-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error building topics bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to build template' });
    }
  }

  /**
   * Bulk create topics from Excel (topic_name, chapter_name, subject_name).
   * POST /api/admin/topics/bulk-upload  (field: excel)
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

      const created = [];
      const errors = [];
      const seenTopicChapterKeys = new Set();

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2;

        const topicName = getCell(row, 'topic_name', 'topic_Name', 'Topic_Name', 'Topic name');
        if (!topicName) {
          errors.push({ row: rowNum, message: 'topic_name is required' });
          continue;
        }

        const chapterName = getCell(row, 'chapter_name', 'chapter_Name', 'Chapter_Name', 'Chapter name');
        if (!chapterName) {
          errors.push({ row: rowNum, message: 'chapter_name is required' });
          continue;
        }

        const subjectName = getCell(row, 'subject_name', 'subject_Name', 'Subject_Name', 'subject_names', 'subject name', 'Subject name');
        if (!subjectName) {
          errors.push({ row: rowNum, message: 'subject_name is required' });
          continue;
        }

        const subject = await Subject.findByName(String(subjectName).trim());
        if (!subject) {
          errors.push({ row: rowNum, message: `subject not found: "${subjectName}"` });
          continue;
        }

        const chapter = await Chapter.findBySubjectIdAndNameInsensitive(subject.id, chapterName);
        if (!chapter) {
          errors.push({
            row: rowNum,
            message: `chapter "${chapterName}" not found under subject "${subject.name}"`,
          });
          continue;
        }

        const rowKey = topicChapterKey(topicName, chapter.name, subject.name);
        if (seenTopicChapterKeys.has(rowKey)) {
          errors.push({
            row: rowNum,
            message: `duplicate topic "${topicName}" under chapter "${chapter.name}" in file`,
          });
          continue;
        }
        seenTopicChapterKeys.add(rowKey);

        const existingInChapter = await Topic.findByChapterIdAndNameInsensitive(chapter.id, topicName);
        if (existingInChapter) {
          errors.push({
            row: rowNum,
            message: `topic "${topicName}" already exists under chapter "${chapter.name}"`,
          });
          continue;
        }

        try {
          const topic = await Topic.create({
            chapter_id: chapter.id,
            name: topicName.trim(),
            thumbnail: null,
            home_display: false,
            status: true,
            description: null,
            sort_order: 0,
          });
          created.push({ id: topic.id, name: topic.name });
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
        message: `Created ${created.length} topic(s).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`,
      });
    } catch (error) {
      console.error('Error in topics bulk upload:', error);
      res.status(500).json({ success: false, message: error.message || 'Bulk upload failed' });
    }
  }

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
module.exports.uploadExcel = uploadExcel;

