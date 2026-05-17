const XLSX = require('xlsx');
const Branch = require('../../models/taxonomy/Branch');
const { validationResult } = require('express-validator');

class BranchController {
  static async getAll(req, res) {
    try {
      const branches = await Branch.findAll();
      res.json({ success: true, data: { branches } });
    } catch (error) {
      console.error('Error fetching branches:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch branches' });
    }
  }

  static async getById(req, res) {
    try {
      const branch = await Branch.findById(parseInt(req.params.id));
      if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
      res.json({ success: true, data: { branch } });
    } catch (error) {
      console.error('Error fetching branch:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch branch' });
    }
  }

  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

      const { name, description, status } = req.body;
      const existing = await Branch.findByName(name);
      if (existing) return res.status(400).json({ success: false, message: 'Branch with this name already exists' });

      const branch = await Branch.create({ name, description: description || null, status: status !== undefined ? status : true });
      res.status(201).json({ success: true, message: 'Branch created successfully', data: { branch } });
    } catch (error) {
      console.error('Error creating branch:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create branch' });
    }
  }

  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

      const id = parseInt(req.params.id);
      const existing = await Branch.findById(id);
      if (!existing) return res.status(404).json({ success: false, message: 'Branch not found' });

      const { name, description, status } = req.body;
      if (name && name !== existing.name) {
        const nameExists = await Branch.findByName(name);
        if (nameExists) return res.status(400).json({ success: false, message: 'Branch with this name already exists' });
      }

      const branch = await Branch.update(id, { name, description, status });
      res.json({ success: true, message: 'Branch updated successfully', data: { branch } });
    } catch (error) {
      console.error('Error updating branch:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update branch' });
    }
  }

  static async delete(req, res) {
    try {
      const id = parseInt(req.params.id);
      const branch = await Branch.findById(id);
      if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
      await Branch.delete(id);
      res.json({ success: true, message: 'Branch deleted successfully' });
    } catch (error) {
      console.error('Error deleting branch:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete branch' });
    }
  }

  static async downloadBulkTemplate(req, res) {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['name', 'description', 'status'],
        ['Computer Science', 'CS & IT related programs', 'TRUE'],
        ['Electronics & Communication', 'ECE branch', 'TRUE'],
        ['Mechanical Engineering', 'ME branch', 'TRUE'],
        ['Civil Engineering', 'CE branch', 'TRUE']
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Branches');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=branches-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating branches bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  static async downloadAllExcel(req, res) {
    try {
      const branches = await Branch.findAll();
      const rows = [['id', 'name', 'description', 'status', 'created_at', 'updated_at']];
      for (const b of branches) {
        rows.push([b.id, b.name || '', b.description || '', b.status ? 'TRUE' : 'FALSE', b.created_at ? String(b.created_at).slice(0, 10) : '', b.updated_at ? String(b.updated_at).slice(0, 10) : '']);
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Branches');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=branches-all-data.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error exporting branches:', error);
      res.status(500).json({ success: false, message: 'Failed to export branches' });
    }
  }

  static async bulkUpload(req, res) {
    try {
      const excelFile = req.files?.excel?.[0] || req.file;
      if (!excelFile || !excelFile.buffer) return res.status(400).json({ success: false, message: 'No Excel file uploaded. Use field name "excel".' });

      let workbook;
      try { workbook = XLSX.read(excelFile.buffer, { type: 'buffer', raw: true }); }
      catch (_) { return res.status(400).json({ success: false, message: 'Invalid Excel file or format.' }); }

      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '', raw: false });
      if (!rows.length) return res.status(400).json({ success: false, message: 'Excel file has no data rows.' });

      const created = [];
      const errors = [];
      const namesInFile = new Set();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const nameRaw = (row.name ?? row.Name ?? '').toString().trim();
        if (!nameRaw) { errors.push({ row: rowNum, message: 'name is required' }); continue; }
        if (namesInFile.has(nameRaw.toLowerCase())) { errors.push({ row: rowNum, message: `duplicate name "${nameRaw}" in this file` }); continue; }
        const existing = await Branch.findByNameCaseInsensitive(nameRaw);
        if (existing) { errors.push({ row: rowNum, message: `branch "${nameRaw}" already exists` }); continue; }

        const description = (row.description ?? row.Description ?? '').toString().trim() || null;
        const statusRaw = (row.status ?? '').toString().trim();
        const status = /^(1|true|yes)$/i.test(statusRaw) ? true : (statusRaw === '' ? true : false);

        try {
          const branch = await Branch.create({ name: nameRaw, description, status });
          created.push({ id: branch.id, name: branch.name });
          namesInFile.add(nameRaw.toLowerCase());
        } catch (createErr) {
          errors.push({ row: rowNum, message: createErr.message || 'Failed to create branch' });
        }
      }

      res.json({
        success: true,
        data: { created: created.length, createdBranches: created, errors: errors.length, errorDetails: errors },
        message: `Created ${created.length} branch(es).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`
      });
    } catch (error) {
      console.error('Error in branches bulk upload:', error);
      res.status(500).json({ success: false, message: error.message || 'Bulk upload failed' });
    }
  }
}

module.exports = BranchController;
