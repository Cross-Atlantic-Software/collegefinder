const Chapter = require('../../models/taxonomy/Chapter');
const { validationResult } = require('express-validator');

class ChapterController {
  static async getAllChapters(req, res) {
    try {
      const chapters = await Chapter.findAll();
      res.json({ success: true, data: { chapters } });
    } catch (error) {
      console.error('Error fetching chapters:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch chapters' });
    }
  }

  static async getChapterById(req, res) {
    try {
      const chapter = await Chapter.findById(parseInt(req.params.id, 10));
      if (!chapter) {
        return res.status(404).json({ success: false, message: 'Chapter not found' });
      }
      res.json({ success: true, data: { chapter } });
    } catch (error) {
      console.error('Error fetching chapter:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch chapter' });
    }
  }

  static async getChaptersBySubjectId(req, res) {
    try {
      const chapters = await Chapter.findBySubjectId(parseInt(req.params.subjectId, 10));
      res.json({ success: true, data: { chapters } });
    } catch (error) {
      console.error('Error fetching chapters by subject:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch chapters' });
    }
  }

  static async createChapter(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { sub_id, name, status, description, sort_order } = req.body;
      const nameTrim = String(name || '').trim();
      if (!nameTrim) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }

      const subjectId = parseInt(sub_id, 10);
      const existing = await Chapter.findBySubjectIdAndNameInsensitive(subjectId, nameTrim);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'A chapter with this name already exists for this subject',
        });
      }

      const chapter = await Chapter.create({
        sub_id: subjectId,
        name: nameTrim,
        status: status !== undefined ? (status === 'true' || status === true) : true,
        description: description || null,
        sort_order: sort_order != null ? parseInt(sort_order, 10) : 0,
      });

      res.status(201).json({
        success: true,
        message: 'Chapter created successfully',
        data: { chapter },
      });
    } catch (error) {
      console.error('Error creating chapter:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create chapter' });
    }
  }

  static async updateChapter(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const id = parseInt(req.params.id, 10);
      const existing = await Chapter.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Chapter not found' });
      }

      const { sub_id, name, status, description, sort_order } = req.body;
      const subjectId = sub_id != null ? parseInt(sub_id, 10) : existing.sub_id;
      const nextName = name !== undefined ? String(name).trim() : existing.name;

      if (
        (name !== undefined && nextName !== String(existing.name).trim()) ||
        (sub_id !== undefined && subjectId !== existing.sub_id)
      ) {
        const dup = await Chapter.findBySubjectIdAndNameInsensitive(subjectId, nextName);
        if (dup && dup.id !== id) {
          return res.status(400).json({
            success: false,
            message: 'A chapter with this name already exists for this subject',
          });
        }
      }

      const updateData = {};
      if (sub_id !== undefined) updateData.sub_id = subjectId;
      if (name !== undefined) updateData.name = nextName;
      if (status !== undefined) updateData.status = status === 'true' || status === true;
      if (description !== undefined) updateData.description = description;
      if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order, 10);

      const chapter = await Chapter.update(id, updateData);
      res.json({
        success: true,
        message: 'Chapter updated successfully',
        data: { chapter },
      });
    } catch (error) {
      console.error('Error updating chapter:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update chapter' });
    }
  }

  static async deleteChapter(req, res) {
    try {
      const chapter = await Chapter.delete(parseInt(req.params.id, 10));
      if (!chapter) {
        return res.status(404).json({ success: false, message: 'Chapter not found' });
      }
      res.json({ success: true, message: 'Chapter deleted successfully' });
    } catch (error) {
      console.error('Error deleting chapter:', error);
      res.status(500).json({ success: false, message: 'Failed to delete chapter' });
    }
  }

  static async deleteAllChapters(req, res) {
    try {
      const count = await Chapter.deleteAll();
      res.json({
        success: true,
        message: `Deleted ${count} chapter(s)`,
      });
    } catch (error) {
      console.error('Error deleting all chapters:', error);
      res.status(500).json({ success: false, message: 'Failed to delete chapters' });
    }
  }
}

module.exports = ChapterController;
