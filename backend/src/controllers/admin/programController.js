const XLSX = require('xlsx');
const Program = require('../../models/taxonomy/Program');
const Stream = require('../../models/taxonomy/Stream');
const CareerGoal = require('../../models/taxonomy/CareerGoal');
const { validationResult } = require('express-validator');

function splitNameListCell(val) {
  if (val == null) return [];
  const s = String(val).trim();
  if (!s) return [];
  return s.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
}

function normalizeInterestIdsInput(raw) {
  if (raw == null) return [];
  let arr = raw;
  if (typeof arr === 'string') {
    try {
      arr = JSON.parse(arr);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map((x) => parseInt(String(x), 10)).filter((n) => Number.isInteger(n) && n > 0))];
}

async function assertInterestIdsValid(ids) {
  for (const iid of ids) {
    const cg = await CareerGoal.findById(iid);
    if (!cg) return `Invalid interest id: ${iid}`;
  }
  return null;
}

class ProgramController {
  /**
   * Get all programs
   * GET /api/admin/programs
   */
  static async getAllPrograms(req, res) {
    try {
      const programs = await Program.findAll();
      res.json({
        success: true,
        data: { programs }
      });
    } catch (error) {
      console.error('Error fetching programs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch programs'
      });
    }
  }

  /**
   * Get program by ID
   * GET /api/admin/programs/:id
   */
  static async getProgramById(req, res) {
    try {
      const { id } = req.params;
      const program = await Program.findById(parseInt(id));

      if (!program) {
        return res.status(404).json({
          success: false,
          message: 'Program not found'
        });
      }

      res.json({
        success: true,
        data: { program }
      });
    } catch (error) {
      console.error('Error fetching program:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch program'
      });
    }
  }

  /**
   * Create new program
   * POST /api/admin/programs
   */
  static async createProgram(req, res) {
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
      const existing = await Program.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Program with this name already exists'
        });
      }

      let stream_id = null;
      if (req.body.stream_id != null && String(req.body.stream_id).trim() !== '') {
        const n = parseInt(req.body.stream_id, 10);
        if (!Number.isInteger(n) || n < 1) {
          return res.status(400).json({ success: false, message: 'Invalid stream_id' });
        }
        const st = await Stream.findById(n);
        if (!st) return res.status(400).json({ success: false, message: 'Stream not found' });
        stream_id = n;
      }

      const interest_ids = normalizeInterestIdsInput(req.body.interest_ids);
      const interestErr = await assertInterestIdsValid(interest_ids);
      if (interestErr) {
        return res.status(400).json({ success: false, message: interestErr });
      }

      const program = await Program.create({
        name,
        status: status !== undefined ? status : true,
        stream_id,
        interest_ids
      });

      res.status(201).json({
        success: true,
        message: 'Program created successfully',
        data: { program }
      });
    } catch (error) {
      console.error('Error creating program:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create program'
      });
    }
  }

  /**
   * Update program
   * PUT /api/admin/programs/:id
   */
  static async updateProgram(req, res) {
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
      const { name, status } = req.body;

      const existing = await Program.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Program not found'
        });
      }

      // Check if name already exists (excluding current program)
      if (name && name !== existing.name) {
        const nameExists = await Program.findByName(name);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Program with this name already exists'
          });
        }
      }

      const patch = { name, status };
      if (Object.prototype.hasOwnProperty.call(req.body, 'stream_id')) {
        const v = req.body.stream_id;
        if (v === null || v === undefined || String(v).trim() === '') {
          patch.stream_id = null;
        } else {
          const n = parseInt(v, 10);
          if (!Number.isInteger(n) || n < 1) {
            return res.status(400).json({ success: false, message: 'Invalid stream_id' });
          }
          const st = await Stream.findById(n);
          if (!st) return res.status(400).json({ success: false, message: 'Stream not found' });
          patch.stream_id = n;
        }
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'interest_ids')) {
        const interest_ids = normalizeInterestIdsInput(req.body.interest_ids);
        const interestErr = await assertInterestIdsValid(interest_ids);
        if (interestErr) {
          return res.status(400).json({ success: false, message: interestErr });
        }
        patch.interest_ids = interest_ids;
      }

      const program = await Program.update(parseInt(id), patch);

      res.json({
        success: true,
        message: 'Program updated successfully',
        data: { program }
      });
    } catch (error) {
      console.error('Error updating program:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update program'
      });
    }
  }

  /**
   * Delete program
   * DELETE /api/admin/programs/:id
   */
  static async deleteProgram(req, res) {
    try {
      const { id } = req.params;
      const program = await Program.findById(parseInt(id));

      if (!program) {
        return res.status(404).json({
          success: false,
          message: 'Program not found'
        });
      }

      await Program.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Program deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting program:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete program'
      });
    }
  }

  /**
   * Download bulk upload template
   * GET /api/admin/programs/bulk-upload-template
   */
  static async downloadBulkTemplate(req, res) {
    try {
      const headers = ['name', 'status', 'stream', 'interests'];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        ['B.Tech', 'TRUE', 'PCM', 'Engineering; Technology'],
        ['B.E.', 'TRUE', 'PCM', ''],
        ['MBBS', 'TRUE', 'PCB', 'Medicine'],
        ['BDS', 'TRUE', 'PCB', '']
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Programs');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=programs-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating programs bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  /**
   * Download all programs as Excel
   * GET /api/admin/programs/download-excel
   */
  static async downloadAllExcel(req, res) {
    try {
      const programs = await Program.findAll();
      const headers = ['id', 'name', 'status', 'stream', 'interests', 'created_at', 'updated_at'];
      const rows = [headers];
      for (const p of programs) {
        const streamName = p.stream_name || '';
        const interestsCell = p.interest_labels || '';
        rows.push([
          p.id,
          p.name || '',
          p.status ? 'TRUE' : 'FALSE',
          streamName,
          interestsCell,
          p.created_at ? String(p.created_at).slice(0, 10) : '',
          p.updated_at ? String(p.updated_at).slice(0, 10) : ''
        ]);
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Programs');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=programs-all-data.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error exporting programs:', error);
      res.status(500).json({ success: false, message: 'Failed to export programs' });
    }
  }

  /**
   * Bulk upload programs from Excel
   * POST /api/admin/programs/bulk-upload
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
        const existing = await Program.findByNameCaseInsensitive(nameRaw);
        if (existing) {
          errors.push({ row: rowNum, message: `program "${nameRaw}" already exists` });
          continue;
        }

        const statusRaw = (row.status ?? '').toString().trim();
        const status = /^(1|true|yes)$/i.test(statusRaw) ? true : (statusRaw === '' ? true : false);

        const streamName = (row.stream ?? row.Stream ?? '').toString().trim();
        let stream_id = null;
        if (streamName) {
          const st = await Stream.findByName(streamName);
          if (!st) {
            errors.push({ row: rowNum, message: `Unknown stream name: "${streamName}"` });
            continue;
          }
          stream_id = st.id;
        }

        const interestParts = splitNameListCell(row.interests ?? row.Interests ?? '');
        const interest_ids = [];
        let interestsOk = true;
        for (const label of interestParts) {
          const cg = await CareerGoal.findByLabel(label);
          if (!cg) {
            errors.push({ row: rowNum, message: `Unknown interest name: "${label}"` });
            interestsOk = false;
            break;
          }
          if (!interest_ids.includes(cg.id)) interest_ids.push(cg.id);
        }
        if (!interestsOk) continue;

        try {
          const program = await Program.create({ name: nameRaw, status, stream_id, interest_ids });
          created.push({ id: program.id, name: program.name });
          namesInFile.add(nameRaw.toLowerCase());
        } catch (createErr) {
          errors.push({ row: rowNum, message: createErr.message || 'Failed to create program' });
        }
      }

      res.json({
        success: true,
        data: {
          created: created.length,
          createdPrograms: created,
          errors: errors.length,
          errorDetails: errors
        },
        message: `Created ${created.length} program(s).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`
      });
    } catch (error) {
      console.error('Error in programs bulk upload:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Bulk upload failed'
      });
    }
  }
}

module.exports = ProgramController;

