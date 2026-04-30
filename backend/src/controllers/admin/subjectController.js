const XLSX = require('xlsx');
const Subject = require('../../models/taxonomy/Subject');
const Stream = require('../../models/taxonomy/Stream');
const { validationResult } = require('express-validator');
const { splitList } = require('../../utils/bulkUploadUtils');

class SubjectController {
  /**
   * Get all subjects
   * GET /api/admin/subjects
   */
  static async getAllSubjects(req, res) {
    try {
      const subjects = await Subject.findAll();
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
   * Get subject by ID
   * GET /api/admin/subjects/:id
   */
  static async getSubjectById(req, res) {
    try {
      const { id } = req.params;
      const subject = await Subject.findById(parseInt(id));

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      res.json({
        success: true,
        data: { subject }
      });
    } catch (error) {
      console.error('Error fetching subject:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subject'
      });
    }
  }

  /**
   * Create new subject
   * POST /api/admin/subjects
   */
  static async createSubject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, streams, status } = req.body;

      // Check if name already exists
      const existing = await Subject.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Subject with this name already exists'
        });
      }

      // Parse streams array if provided
      let streamsArray = [];
      if (streams !== undefined) {
        try {
          streamsArray = typeof streams === 'string' ? JSON.parse(streams) : streams;
          if (!Array.isArray(streamsArray)) streamsArray = [];
          // Ensure all are numbers
          streamsArray = streamsArray.map(s => Number(s)).filter(n => !isNaN(n));
        } catch (e) {
          streamsArray = [];
        }
      }

      const subject = await Subject.create({ 
        name,
        streams: streamsArray,
        status: status !== undefined ? status : true 
      });

      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: { subject }
      });
    } catch (error) {
      console.error('Error creating subject:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create subject'
      });
    }
  }

  /**
   * Update subject
   * PUT /api/admin/subjects/:id
   */
  static async updateSubject(req, res) {
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
      const existingSubject = await Subject.findById(parseInt(id));

      if (!existingSubject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      const { name, streams, status } = req.body;

      // Check if name is being changed and if it already exists
      if (name && name !== existingSubject.name) {
        const nameExists = await Subject.findByName(name);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Subject with this name already exists'
          });
        }
      }

      // Parse streams array if provided
      let streamsArray = undefined;
      if (streams !== undefined) {
        try {
          streamsArray = typeof streams === 'string' ? JSON.parse(streams) : streams;
          if (!Array.isArray(streamsArray)) streamsArray = [];
          // Ensure all are numbers
          streamsArray = streamsArray.map(s => Number(s)).filter(n => !isNaN(n));
        } catch (e) {
          streamsArray = [];
        }
      }

      const subject = await Subject.update(parseInt(id), { name, streams: streamsArray, status });

      res.json({
        success: true,
        message: 'Subject updated successfully',
        data: { subject }
      });
    } catch (error) {
      console.error('Error updating subject:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update subject'
      });
    }
  }

  /**
   * Delete subject
   * DELETE /api/admin/subjects/:id
   */
  static async deleteSubject(req, res) {
    try {
      const { id } = req.params;
      const subject = await Subject.findById(parseInt(id));

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      await Subject.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Subject deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete subject'
      });
    }
  }

  /**
   * Delete all subjects
   * DELETE /api/admin/subjects/all
   */
  static async deleteAllSubjects(req, res) {
    try {
      const deletedCount = await Subject.deleteAll();
      res.json({
        success: true,
        message: `Deleted ${deletedCount} subject(s) successfully`
      });
    } catch (error) {
      console.error('Error deleting all subjects:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete all subjects'
      });
    }
  }

  /**
   * Download bulk upload template
   * GET /api/admin/subjects/bulk-upload-template
   */
  static async downloadBulkTemplate(req, res) {
    try {
      const headers = ['name', 'streams', 'status'];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        ['Physics', 'PCM, PCB, PCMB', 'TRUE'],
        ['Chemistry', 'PCM, PCB, PCMB', 'TRUE'],
        ['Mathematics', 'PCM, PCMB', 'TRUE'],
        ['Biology', 'PCB, PCMB', 'TRUE']
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Subjects');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=subjects-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating subjects bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  /**
   * Download all subjects as Excel
   * GET /api/admin/subjects/download-excel
   */
  static async downloadAllExcel(req, res) {
    try {
      const [subjects, allStreams] = await Promise.all([
        Subject.findAll(),
        Stream.findAll()
      ]);
      const streamMap = new Map(allStreams.map((st) => [st.id, st.name]));
      const headers = ['id', 'name', 'Streams', 'status', 'created_at', 'updated_at'];
      const rows = [headers];
      for (const s of subjects) {
        const streamIds = Array.isArray(s.streams) ? s.streams : [];
        const streamNames = streamIds
          .map((id) => streamMap.get(id) ?? id)
          .filter(Boolean)
          .join(', ');
        rows.push([
          s.id,
          s.name || '',
          streamNames,
          s.status ? 'TRUE' : 'FALSE',
          s.created_at ? String(s.created_at).slice(0, 10) : '',
          s.updated_at ? String(s.updated_at).slice(0, 10) : ''
        ]);
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Subjects');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=subjects-all-data.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error exporting subjects:', error);
      res.status(500).json({ success: false, message: 'Failed to export subjects' });
    }
  }

  /**
   * Bulk upload subjects from Excel
   * POST /api/admin/subjects/bulk-upload
   */
  static async bulkUpload(req, res) {
    try {
      const excelFile = req.files?.excel?.[0] || req.file;
      if (!excelFile || !excelFile.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Use field name "excel".'
        });
      }

      let workbook;
      try {
        workbook = XLSX.read(excelFile.buffer, { type: 'buffer', raw: true });
      } catch (parseErr) {
        return res.status(400).json({ success: false, message: 'Invalid Excel file or format.' });
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (!rows.length) {
        return res.status(400).json({ success: false, message: 'Excel file has no data rows.' });
      }

      const created = [];
      const errors = [];
      const namesInFile = new Set();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const nameRaw = (row.name ?? row.Name ?? '').toString().trim();
        if (!nameRaw) {
          errors.push({ row: rowNum, message: 'name is required' });
          continue;
        }
        if (namesInFile.has(nameRaw.toLowerCase())) {
          errors.push({ row: rowNum, message: `duplicate name "${nameRaw}" in this file` });
          continue;
        }
        const existing = await Subject.findByName(nameRaw);
        if (existing) {
          errors.push({ row: rowNum, message: `subject "${nameRaw}" already exists` });
          continue;
        }

        const streamRaw = (row.streams ?? row.stream_ids ?? row.stream_Ids ?? row.stream_names ?? '').toString().trim();
        let streamIds = [];
        if (streamRaw) {
          const parts = splitList(streamRaw);
          let allStreams = null;
          for (const p of parts) {
            if (/^\d+$/.test(p)) {
              streamIds.push(parseInt(p, 10));
            } else {
              let found = await Stream.findByName(p.trim());
              if (!found) {
                allStreams = allStreams || (await Stream.findAll());
                const search = p.trim().toLowerCase();
                const matches = allStreams.filter((s) => s.name && s.name.toLowerCase().includes(search));
                found = matches.length ? matches.sort((a, b) => (a.name?.length || 0) - (b.name?.length || 0))[0] : null;
              }
              if (found) streamIds.push(found.id);
            }
          }
          streamIds = [...new Set(streamIds)];
        }
        const statusRaw = (row.status ?? '').toString().trim();
        const status = /^(1|true|yes)$/i.test(statusRaw) ? true : (statusRaw === '' ? true : false);

        try {
          const subject = await Subject.create({ name: nameRaw, streams: streamIds, status });
          created.push({ id: subject.id, name: subject.name });
          namesInFile.add(nameRaw.toLowerCase());
        } catch (createErr) {
          errors.push({ row: rowNum, message: createErr.message || 'Failed to create subject' });
        }
      }

      res.json({
        success: true,
        data: {
          created: created.length,
          createdSubjects: created,
          errors: errors.length,
          errorDetails: errors
        },
        message: `Created ${created.length} subject(s).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`
      });
    } catch (error) {
      console.error('Error in subjects bulk upload:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Bulk upload failed'
      });
    }
  }
}

module.exports = SubjectController;


