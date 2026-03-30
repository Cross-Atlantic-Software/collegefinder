const XLSX = require('xlsx');
const Institute = require('../../models/institute/Institute');
const InstituteDetails = require('../../models/institute/InstituteDetails');
const InstituteExam = require('../../models/institute/InstituteExam');
const InstituteExamSpecialization = require('../../models/institute/InstituteExamSpecialization');
const InstituteStatistics = require('../../models/institute/InstituteStatistics');
const InstituteCourse = require('../../models/institute/InstituteCourse');
const Exam = require('../../models/taxonomy/Exam');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');
const Referral = require('../../models/referral/Referral');
const EmailTemplate = require('../../models/taxonomy/EmailTemplate');
const { sendInstituteReferralInviteEmail } = require('../../../utils/email/emailService');

const MAX_INSTITUTE_REFERRAL_RECIPIENTS = 10;

/** Split stored referral_contact_email field (comma / semicolon / whitespace). */
function splitReferralContactEmails(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return [...new Set(raw.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean))];
}
const { buildLogoMapFromRequest, parseLogosFromZip, processMissingLogosFromZip } = require('../../utils/logoUploadUtils');
const { splitList, parseDate, parseBool } = require('../../utils/bulkUploadUtils');

/** Student / exam-style rating: integer 1–5 only (null if empty/invalid; values above 5 coerced to 5). */
function clampStudentRating(val) {
  if (val === undefined || val === null || val === '') return null;
  const n = typeof val === 'number' ? val : parseFloat(String(val).trim());
  if (Number.isNaN(n)) return null;
  const r = Math.round(n);
  if (r < 1) return null;
  return Math.min(5, r);
}

/** For Excel export: coerce any numeric rating into 1–5 (rounded), empty if invalid. */
function studentRatingForExport(val) {
  if (val === undefined || val === null || val === '') return '';
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  if (Number.isNaN(n)) return '';
  return String(Math.min(5, Math.max(1, Math.round(n))));
}

