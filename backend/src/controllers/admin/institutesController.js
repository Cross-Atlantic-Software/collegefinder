const XLSX = require('xlsx');
const AdmZip = require('adm-zip');
const Institute = require('../../models/institute/Institute');
const InstituteDetails = require('../../models/institute/InstituteDetails');
const InstituteExam = require('../../models/institute/InstituteExam');
const InstituteExamSpecialization = require('../../models/institute/InstituteExamSpecialization');
const InstituteStatistics = require('../../models/institute/InstituteStatistics');
const InstituteCourse = require('../../models/institute/InstituteCourse');
const Exam = require('../../models/taxonomy/Exam');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');

async function resolveExamNamesToIds(namesStr) {
  if (!namesStr || typeof namesStr !== 'string') return [];
  const names = namesStr.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  const ids = [];
  for (const nm of names) {
    const ex = await Exam.findByName(nm);
    if (ex) ids.push(ex.id);
  }
  return ids;
}

class InstitutesController {
  static async getAllAdmin(req, res) {
    try {
      const institutes = await Institute.findAll();
      res.json({ success: true, data: { institutes } });
    } catch (error) {
      console.error('Error fetching institutes:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch institutes' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const instituteId = parseInt(id);
      const institute = await Institute.findById(instituteId);
      if (!institute) {
        return res.status(404).json({ success: false, message: 'Institute not found' });
      }
      const [details, examIds, specializationExamIds, statistics, courses] = await Promise.all([
        InstituteDetails.findByInstituteId(instituteId),
        InstituteExam.getExamIdsByInstituteId(instituteId),
        InstituteExamSpecialization.getExamIdsByInstituteId(instituteId),
        InstituteStatistics.findByInstituteId(instituteId),
        InstituteCourse.findByInstituteId(instituteId)
      ]);

      const examNames = [];
      const specExamNames = [];
      for (const eid of examIds || []) {
        const ex = await Exam.findById(eid);
        if (ex && ex.name) examNames.push(ex.name);
      }
      for (const eid of specializationExamIds || []) {
        const ex = await Exam.findById(eid);
        if (ex && ex.name) specExamNames.push(ex.name);
      }

      res.json({
        success: true,
        data: {
          institute,
          instituteDetails: details,
          examIds: examIds || [],
          examNames,
          specializationExamIds: specializationExamIds || [],
          specializationExamNames: specExamNames,
          instituteStatistics: statistics,
          instituteCourses: courses || []
        }
      });
    } catch (error) {
      console.error('Error fetching institute:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch institute' });
    }
  }

  static async uploadLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const s3Url = await uploadToS3(req.file.buffer, req.file.originalname, 'institute-logos');
      res.json({ success: true, data: { logoUrl: s3Url }, message: 'Logo uploaded successfully' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to upload logo' });
    }
  }

