const Subtopic = require('../../models/taxonomy/Subtopic');
const Topic = require('../../models/taxonomy/Topic');
const { validationResult } = require('express-validator');
const XLSX = require('xlsx');
const { getCell } = require('../../utils/bulkUploadUtils');
const multer = require('multer');

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

class SubtopicController {
  /**
   * Get all subtopics
   * GET /api/admin/subtopics
   */
  static async getAllSubtopics(req, res) {
    try {
      const subtopics = await Subtopic.findAll();
      const subtopicIds = subtopics.map((s) => s.id);
      const examIdsBySubtopic = subtopicIds.length > 0 ? await Subtopic.getExamIdsBySubtopicIds(subtopicIds) : {};
      const subtopicsWithExams = subtopics.map((s) => ({ ...s, exam_ids: examIdsBySubtopic[s.id] || [] }));
      res.json({
        success: true,
        data: { subtopics: subtopicsWithExams }
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
      const subtopicId = parseInt(id);
      const subtopic = await Subtopic.findById(subtopicId);

      if (!subtopic) {
        return res.status(404).json({
          success: false,
          message: 'Subtopic not found'
        });
      }

      const examIds = await Subtopic.getExamIds(subtopicId);
      res.json({
        success: true,
        data: { subtopic: { ...subtopic, exam_ids: examIds } }
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

      const { topic_id, name, status, sort_order } = req.body;

      const nameTrim = String(name || '').trim();
      if (!nameTrim) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }

      const globalDup = await Subtopic.findAllByTrimmedNameInsensitive(nameTrim);
      if (globalDup.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'A subtopic with this name already exists (subtopic names are unique)',
        });
      }

      const existingInTopic = await Subtopic.findByTopicIdAndNameInsensitive(parseInt(topic_id, 10), nameTrim);
      if (existingInTopic) {
        return res.status(400).json({
          success: false,
          message: 'Subtopic with this name already exists for this topic',
        });
      }

      const subtopic = await Subtopic.create({
        topic_id: parseInt(topic_id, 10),
        name: nameTrim,
        status: status !== undefined ? (status === 'true' || status === true) : true,
        description: null,
        sort_order: sort_order != null ? parseInt(sort_order, 10) : 0,
      });

      const examIds = await Subtopic.getExamIds(subtopic.id);
      res.status(201).json({
        success: true,
        message: 'Subtopic created successfully',
        data: { subtopic: { ...subtopic, exam_ids: examIds } },
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

      const { topic_id, name, status, sort_order } = req.body;

      const topicId = topic_id != null ? parseInt(topic_id, 10) : existingSubtopic.topic_id;
      const nextName = name !== undefined ? String(name).trim() : existingSubtopic.name;

      if (name !== undefined && nextName !== String(existingSubtopic.name).trim()) {
        const globalDup = await Subtopic.findAllByTrimmedNameInsensitive(nextName);
        const taken = globalDup.some((s) => s.id !== parseInt(id, 10));
        if (taken) {
          return res.status(400).json({
            success: false,
            message: 'A subtopic with this name already exists (subtopic names are unique)',
          });
        }
        const inTopic = await Subtopic.findByTopicIdAndNameInsensitive(topicId, nextName);
        if (inTopic && inTopic.id !== parseInt(id, 10)) {
          return res.status(400).json({
            success: false,
            message: 'Subtopic with this name already exists for this topic',
          });
        }
      }

      const updateData = {};
      if (topic_id !== undefined) updateData.topic_id = topicId;
      if (name !== undefined) updateData.name = nextName;
      if (status !== undefined) updateData.status = status === 'true' || status === true;
      if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order, 10);

      const subtopic = await Subtopic.update(parseInt(id, 10), updateData);
      const examIds = await Subtopic.getExamIds(parseInt(id, 10));
      res.json({
        success: true,
        message: 'Subtopic updated successfully',
        data: { subtopic: { ...subtopic, exam_ids: examIds } },
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
  /**
   * Excel template: subtopic_name, topic_name (topic_name must match exactly one topic).
   * GET /api/admin/subtopics/bulk-upload-template
   */
  static async downloadBulkTemplate(req, res) {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['subtopic_name', 'topic_name'],
        ['Linear Equations', 'Algebra Basics'],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Subtopics');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=subtopics-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error building subtopics bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to build template' });
    }
  }

  /**
   * Bulk create subtopics from Excel (subtopic_name, topic_name).
   * POST /api/admin/subtopics/bulk-upload  (field: excel)
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
      const seenSubtopicNames = new Set();

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2;

        const subtopicName = getCell(row, 'subtopic_name', 'subtopic_Name', 'Subtopic_Name', 'Subtopic name');
        if (!subtopicName) {
          errors.push({ row: rowNum, message: 'subtopic_name is required' });
          continue;
        }

        const sk = subtopicName.toLowerCase().replace(/\s+/g, ' ').trim();
        if (seenSubtopicNames.has(sk)) {
          errors.push({ row: rowNum, message: `duplicate subtopic_name in file: "${subtopicName}"` });
          continue;
        }
        seenSubtopicNames.add(sk);

        const topicName = getCell(row, 'topic_name', 'topic_Name', 'Topic_Name', 'Topic name');
        if (!topicName) {
          errors.push({ row: rowNum, message: 'topic_name is required' });
          continue;
        }

        const topicMatches = await Topic.findAllByTrimmedNameInsensitive(topicName);
        if (topicMatches.length === 0) {
          errors.push({ row: rowNum, message: `topic not found: "${topicName}"` });
          continue;
        }
        if (topicMatches.length > 1) {
          errors.push({
            row: rowNum,
            message: `multiple topics named "${topicName}" in database; names must be unique`,
          });
          continue;
        }

        const topicRow = topicMatches[0];

        const existingGlobal = await Subtopic.findAllByTrimmedNameInsensitive(subtopicName);
        if (existingGlobal.length > 0) {
          errors.push({ row: rowNum, message: `subtopic already exists: "${subtopicName}"` });
          continue;
        }

        const inTopic = await Subtopic.findByTopicIdAndNameInsensitive(topicRow.id, subtopicName);
        if (inTopic) {
          errors.push({ row: rowNum, message: `subtopic already exists under topic: "${subtopicName}"` });
          continue;
        }

        try {
          const subtopic = await Subtopic.create({
            topic_id: topicRow.id,
            name: subtopicName.trim(),
            status: true,
            description: null,
            sort_order: 0,
          });
          created.push({ id: subtopic.id, name: subtopic.name, topic_id: subtopic.topic_id });
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
        message: `Created ${created.length} subtopic(s).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`,
      });
    } catch (error) {
      console.error('Error in subtopics bulk upload:', error);
      res.status(500).json({ success: false, message: error.message || 'Bulk upload failed' });
    }
  }

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

  /**
   * Delete all subtopics
   * DELETE /api/admin/subtopics/all
   */
  static async deleteAllSubtopics(req, res) {
    try {
      await Subtopic.deleteAll();
      res.json({
        success: true,
        message: 'All subtopics deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting all subtopics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete all subtopics'
      });
    }
  }
}

module.exports = SubtopicController;
module.exports.uploadExcel = uploadExcel;

