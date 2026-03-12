const XLSX = require('xlsx');
const Career = require('../../models/taxonomy/Career');
const CareerProgram = require('../../models/taxonomy/CareerProgram');
const Program = require('../../models/taxonomy/Program');
const { validationResult } = require('express-validator');

const { splitList } = require('../../utils/bulkUploadUtils');

async function resolveProgramNamesToIds(namesStr) {
  if (!namesStr || typeof namesStr !== 'string') return [];
  const names = splitList(namesStr);
  const ids = [];
  for (const nm of names) {
    const prog = await Program.findByNameCaseInsensitive(nm);
    if (prog) ids.push(prog.id);
  }
  return ids;
}

class CareerController {
  /**
   * Get all careers
   * GET /api/admin/careers
   */
  static async getAllCareers(req, res) {
    try {
      const careers = await Career.findAll();
      const careersWithPrograms = await Promise.all(
        careers.map(async (c) => {
          const programIds = await CareerProgram.getProgramIdsByCareerId(c.id);
          return { ...c, program_ids: programIds };
        })
      );
      res.json({
        success: true,
        data: { careers: careersWithPrograms }
      });
    } catch (error) {
      console.error('Error fetching careers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch careers'
      });
    }
  }

  /**
   * Get career by ID
   * GET /api/admin/careers/:id
   */
  static async getCareerById(req, res) {
    try {
      const { id } = req.params;
      const career = await Career.findById(parseInt(id));

      if (!career) {
        return res.status(404).json({
          success: false,
          message: 'Career not found'
        });
      }

      const programIds = await CareerProgram.getProgramIdsByCareerId(career.id);
      res.json({
        success: true,
        data: { career: { ...career, program_ids: programIds } }
      });
    } catch (error) {
      console.error('Error fetching career:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch career'
      });
    }
  }

  /**
   * Create new career
   * POST /api/admin/careers
   */
  static async createCareer(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, status, program_ids } = req.body;

      // Check if name already exists
      const existing = await Career.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Career with this name already exists'
        });
      }

      const career = await Career.create({
        name,
        status: status !== undefined ? status : true
      });

      const programIds = Array.isArray(program_ids) ? program_ids.filter((id) => Number.isInteger(Number(id)) && Number(id) > 0) : [];
      if (programIds.length) {
        await CareerProgram.setProgramsForCareer(career.id, programIds.map((id) => parseInt(id, 10)));
      }

      const programIdsSaved = await CareerProgram.getProgramIdsByCareerId(career.id);
      const careerWithPrograms = { ...career, program_ids: programIdsSaved };

      res.status(201).json({
        success: true,
        message: 'Career created successfully',
        data: { career: careerWithPrograms }
      });
    } catch (error) {
      console.error('Error creating career:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create career'
      });
    }
  }

  /**
   * Update career
   * PUT /api/admin/careers/:id
   */
  static async updateCareer(req, res) {
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
      const existingCareer = await Career.findById(parseInt(id));

      if (!existingCareer) {
        return res.status(404).json({
          success: false,
          message: 'Career not found'
        });
      }

      const { name, status, program_ids } = req.body;

      // Check if name is being changed and if it already exists
      if (name && name !== existingCareer.name) {
        const nameExists = await Career.findByName(name);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Career with this name already exists'
          });
        }
      }

      const career = await Career.update(parseInt(id), { name, status });

      const programIds = Array.isArray(program_ids) ? program_ids.filter((id) => Number.isInteger(Number(id)) && Number(id) > 0) : [];
      await CareerProgram.setProgramsForCareer(parseInt(id), programIds.map((id) => parseInt(id, 10)));

      const programIdsSaved = await CareerProgram.getProgramIdsByCareerId(career.id);
      const careerWithPrograms = { ...career, program_ids: programIdsSaved };

      res.json({
        success: true,
        message: 'Career updated successfully',
        data: { career: careerWithPrograms }
      });
    } catch (error) {
      console.error('Error updating career:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update career'
      });
    }
  }

  /**
   * Delete career
   * DELETE /api/admin/careers/:id
   */
  static async deleteCareer(req, res) {
    try {
      const { id } = req.params;
      const career = await Career.findById(parseInt(id));

      if (!career) {
        return res.status(404).json({
          success: false,
          message: 'Career not found'
        });
      }

      await CareerProgram.deleteByCareerId(parseInt(id));
      await Career.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Career deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting career:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete career'
      });
    }
  }

  /**
   * Download all careers as Excel (Super Admin only)
   * GET /api/admin/careers/download-excel
   * program_names column contains comma-separated program names
   */
  static async downloadAllExcel(req, res) {
    try {
      const careers = await Career.findAll();
      const headers = ['id', 'name', 'status', 'program_names', 'created_at', 'updated_at'];
      const rows = [headers];
      for (const c of careers) {
        const programIds = await CareerProgram.getProgramIdsByCareerId(c.id);
        const programNames = [];
        for (const pid of programIds) {
          const prog = await Program.findById(pid);
          if (prog && prog.name) programNames.push(prog.name);
        }
        rows.push([
          c.id,
          c.name || '',
          c.status !== false ? 'TRUE' : 'FALSE',
          programNames.join(','),
          c.created_at ? String(c.created_at).slice(0, 19) : '',
          c.updated_at ? String(c.updated_at).slice(0, 19) : ''
        ]);
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Careers');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=careers-all-data.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating careers export:', error);
      res.status(500).json({ success: false, message: 'Failed to export careers data' });
    }
  }

  /**
   * Delete all careers (Super Admin only)
   * DELETE /api/admin/careers/all
   */
  static async deleteAll(req, res) {
    try {
      const all = await Career.findAll();
      for (const c of all) {
        await CareerProgram.deleteByCareerId(c.id);
        await Career.delete(c.id);
      }
      res.json({
        success: true,
        message: `All ${all.length} careers deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting all careers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete all careers'
      });
    }
  }

  /**
   * Download bulk upload template
   * GET /api/admin/careers/bulk-upload-template
   */
  static async downloadBulkTemplate(req, res) {
    try {
      const headers = ['name', 'status', 'program_names'];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        ['Engineering', 'TRUE', 'B.Tech, M.Tech, B.E'],
        ['Medicine', 'TRUE', 'MBBS, MD, BDS'],
        ['Law', 'FALSE', 'LLB, LLM']
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Careers');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=careers-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating careers bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  /**
   * Bulk upload careers from Excel
   * POST /api/admin/careers/bulk-upload
   * Excel columns: name, status, program_names (comma-separated)
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
        const name = (row.name ?? row.Name ?? '').toString().trim();
        if (!name) {
          errors.push({ row: rowNum, message: 'name is required' });
          continue;
        }
        if (namesInFile.has(name.toLowerCase())) {
          errors.push({ row: rowNum, message: `duplicate name "${name}" in this file` });
          continue;
        }
        const existing = await Career.findByName(name);
        if (existing) {
          errors.push({ row: rowNum, message: `career "${name}" already exists` });
          continue;
        }

        const statusRaw = (row.status ?? '').toString().trim();
        const status = /^(1|true|yes)$/i.test(statusRaw) ? true : (statusRaw === '' ? true : false);
        const programNamesRaw = (row.program_names ?? row.program_Names ?? row.programs ?? row.Programs ?? '').toString().trim();
        const programIdsRaw = (row.program_ids ?? row.program_Ids ?? '').toString().trim();

        try {
          const career = await Career.create({ name, status });
          let programIds = [];
          if (programIdsRaw) {
            programIds = programIdsRaw.split(/[,;\s]+/).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n > 0);
          }
          if (programIds.length === 0 && programNamesRaw) {
            programIds = await resolveProgramNamesToIds(programNamesRaw);
          }
          if (programIds.length) {
            await CareerProgram.setProgramsForCareer(career.id, programIds);
          }
          created.push({ id: career.id, name: career.name });
          namesInFile.add(name.toLowerCase());
        } catch (createErr) {
          errors.push({ row: rowNum, message: createErr.message || 'Failed to create career' });
        }
      }

      res.json({
        success: true,
        data: {
          created: created.length,
          createdCareers: created,
          errors: errors.length,
          errorDetails: errors
        },
        message: `Created ${created.length} career(s).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`
      });
    } catch (error) {
      console.error('Error in careers bulk upload:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Bulk upload failed'
      });
    }
  }
}

module.exports = CareerController;