  static async create(req, res) {
    try {
      const {
        institute_name,
        institute_location,
        type,
        logo,
        website,
        contact_number,
        institute_description,
        demo_available,
        scholarship_available,
        examIds,
        specializationExamIds,
        ranking_score,
        success_rate,
        student_rating,
        instituteCourses
      } = req.body;

      if (!institute_name || !institute_name.trim()) {
        return res.status(400).json({ success: false, message: 'Institute name is required' });
      }

      const existing = await Institute.findByName(institute_name.trim());
      if (existing) {
        return res.status(400).json({ success: false, message: 'Institute with this name already exists' });
      }

      const institute = await Institute.create({
        institute_name: institute_name.trim(),
        institute_location: institute_location ? institute_location.trim() : null,
        type: type || null,
        logo: logo || null,
        website: website ? website.trim() : null,
        contact_number: contact_number ? contact_number.trim() : null
      });

      if (institute_description != null || demo_available != null || scholarship_available != null) {
        await InstituteDetails.create({
          institute_id: institute.id,
          institute_description: institute_description ? institute_description.trim() : null,
          demo_available: !!demo_available,
          scholarship_available: !!scholarship_available
        });
      }

      if (examIds && Array.isArray(examIds) && examIds.length > 0) {
        await InstituteExam.setExamsForInstitute(institute.id, examIds);
      }
      if (specializationExamIds && Array.isArray(specializationExamIds) && specializationExamIds.length > 0) {
        await InstituteExamSpecialization.setSpecializationsForInstitute(institute.id, specializationExamIds);
      }

      if (ranking_score != null || success_rate != null || student_rating != null) {
        await InstituteStatistics.create({
          institute_id: institute.id,
          ranking_score: ranking_score ?? null,
          success_rate: success_rate ?? null,
          student_rating: student_rating ?? null
        });
      }

      if (instituteCourses && Array.isArray(instituteCourses)) {
        for (const c of instituteCourses) {
          if (c.course_name || c.target_class || c.duration_months != null || c.fees != null || c.batch_size != null || c.start_date) {
            await InstituteCourse.create({
              institute_id: institute.id,
              course_name: c.course_name || null,
              target_class: c.target_class || null,
              duration_months: c.duration_months ?? null,
              fees: c.fees ?? null,
              batch_size: c.batch_size ?? null,
              start_date: c.start_date || null
            });
          }
        }
      }

      res.status(201).json({
        success: true,
        data: { institute },
        message: 'Institute created successfully'
      });
    } catch (error) {
      console.error('Error creating institute:', error);
      res.status(500).json({ success: false, message: 'Failed to create institute' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const instituteId = parseInt(id);
      const existing = await Institute.findById(instituteId);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Institute not found' });
      }

      const {
        institute_name,
        institute_location,
        type,
        logo,
        website,
        contact_number,
        institute_description,
        demo_available,
        scholarship_available,
        examIds,
        specializationExamIds,
        ranking_score,
        success_rate,
        student_rating,
        instituteCourses
      } = req.body;

      if (institute_name && institute_name.trim() !== existing.institute_name) {
        const dup = await Institute.findByName(institute_name.trim());
        if (dup) {
          return res.status(400).json({ success: false, message: 'Institute with this name already exists' });
        }
      }

      if (logo && logo !== existing.logo && existing.logo) {
        await deleteFromS3(existing.logo);
      }

      await Institute.update(instituteId, {
        institute_name: institute_name !== undefined ? institute_name.trim() : undefined,
        institute_location: institute_location !== undefined ? (institute_location && institute_location.trim()) || null : undefined,
        type: type !== undefined ? type || null : undefined,
        logo: logo !== undefined ? logo : undefined,
        website: website !== undefined ? (website && website.trim()) || null : undefined,
        contact_number: contact_number !== undefined ? (contact_number && contact_number.trim()) || null : undefined
      });

      if (institute_description !== undefined || demo_available !== undefined || scholarship_available !== undefined) {
        await InstituteDetails.create({
          institute_id: instituteId,
          institute_description: institute_description != null ? String(institute_description).trim() : null,
          demo_available: !!demo_available,
          scholarship_available: !!scholarship_available
        });
      }

      if (examIds !== undefined) {
        await InstituteExam.setExamsForInstitute(instituteId, Array.isArray(examIds) ? examIds : []);
      }
      if (specializationExamIds !== undefined) {
        await InstituteExamSpecialization.setSpecializationsForInstitute(instituteId, Array.isArray(specializationExamIds) ? specializationExamIds : []);
      }

      if (ranking_score !== undefined || success_rate !== undefined || student_rating !== undefined) {
        await InstituteStatistics.create({
          institute_id: instituteId,
          ranking_score: ranking_score ?? null,
          success_rate: success_rate ?? null,
          student_rating: student_rating ?? null
        });
      }

      await InstituteCourse.deleteByInstituteId(instituteId);
      if (instituteCourses && Array.isArray(instituteCourses)) {
        for (const c of instituteCourses) {
          if (c.course_name || c.target_class || c.duration_months != null || c.fees != null || c.batch_size != null || c.start_date) {
            await InstituteCourse.create({
              institute_id: instituteId,
              course_name: c.course_name || null,
              target_class: c.target_class || null,
              duration_months: c.duration_months ?? null,
              fees: c.fees ?? null,
              batch_size: c.batch_size ?? null,
              start_date: c.start_date || null
            });
          }
        }
      }

      const institute = await Institute.findById(instituteId);
      res.json({ success: true, data: { institute }, message: 'Institute updated successfully' });
    } catch (error) {
      console.error('Error updating institute:', error);
      res.status(500).json({ success: false, message: 'Failed to update institute' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const institute = await Institute.findById(parseInt(id));
      if (!institute) {
        return res.status(404).json({ success: false, message: 'Institute not found' });
      }
      if (institute.logo) {
        await deleteFromS3(institute.logo);
      }
      await Institute.delete(parseInt(id));
      res.json({ success: true, message: 'Institute deleted successfully' });
    } catch (error) {
      console.error('Error deleting institute:', error);
      res.status(500).json({ success: false, message: 'Failed to delete institute' });
    }
  }

  static async deleteAll(req, res) {
    try {
      const all = await Institute.findAll();
      for (const inst of all) {
        if (inst.logo) await deleteFromS3(inst.logo);
        await Institute.delete(inst.id);
      }
      res.json({
        success: true,
        message: `All ${all.length} institutes deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting all institutes:', error);
      res.status(500).json({ success: false, message: 'Failed to delete all institutes' });
    }
  }

  static async downloadBulkTemplate(req, res) {
    try {
      const headers = [
        'institute_name',
        'institute_location',
        'type',
        'logo_filename',
        'website',
        'contact_number',
        'institute_description',
        'demo_available',
        'scholarship_available',
        'ranking_score',
        'success_rate',
        'student_rating',
        'exam_names',
        'specialization_exam_names',
        'courses'
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        [
          'Allen Kota',
          'Kota',
          'offline',
          'allen.png',
          'https://allen.ac.in',
          '9876543210',
          'Premier coaching for JEE/NEET.',
          'TRUE',
          'TRUE',
          '9.5',
          '85',
          '4.8',
          'JEE Main,NEET',
          'JEE Advanced',
          'JEE Main|Class 12|12|50000|30|2025-01-01;NEET|Class 12|24|80000|25|2025-04-01'
        ],
        [
          'Unacademy',
          'Online',
          'online',
          'unacademy.png',
          'https://unacademy.com',
          '',
          'Online learning platform.',
          'TRUE',
          'FALSE',
          '8',
          '78',
          '4.5',
          'JEE Main,NEET,CUET',
          '',
          'Crash Course|Class 12|6|25000|100|2025-01-15'
        ]
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Institutes');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=institutes-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  /** Download all institutes data as Excel (Super Admin only). Same columns as bulk template. */
  static async downloadAllExcel(req, res) {
    try {
      const institutes = await Institute.findAll();
      const headers = [
        'institute_name', 'institute_location', 'type', 'logo_filename', 'website', 'contact_number',
        'institute_description', 'demo_available', 'scholarship_available', 'ranking_score', 'success_rate', 'student_rating',
        'exam_names', 'specialization_exam_names', 'courses'
      ];
      const rows = [headers];
      for (const inst of institutes) {
        const [details, examIds, specExamIds, statistics, courses] = await Promise.all([
          InstituteDetails.findByInstituteId(inst.id),
          InstituteExam.getExamIdsByInstituteId(inst.id),
          InstituteExamSpecialization.getExamIdsByInstituteId(inst.id),
          InstituteStatistics.findByInstituteId(inst.id),
          InstituteCourse.findByInstituteId(inst.id)
        ]);
        const detail = details || {};
        const stats = statistics || {};
        const logoFilename = (inst.logo && typeof inst.logo === 'string' && inst.logo.split('/').pop()) ? inst.logo.split('/').pop() : '';
        const coursesStr = (courses && courses.length)
          ? courses.map((co) => `${co.course_name || ''}|${co.target_class || ''}|${co.duration_months != null ? co.duration_months : ''}|${co.fees != null ? co.fees : ''}|${co.batch_size != null ? co.batch_size : ''}|${co.start_date ? String(co.start_date).slice(0, 10) : ''}`).join(';')
          : '';
        const examNames = [];
        for (const eid of examIds || []) {
          const ex = await Exam.findById(eid);
          if (ex && ex.name) examNames.push(ex.name);
        }
        const specExamNames = [];
        for (const eid of specExamIds || []) {
          const ex = await Exam.findById(eid);
          if (ex && ex.name) specExamNames.push(ex.name);
        }
        rows.push([
          inst.institute_name || '',
          inst.institute_location || '',
          inst.type || '',
          logoFilename,
          inst.website || '',
          inst.contact_number || '',
          (detail.institute_description != null ? detail.institute_description : '') || '',
          (detail.demo_available === true || detail.demo_available === 't') ? 'TRUE' : 'FALSE',
          (detail.scholarship_available === true || detail.scholarship_available === 't') ? 'TRUE' : 'FALSE',
          (stats.ranking_score != null) ? String(stats.ranking_score) : '',
          (stats.success_rate != null) ? String(stats.success_rate) : '',
          (stats.student_rating != null) ? String(stats.student_rating) : '',
          examNames.join(','),
          specExamNames.join(','),
          coursesStr
        ]);
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Institutes');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=institutes-all-data.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating institutes export:', error);
      res.status(500).json({ success: false, message: 'Failed to export institutes data' });
    }
  }

  static async bulkUpload(req, res) {
    const validTypes = ['offline', 'online', 'hybrid'];
    try {
      const excelFile = req.files?.excel?.[0] || req.file;
      if (!excelFile || !excelFile.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Use field name "excel".'
        });
      }

      const logoMap = new Map();
      const logosZipFile = req.files?.logos_zip?.[0];
      if (logosZipFile && logosZipFile.buffer) {
        try {
          const zip = new AdmZip(logosZipFile.buffer);
          const entries = zip.getEntries();
          const imageExt = /\.(jpe?g|png|gif|webp|bmp)$/i;
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.isDirectory) continue;
            const name = (entry.entryName || entry.name || '').replace(/^.*[\\/]/, '').trim();
            if (!name || !imageExt.test(name)) continue;
            const buffer = entry.getData();
            if (buffer && buffer.length) logoMap.set(name.toLowerCase(), { buffer, originalname: name });
          }
        } catch (zipErr) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or corrupted ZIP file for logos.'
          });
        }
      } else {
        const logosRaw = req.files?.logos;
        const logoFiles = Array.isArray(logosRaw) ? logosRaw : (logosRaw ? [logosRaw] : []);
        logoFiles.forEach((f) => {
          if (f && (f.buffer || f.path)) {
            const name = (f.originalname || f.name || '').trim();
            if (name) logoMap.set(name.toLowerCase(), f);
          }
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
        const name = (row.institute_name ?? row.institute_Name ?? '').toString().trim();
        if (!name) {
          errors.push({ row: rowNum, message: 'institute_name is required' });
          continue;
        }
        if (namesInFile.has(name.toLowerCase())) {
          errors.push({ row: rowNum, message: `duplicate name "${name}" in this file` });
          continue;
        }
        const existing = await Institute.findByName(name);
        if (existing) {
          errors.push({ row: rowNum, message: `institute "${name}" already exists` });
          continue;
        }

        const location = (row.institute_location ?? row.institute_Location ?? '').toString().trim() || null;
        const typeRaw = (row.type ?? '').toString().trim().toLowerCase();
        const instituteType = validTypes.includes(typeRaw) ? typeRaw : null;
        const logoFilename = (row.logo_filename ?? row.logo_Filename ?? '').toString().trim();
        const website = (row.website ?? '').toString().trim() || null;
        const contactNumber = (row.contact_number ?? row.contact_Number ?? '').toString().trim() || null;
        const description = (row.institute_description ?? row.institute_Description ?? '').toString().trim() || null;
        const demoAvailable = /^(1|true|yes)$/i.test((row.demo_available ?? '').toString().trim());
        const scholarshipAvailable = /^(1|true|yes)$/i.test((row.scholarship_available ?? '').toString().trim());
        const rankingScoreRaw = (row.ranking_score ?? row.ranking_Score ?? '').toString().trim();
        const successRateRaw = (row.success_rate ?? row.success_Rate ?? '').toString().trim();
        const studentRatingRaw = (row.student_rating ?? row.student_Rating ?? '').toString().trim();
        const examNamesRaw = (row.exam_names ?? row.exam_Names ?? '').toString().trim();
        const examIdsRaw = (row.exam_ids ?? row.exam_Ids ?? '').toString().trim();
        const specializationExamNamesRaw = (row.specialization_exam_names ?? row.specialization_exam_Names ?? '').toString().trim();
        const specializationExamIdsRaw = (row.specialization_exam_ids ?? row.specialization_exam_Ids ?? '').toString().trim();
        const coursesRaw = (row.courses ?? '').toString().trim();

        let logoUrl = null;
        if (logoFilename) {
          const logoFile = logoMap.get(logoFilename.toLowerCase());
          if (logoFile && logoFile.buffer) {
            try {
              logoUrl = await uploadToS3(logoFile.buffer, logoFile.originalname || logoFilename, 'institute-logos');
            } catch (uploadErr) {
              errors.push({ row: rowNum, message: `logo upload failed for "${logoFilename}": ${uploadErr.message}` });
            }
          } else {
            errors.push({ row: rowNum, message: `logo file not found: "${logoFilename}"` });
          }
        }

        try {
          const institute = await Institute.create({
            institute_name: name,
            institute_location: location,
            type: instituteType,
            logo: logoUrl,
            website,
            contact_number: contactNumber
          });
          if (description || demoAvailable || scholarshipAvailable) {
            await InstituteDetails.create({
              institute_id: institute.id,
              institute_description: description,
              demo_available: demoAvailable,
              scholarship_available: scholarshipAvailable
            });
          }
          const ranking_score = rankingScoreRaw ? parseFloat(rankingScoreRaw) : null;
          const success_rate = successRateRaw ? parseFloat(successRateRaw) : null;
          const student_rating = studentRatingRaw ? parseFloat(studentRatingRaw) : null;
          if (ranking_score != null || success_rate != null || student_rating != null) {
            await InstituteStatistics.create({
              institute_id: institute.id,
              ranking_score: isNaN(ranking_score) ? null : ranking_score,
              success_rate: isNaN(success_rate) ? null : success_rate,
              student_rating: isNaN(student_rating) ? null : student_rating
            });
          }
          let examIds = [];
          if (examNamesRaw) {
            examIds = await resolveExamNamesToIds(examNamesRaw);
          }
          if (examIds.length === 0 && examIdsRaw) {
            examIds = examIdsRaw.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
          }
          if (examIds.length) await InstituteExam.setExamsForInstitute(institute.id, examIds);

          let specExamIds = [];
          if (specializationExamNamesRaw) {
            specExamIds = await resolveExamNamesToIds(specializationExamNamesRaw);
          }
          if (specExamIds.length === 0 && specializationExamIdsRaw) {
            specExamIds = specializationExamIdsRaw.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
          }
          if (specExamIds.length) await InstituteExamSpecialization.setSpecializationsForInstitute(institute.id, specExamIds);
          if (coursesRaw) {
            const courseRows = coursesRaw.split(';').map((s) => s.trim()).filter(Boolean);
            for (const cr of courseRows) {
              const [course_name, target_class, duration_months, fees, batch_size, start_date] = cr.split('|').map((s) => s.trim());
              const dur = duration_months ? parseInt(duration_months, 10) : null;
              const feeVal = fees ? parseFloat(fees) : null;
              const batch = batch_size ? parseInt(batch_size, 10) : null;
              await InstituteCourse.create({
                institute_id: institute.id,
                course_name: course_name || null,
                target_class: target_class || null,
                duration_months: isNaN(dur) ? null : dur,
                fees: isNaN(feeVal) ? null : feeVal,
                batch_size: isNaN(batch) ? null : batch,
                start_date: start_date || null
              });
            }
          }
          created.push({ id: institute.id, name: institute.institute_name });
          namesInFile.add(name.toLowerCase());
        } catch (createErr) {
          errors.push({ row: rowNum, message: createErr.message || 'Failed to create institute' });
        }
      }

      res.json({
        success: true,
        data: {
          created: created.length,
          createdInstitutes: created,
          errors: errors.length,
          errorDetails: errors
        },
        message: `Created ${created.length} institute(s).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`
      });
    } catch (error) {
      console.error('Error in bulk upload:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Bulk upload failed'
      });
    }
  }
}

module.exports = InstitutesController;