async function resolveExamNamesToIds(namesStr) {
  if (!namesStr || typeof namesStr !== 'string') return [];
  const names = splitList(namesStr);
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

      let referralEmailPreview = null;
      if (institute.referral_code) {
        const vars = EmailTemplate.buildInstituteReferralVariables(institute);
        const tplRow = await EmailTemplate.findReferralInstituteInviteRow();
        const tpl = tplRow || EmailTemplate.getReferralInstituteInviteDefaultTemplate();
        referralEmailPreview = {
          subject: EmailTemplate.replaceVariables(tpl.subject, vars),
          defaultRecipients: splitReferralContactEmails(institute.referral_contact_email),
        };
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
          instituteCourses: courses || [],
          referralEmailPreview,
        }
      });
    } catch (error) {
      console.error('Error fetching institute:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch institute' });
    }
  }

  /**
   * POST /api/admin/institutes/:id/send-referral-email
   * Body: { recipients?: string[] } — defaults to institute.referral_contact_email when omitted
   */
  static async sendReferralEmail(req, res) {
    try {
      const instituteId = parseInt(req.params.id, 10);
      const { recipients } = req.body;
      const institute = await Institute.findById(instituteId);
      if (!institute) {
        return res.status(404).json({ success: false, message: 'Institute not found' });
      }

      let referralCode = institute.referral_code;
      if (!referralCode) {
        referralCode = await Referral.generateAndSaveInstituteCode(instituteId, institute.institute_name);
      }
      const fresh = await Institute.findById(instituteId);

      let list =
        Array.isArray(recipients) && recipients.length > 0
          ? recipients.map((e) => String(e).trim().toLowerCase()).filter(Boolean)
          : splitReferralContactEmails(fresh.referral_contact_email);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      list = [...new Set(list.filter((e) => emailRegex.test(e)))];

      if (list.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            'No valid recipients. Save referral contact email(s) on the institute or pass recipients in the request body.',
        });
      }
      if (list.length > MAX_INSTITUTE_REFERRAL_RECIPIENTS) {
        return res.status(400).json({
          success: false,
          message: `At most ${MAX_INSTITUTE_REFERRAL_RECIPIENTS} recipients per send`,
        });
      }

      const { sent, failed } = await sendInstituteReferralInviteEmail(list, fresh);
      res.json({
        success: true,
        data: { sent, failed },
        message:
          failed.length === 0
            ? `Invite${sent.length > 1 ? 's' : ''} sent successfully`
            : `Sent to ${sent.length}, failed for ${failed.length}`,
      });
    } catch (error) {
      console.error('Error sending institute referral email:', error);
      res.status(500).json({ success: false, message: 'Failed to send referral email' });
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
        google_maps_link,
        type,
        logo,
        website,
        contact_number,
        referral_contact_email,
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
        google_maps_link: google_maps_link != null ? String(google_maps_link).trim() || null : null,
        type: type || null,
        logo: logo || null,
        website: website ? website.trim() : null,
        contact_number: contact_number ? contact_number.trim() : null,
        referral_contact_email: referral_contact_email != null ? String(referral_contact_email).trim() || null : null,
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
          student_rating: clampStudentRating(student_rating)
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

      // Auto-generate referral code for the new institute
      try {
        const refCode = await Referral.generateAndSaveInstituteCode(institute.id, institute.institute_name);
        institute.referral_code = refCode;
      } catch (refErr) {
        console.error('⚠️ Non-blocking: failed to generate institute referral code', refErr);
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
        google_maps_link,
        type,
        logo,
        website,
        contact_number,
        referral_contact_email,
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
        google_maps_link:
          google_maps_link !== undefined
            ? google_maps_link != null
              ? String(google_maps_link).trim() || null
              : null
            : undefined,
        type: type !== undefined ? type || null : undefined,
        logo: logo !== undefined ? logo : undefined,
        website: website !== undefined ? (website && website.trim()) || null : undefined,
        contact_number: contact_number !== undefined ? (contact_number && contact_number.trim()) || null : undefined,
        referral_contact_email:
          referral_contact_email !== undefined
            ? referral_contact_email != null
              ? String(referral_contact_email).trim() || null
              : null
            : undefined,
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
          student_rating: clampStudentRating(student_rating)
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
        'google_maps_link',
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
          'https://maps.app.goo.gl/example-allen',
          'Offline',
          'allen.png',
          'https://allen.ac.in',
          '9876543210',
          'Premier coaching for JEE and NEET.',
          'TRUE',
          'TRUE',
          '9.5',
          '85',
          '5',
          'JEE Main',
          'JEE Main',
          'JEE Main|Class 12|12|50000|30|2025-01-01, NEET|Class 12|24|80000|25|2025-04-01'
        ],
        [
          'Unacademy',
          'Online',
          '',
          'Online',
          'unacademy.png',
          'https://unacademy.com',
          '',
          'Online learning platform.',
          'TRUE',
          'FALSE',
          '8',
          '78',
          '4',
          'JEE Main',
          'JEE Main',
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
        'institute_name', 'institute_location', 'google_maps_link', 'type', 'logo_filename', 'website', 'contact_number',
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
          inst.google_maps_link || '',
          inst.type || '',
          logoFilename,
          inst.website || '',
          inst.contact_number || '',
          (detail.institute_description != null ? detail.institute_description : '') || '',
          (detail.demo_available === true || detail.demo_available === 't') ? 'TRUE' : 'FALSE',
          (detail.scholarship_available === true || detail.scholarship_available === 't') ? 'TRUE' : 'FALSE',
          (stats.ranking_score != null) ? String(stats.ranking_score) : '',
          (stats.success_rate != null) ? String(stats.success_rate) : '',
          studentRatingForExport(stats.student_rating),
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

  static async uploadMissingLogos(req, res) {
    try {
      const logosZipFile = req.files?.logos_zip?.[0] || req.file;
      if (!logosZipFile || !logosZipFile.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No ZIP file uploaded. Use field name "logos_zip".'
        });
      }
      const logoMap = parseLogosFromZip(logosZipFile.buffer);
      if (logoMap.size === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or corrupted ZIP file. Use a ZIP containing only image files (e.g. .jpg, .png).'
        });
      }
      const result = await processMissingLogosFromZip(logoMap, {
        findRecordsByFilename: (f) => Institute.findMissingLogosByFilename(f),
        uploadToS3,
        s3Folder: 'institute-logos',
        logoColumn: 'logo',
        updateRecord: (id, data) => Institute.update(id, data),
        toResultItem: (r) => ({ id: r.id, institute_name: r.institute_name, logo_filename: r.logo_filename })
      });
      res.json({
        success: true,
        data: result,
        message: `Added ${result.updated.length} logo(s). ${result.skipped.length} file(s) had no matching institutes.`
      });
    } catch (error) {
      console.error('Error uploading missing logos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload missing logos'
      });
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

      const logoMap = buildLogoMapFromRequest(req.files || {}, 'logos_zip', 'logos');

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
        const googleMapsLink =
          (row.google_maps_link ?? row.google_Maps_Link ?? row.google_maps_Link ?? '').toString().trim() || null;
        const typeRaw = (row.type ?? '').toString().trim();
        const instituteType = validTypes.find((t) => t.toLowerCase() === typeRaw.toLowerCase()) || null;
        const logoFilename = (row.logo_filename ?? row.logo_Filename ?? '').toString().trim();
        const website = (row.website ?? '').toString().trim() || null;
        const contactNumber = (row.contact_number ?? row.contact_Number ?? '').toString().trim() || null;
        const description = (row.institute_description ?? row.institute_Description ?? '').toString().trim() || null;
        const demoAvailable = parseBool(row.demo_available, true);
        const scholarshipAvailable = parseBool(row.scholarship_available, false);
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
          }
          // If logo file not found: still create institute with logo_filename; user can upload missing logos later
        }

        try {
          const institute = await Institute.create({
            institute_name: name,
            institute_location: location,
            google_maps_link: googleMapsLink,
            type: instituteType,
            logo: logoUrl,
            logo_filename: logoFilename || null,
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
          const student_rating = clampStudentRating(studentRatingRaw);
          if (ranking_score != null || success_rate != null || student_rating != null) {
            await InstituteStatistics.create({
              institute_id: institute.id,
              ranking_score: isNaN(ranking_score) ? null : ranking_score,
              success_rate: isNaN(success_rate) ? null : success_rate,
              student_rating
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
            const courseRows = splitList(coursesRaw);
            for (const cr of courseRows) {
              const [course_name, target_class, duration_months, fees, batch_size, start_dateRaw] = cr.split('|').map((s) => s.trim());
              const start_date = start_dateRaw ? parseDate(start_dateRaw) : null;
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
                start_date: start_date
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
