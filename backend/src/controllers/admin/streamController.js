const Stream = require('../../models/taxonomy/Stream');
const { validationResult } = require('express-validator');
const XLSX = require('xlsx');

class StreamController {
  /**
   * Get all streams
   * GET /api/admin/streams
   */
  static async getAllStreams(req, res) {
    try {
      const streams = await Stream.findAll();
      res.json({
        success: true,
        data: { streams }
      });
    } catch (error) {
      console.error('Error fetching streams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch streams'
      });
    }
  }

  /**
   * Get stream by ID
   * GET /api/admin/streams/:id
   */
  static async getStreamById(req, res) {
    try {
      const { id } = req.params;
      const stream = await Stream.findById(parseInt(id));

      if (!stream) {
        return res.status(404).json({
          success: false,
          message: 'Stream not found'
        });
      }

      res.json({
        success: true,
        data: { stream }
      });
    } catch (error) {
      console.error('Error fetching stream:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stream'
      });
    }
  }

  /**
   * Create new stream
   * POST /api/admin/streams
   */
  static async createStream(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, status } = req.body;

      // Check if name already exists
      const existing = await Stream.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Stream with this name already exists'
        });
      }

      const stream = await Stream.create({ 
        name, 
        status: status !== undefined ? status : true,
        updated_by: req.admin?.id || null
      });

      res.status(201).json({
        success: true,
        message: 'Stream created successfully',
        data: { stream }
      });
    } catch (error) {
      console.error('Error creating stream:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create stream'
      });
    }
  }

  /**
   * Update stream
   * PUT /api/admin/streams/:id
   */
  static async updateStream(req, res) {
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
      const existingStream = await Stream.findById(parseInt(id));

      if (!existingStream) {
        return res.status(404).json({
          success: false,
          message: 'Stream not found'
        });
      }

      const { name, status } = req.body;

      // Check if name is being changed and if it already exists
      if (name && name !== existingStream.name) {
        const nameExists = await Stream.findByName(name);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Stream with this name already exists'
          });
        }
      }

      const stream = await Stream.update(parseInt(id), { 
        name, 
        status, 
        updated_by: req.admin?.id || null 
      });

      res.json({
        success: true,
        message: 'Stream updated successfully',
        data: { stream }
      });
    } catch (error) {
      console.error('Error updating stream:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update stream'
      });
    }
  }

  /**
   * Delete stream
   * DELETE /api/admin/streams/:id
   */
  static async deleteStream(req, res) {
    try {
      const { id } = req.params;
      const stream = await Stream.findById(parseInt(id));

      if (!stream) {
        return res.status(404).json({
          success: false,
          message: 'Stream not found'
        });
      }

      await Stream.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Stream deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting stream:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete stream'
      });
    }
  }

  /**
   * Delete all streams
   * DELETE /api/admin/streams/all
   */
  static async deleteAllStreams(req, res) {
    try {
      const deletedCount = await Stream.deleteAll();
      res.json({
        success: true,
        message: `Deleted ${deletedCount} stream(s) successfully`
      });
    } catch (error) {
      console.error('Error deleting all streams:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete all streams'
      });
    }
  }

  /**
   * Download bulk upload template
   * GET /api/admin/streams/bulk-upload-template
   */
  static async downloadBulkTemplate(req, res) {
    try {
      const headers = ['name', 'status'];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        ['Science', 'TRUE'],
        ['Commerce', 'TRUE'],
        ['Arts', 'TRUE']
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Streams');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=streams-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating streams bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  /**
   * Bulk upload streams from Excel
   * POST /api/admin/streams/bulk-upload
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
      } catch {
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
        const existing = await Stream.findByName(nameRaw);
        if (existing) {
          errors.push({ row: rowNum, message: `stream "${nameRaw}" already exists` });
          continue;
        }

        const statusRaw = (row.status ?? '').toString().trim();
        const status = /^(1|true|yes)$/i.test(statusRaw) ? true : (statusRaw === '' ? true : false);

        try {
          const stream = await Stream.create({
            name: nameRaw,
            status,
            updated_by: req.admin?.id || null
          });
          created.push({ id: stream.id, name: stream.name });
          namesInFile.add(nameRaw.toLowerCase());
        } catch (createErr) {
          errors.push({ row: rowNum, message: createErr.message || 'Failed to create stream' });
        }
      }

      res.json({
        success: true,
        data: {
          created: created.length,
          createdStreams: created,
          errors: errors.length,
          errorDetails: errors
        },
        message: `Created ${created.length} stream(s).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`
      });
    } catch (error) {
      console.error('Error in streams bulk upload:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Bulk upload failed'
      });
    }
  }
}

module.exports = StreamController;


