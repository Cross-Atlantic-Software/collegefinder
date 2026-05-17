const XLSX = require('xlsx');
const AdmissionExpert = require('../../models/admission/AdmissionExpert');
const { parseLogosFromZip } = require('../../utils/logoUploadUtils');

const VALID_TYPES = ['career_consultant', 'essay_resume', 'travel_visa', 'accommodation', 'loans_finance'];

class ExpertController {
  /**
   * GET /api/admin/experts
   */
  static async getAll(req, res) {
    try {
      const experts = await AdmissionExpert.findAll();
      res.json({
        success: true,
        data: { experts, total: experts.length }
      });
    } catch (error) {
      console.error('Error fetching experts:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch experts' });
    }
  }

  /**
   * POST /api/admin/experts
   */
  static async create(req, res) {
    try {
      const { name, contact, phone, email, description, type } = req.body;

      if (!name || !type) {
        return res.status(400).json({ success: false, message: 'Name and type are required' });
      }

      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid expert type' });
      }

      let photoUrl = null;
      if (req.file) {
        const base64 = req.file.buffer.toString('base64');
        photoUrl = `data:${req.file.mimetype};base64,${base64}`;
      }

      const expert = await AdmissionExpert.create({
        name,
        photo_url: photoUrl,
        contact: contact || null,
        phone: phone || null,
        email: email || null,
        description: description || null,
        type,
        created_by: req.admin.id
      });

      res.status(201).json({
        success: true,
        message: 'Expert created successfully',
        data: { expert }
      });
    } catch (error) {
      console.error('Error creating expert:', error?.message || error);
      res.status(500).json({
        success: false,
        message: error?.message?.includes('value too long') ? 'Photo file is too large; try a smaller image.' : 'Failed to create expert'
      });
    }
  }

  /**
   * PUT /api/admin/experts/:id
   */
  static async update(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await AdmissionExpert.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Expert not found' });
      }

      const updateData = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.contact !== undefined) updateData.contact = req.body.contact;
      if (req.body.phone !== undefined) updateData.phone = req.body.phone;
      if (req.body.email !== undefined) updateData.email = req.body.email;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.type !== undefined) updateData.type = req.body.type;
      if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active === 'true' || req.body.is_active === true;

      if (req.file) {
        const base64 = req.file.buffer.toString('base64');
        updateData.photo_url = `data:${req.file.mimetype};base64,${base64}`;
      }

      const expert = await AdmissionExpert.update(id, updateData);
      res.json({
        success: true,
        message: 'Expert updated successfully',
        data: { expert }
      });
    } catch (error) {
      console.error('Error updating expert:', error);
      res.status(500).json({ success: false, message: 'Failed to update expert' });
    }
  }

  /**
   * DELETE /api/admin/experts/:id
   */
  static async delete(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const expert = await AdmissionExpert.delete(id);
      if (!expert) {
        return res.status(404).json({ success: false, message: 'Expert not found' });
      }
      res.json({
        success: true,
        message: 'Expert deleted successfully',
        data: { expert }
      });
    } catch (error) {
      console.error('Error deleting expert:', error);
      res.status(500).json({ success: false, message: 'Failed to delete expert' });
    }
  }

  /**
   * GET /api/admin/experts/bulk-upload-template
   */
  static async downloadBulkTemplate(req, res) {
    try {
      const headers = ['name', 'phone', 'email', 'description', 'type', 'photo_file_name'];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        ['John Doe', '+91 9876543210', 'john@example.com', 'Career coach with 10+ years experience', 'career_consultant', 'john_doe.jpg']
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Experts');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=experts-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating experts bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  /**
   * GET /api/admin/experts/download-excel
   */
  static async downloadAllExcel(req, res) {
    try {
      const experts = await AdmissionExpert.findAll();
      const headers = ['id', 'name', 'phone', 'email', 'description', 'type', 'is_active', 'created_at'];
      const rows = [headers];
      for (const e of experts) {
        rows.push([
          e.id || '',
          e.name || '',
          e.phone || '',
          e.email || '',
          (e.description || '').replace(/\r?\n/g, ' '),
          e.type || '',
          e.is_active !== false ? 'TRUE' : 'FALSE',
          e.created_at ? String(e.created_at).slice(0, 10) : ''
        ]);
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Experts');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=experts-all-data.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error exporting experts:', error);
      res.status(500).json({ success: false, message: 'Failed to export experts' });
    }
  }

  /**
   * POST /api/admin/experts/bulk-upload
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

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const nameRaw = (row.name ?? row.Name ?? '').toString().trim();
        if (!nameRaw) {
          errors.push({ row: rowNum, message: 'name is required' });
          continue;
        }
        const typeRaw = (row.type ?? row.Type ?? '').toString().trim().toLowerCase();
        if (!VALID_TYPES.includes(typeRaw)) {
          errors.push({ row: rowNum, message: `type must be one of: ${VALID_TYPES.join(', ')}` });
          continue;
        }
        const phone = (row.phone ?? row.Phone ?? '').toString().trim() || null;
        const email = (row.email ?? row.Email ?? '').toString().trim() || null;
        const description = (row.description ?? row.Description ?? '').toString().trim() || null;
        const photoFileName = (row.photo_file_name ?? row.Photo_file_name ?? '').toString().trim() || null;

        try {
          const expert = await AdmissionExpert.create({
            name: nameRaw,
            photo_url: null,
            contact: null,
            phone,
            email,
            description,
            type: typeRaw,
            created_by: req.admin.id,
            photo_file_name: photoFileName || null
          });
          created.push({ id: expert.id, name: expert.name });
        } catch (createErr) {
          errors.push({ row: rowNum, message: createErr.message || 'Failed to create expert' });
        }
      }

      let photosAdded = 0;
      const photosZip = req.files?.photos_zip?.[0];
      if (photosZip && photosZip.buffer) {
        const logoMap = parseLogosFromZip(photosZip.buffer);
        for (const [, file] of logoMap) {
          const experts = await AdmissionExpert.findByPhotoFileName(file.originalname);
          if (experts.length === 0) continue;
          const base64 = file.buffer.toString('base64');
          const buf = file.buffer;
          const mime = buf[0] === 0xff && buf[1] === 0xd8 ? 'image/jpeg' : (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e ? 'image/png' : 'image/jpeg');
          const photoUrl = `data:${mime};base64,${base64}`;
          for (const ex of experts) {
            await AdmissionExpert.update(ex.id, { photo_url: photoUrl });
            photosAdded++;
          }
        }
      }

      let message = `Created ${created.length} expert(s).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`;
      if (photosAdded > 0) message += ` ${photosAdded} photo(s) attached.`;

      res.json({
        success: true,
        data: {
          created: created.length,
          createdExperts: created,
          errors: errors.length,
          errorDetails: errors,
          photosAdded: photosAdded || undefined
        },
        message
      });
    } catch (error) {
      console.error('Error in experts bulk upload:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Bulk upload failed'
      });
    }
  }

  /**
   * POST /api/admin/experts/upload-expert-photos
   * Upload a ZIP of expert photos; filenames must match photo_file_name on experts.
   */
  static async uploadExpertPhotos(req, res) {
    try {
      const zipFile = req.files?.photos_zip?.[0] || req.file;
      if (!zipFile || !zipFile.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No ZIP file uploaded. Use field name "photos_zip".'
        });
      }

      const logoMap = parseLogosFromZip(zipFile.buffer);
      if (logoMap.size === 0) {
        return res.status(400).json({
          success: false,
          message: 'ZIP contains no image files. Add .jpg, .png (etc.) named to match photo_file_name in your data.'
        });
      }

      const updated = [];
      const skipped = [];
      const errors = [];

      for (const [, file] of logoMap) {
        const experts = await AdmissionExpert.findByPhotoFileName(file.originalname);
        if (!experts || experts.length === 0) {
          skipped.push(file.originalname);
          continue;
        }
        try {
          const base64 = file.buffer.toString('base64');
          const buf = file.buffer;
          const mime = buf[0] === 0xff && buf[1] === 0xd8 ? 'image/jpeg' : (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e ? 'image/png' : 'image/jpeg');
          const photoUrl = `data:${mime};base64,${base64}`;
          for (const ex of experts) {
            await AdmissionExpert.update(ex.id, { photo_url: photoUrl });
            updated.push({ id: ex.id, name: ex.name, photo_file_name: file.originalname });
          }
        } catch (err) {
          errors.push({ file: file.originalname, message: err.message || 'Update failed' });
        }
      }

      res.json({
        success: true,
        message: `Attached ${updated.length} photo(s); ${skipped.length} file(s) skipped (no matching photo_file_name).`,
        data: {
          summary: { photosAdded: updated.length, filesSkipped: skipped.length, uploadErrors: errors.length },
          updated,
          skipped,
          errors
        }
      });
    } catch (error) {
      console.error('Error uploading expert photos:', error);
      res.status(500).json({ success: false, message: 'Failed to upload expert photos' });
    }
  }

  /**
   * GET /api/experts (public)
   * Returns all active experts grouped by type
   */
  static async getPublic(req, res) {
    try {
      const grouped = await AdmissionExpert.findAllActiveGrouped();
      res.json({
        success: true,
        data: { experts: grouped }
      });
    } catch (error) {
      console.error('Error fetching public experts:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch experts' });
    }
  }
}

module.exports = ExpertController;
