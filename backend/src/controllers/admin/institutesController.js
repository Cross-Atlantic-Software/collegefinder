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
const { splitList, parseDate, parseBool, getCell, normalizeEntityKey, countMapArrayValues } = require('../../utils/bulkUploadUtils');
const { resolveGoogleMapsLink, formatLocationLine } = require('../../services/googlePlacesMapsLink');

/** Store coaching metrics / course fields as DB TEXT (trimmed; empty → null). */
function toInstituteMetricText(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

/** For Excel export: plain string cell. */
function metricTextForExport(val) {
  if (val === undefined || val === null || val === '') return '';
  return String(val).trim();
}

/**
 * Build map: lowercased institute_name -> array of course row objects (from InstituteCourses sheet / file).
 */
function groupInstituteCourseRowsToMap(rows) {
  const map = new Map();
  if (!rows || !rows.length) return map;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const instituteName = getCell(row, 'institute_name', 'institute_Name');
    if (!instituteName) continue;
    const course_name = getCell(row, 'course_name', 'course_Name');
    if (!course_name) continue;
    const key = normalizeEntityKey(instituteName);
    if (!map.has(key)) map.set(key, []);
    const durationRaw = getCell(row, 'duration_months', 'duration_Months');
    const feesRaw = getCell(row, 'fees');
    const batchRaw = getCell(row, 'batch_size', 'batch_Size');
    const startRaw = getCell(row, 'start_date', 'start_Date');
    const start_date = startRaw ? parseDate(startRaw) : null;
    map.get(key).push({
      institute_name: instituteName,
      course_name,
      target_class: getCell(row, 'target_class', 'target_Class') || null,
      duration_months: durationRaw !== '' ? toInstituteMetricText(durationRaw) : null,
      fees: feesRaw !== '' ? toInstituteMetricText(feesRaw) : null,
      batch_size: batchRaw !== '' ? toInstituteMetricText(batchRaw) : null,
      start_date
    });
  }
  return map;
}

function sheetNorm(n) {
  return String(n).toLowerCase().replace(/\s+/g, '');
}

function isInstituteCourseCatalogSheet(n) {
  const x = sheetNorm(n);
  return x === 'coursenamescatalog' || x === 'course_names_catalog';
}

function isExcludedFromInstituteCoursesPick(n) {
  const x = sheetNorm(n);
  return x === 'institutes' || x === 'colleges' || isInstituteCourseCatalogSheet(n);
}

/**
 * @param {import('xlsx').WorkBook} workbook
 * @param {{ dedicatedCoursesFile: boolean }} opts - true when workbook is the optional courses_excel upload only
 */
function loadGroupedCoursesFromWorkbook(workbook, opts = { dedicatedCoursesFile: false }) {
  if (!workbook?.SheetNames?.length) return new Map();
  const names = workbook.SheetNames;
  const norm = sheetNorm;
  let sheetName = names.find((n) => {
    const x = norm(n);
    return x === 'institutecourses' || x === 'institute_courses';
  });
  if (!sheetName) {
    sheetName = names.find((n) => !isExcludedFromInstituteCoursesPick(n)) || null;
  }
  if (!sheetName && names.length === 1 && opts.dedicatedCoursesFile) {
    const only = names[0];
    sheetName = isExcludedFromInstituteCoursesPick(only) ? null : only;
  }
  if (!sheetName) return new Map();
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return new Map();
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  return groupInstituteCourseRowsToMap(rows);
}

async function insertInstituteCoursesFromBucket(instituteId, bucket, courseNamesFilter, errors, rowNum) {
  if (!bucket || !bucket.length) return;
  let toInsert = bucket;
  if (courseNamesFilter && courseNamesFilter.length > 0) {
    const picked = [];
    const missing = [];
    for (const w of courseNamesFilter) {
      const wt = String(w).trim();
      if (!wt) continue;
      const found = bucket.find(
        (c) => String(c.course_name || '').trim().toLowerCase() === wt.toLowerCase()
      );
      if (!found) missing.push(w);
      else if (!picked.includes(found)) picked.push(found);
    }
    if (picked.length > 0) {
      toInsert = picked;
      for (const w of missing) {
        errors.push({
          row: rowNum,
          message: `course_names "${w}" has no matching row in the Institute Courses sheet for this institute`
        });
      }
    } else {
      toInsert = bucket;
      if (missing.length) {
        errors.push({
          row: rowNum,
          message:
            'course_names did not match any row in the courses sheet for this institute; all course rows from the sheet were attached instead.'
        });
      }
    }
  }
  for (const c of toInsert) {
    await InstituteCourse.create({
      institute_id: instituteId,
      course_name: c.course_name || null,
      target_class: c.target_class,
      duration_months: c.duration_months,
      fees: c.fees,
      batch_size: c.batch_size,
      start_date: c.start_date
    });
  }
}

function mergeGroupedCourseMaps(base, extra) {
  const out = new Map(base);
  for (const [k, arr] of extra) {
    if (!out.has(k)) out.set(k, []);
    out.get(k).push(...arr);
  }
  return out;
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
        type,
        logo,
        website,
        contact_number,
        referral_contact_email,
        institute_description,
        demo_available,
        scholarship_available,
        ranking_score,
        success_rate,
        student_rating,
        instituteCourses,
        state,
        city,
        branches_number,
        student_strength,
        fee_type,
        fee_band,
        batch_category,
        course_cycle,
        parent_institute,
      } = req.body;

      if (!institute_name || !institute_name.trim()) {
        return res.status(400).json({ success: false, message: 'Institute name is required' });
      }

      const stateTrim = state != null ? String(state).trim() : '';
      const cityTrim = city != null ? String(city).trim() : '';
      if (!stateTrim || !cityTrim) {
        return res.status(400).json({ success: false, message: 'State and city are required' });
      }

      const existing = await Institute.findByName(institute_name.trim());
      if (existing) {
        return res.status(400).json({ success: false, message: 'Institute with this name already exists' });
      }

      const institute_location = formatLocationLine(cityTrim, stateTrim);
      const google_maps_link = await resolveGoogleMapsLink({
        name: institute_name.trim(),
        city: cityTrim,
        state: stateTrim,
      });

      const institute = await Institute.create({
        institute_name: institute_name.trim(),
        institute_location,
        google_maps_link,
        type: type || null,
        logo: logo || null,
        website: website ? website.trim() : null,
        contact_number: contact_number ? contact_number.trim() : null,
        referral_contact_email: referral_contact_email != null ? String(referral_contact_email).trim() || null : null,
        branches_number: toInstituteMetricText(branches_number),
        student_strength: toInstituteMetricText(student_strength),
        fee_type: fee_type != null ? String(fee_type).trim() || null : null,
        fee_band: fee_band != null ? String(fee_band).trim() || null : null,
        batch_category: batch_category != null ? String(batch_category).trim() || null : null,
        course_cycle: course_cycle != null ? String(course_cycle).trim() || null : null,
        parent_institute: parent_institute != null ? String(parent_institute).trim() || null : null,
        state: stateTrim,
        city: cityTrim,
      });

      if (institute_description != null || demo_available != null || scholarship_available != null) {
        await InstituteDetails.create({
          institute_id: institute.id,
          institute_description: institute_description ? institute_description.trim() : null,
          demo_available: !!demo_available,
          scholarship_available: !!scholarship_available
        });
      }

      if (ranking_score != null || success_rate != null || student_rating != null) {
        await InstituteStatistics.create({
          institute_id: institute.id,
          ranking_score: toInstituteMetricText(ranking_score),
          success_rate: toInstituteMetricText(success_rate),
          student_rating: toInstituteMetricText(student_rating)
        });
      }

      if (instituteCourses && Array.isArray(instituteCourses)) {
        for (const c of instituteCourses) {
          if (c.course_name || c.target_class || c.duration_months != null || c.fees != null || c.batch_size != null || c.start_date) {
            await InstituteCourse.create({
              institute_id: institute.id,
              course_name: c.course_name || null,
              target_class: c.target_class || null,
              duration_months: toInstituteMetricText(c.duration_months),
              fees: toInstituteMetricText(c.fees),
              batch_size: toInstituteMetricText(c.batch_size),
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
        type,
        logo,
        website,
        contact_number,
        referral_contact_email,
        institute_description,
        demo_available,
        scholarship_available,
        ranking_score,
        success_rate,
        student_rating,
        instituteCourses,
        state,
        city,
        branches_number,
        student_strength,
        fee_type,
        fee_band,
        batch_category,
        course_cycle,
        parent_institute,
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

      const hasStateKey = Object.prototype.hasOwnProperty.call(req.body, 'state');
      const hasCityKey = Object.prototype.hasOwnProperty.call(req.body, 'city');
      const finalName = institute_name !== undefined ? institute_name.trim() : existing.institute_name;

      const updatePayload = {
        institute_name: institute_name !== undefined ? institute_name.trim() : undefined,
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
        branches_number:
          branches_number !== undefined ? toInstituteMetricText(branches_number) : undefined,
        student_strength:
          student_strength !== undefined ? toInstituteMetricText(student_strength) : undefined,
        fee_type:
          fee_type !== undefined
            ? (fee_type != null ? String(fee_type).trim() || null : null)
            : undefined,
        fee_band:
          fee_band !== undefined
            ? (fee_band != null ? String(fee_band).trim() || null : null)
            : undefined,
        batch_category:
          batch_category !== undefined
            ? (batch_category != null ? String(batch_category).trim() || null : null)
            : undefined,
        course_cycle:
          course_cycle !== undefined
            ? (course_cycle != null ? String(course_cycle).trim() || null : null)
            : undefined,
        parent_institute:
          parent_institute !== undefined
            ? (parent_institute != null ? String(parent_institute).trim() || null : null)
            : undefined,
      };

      if (hasStateKey || hasCityKey) {
        const stateTrim = hasStateKey ? String(state ?? '').trim() : '';
        const cityTrim = hasCityKey ? String(city ?? '').trim() : '';
        if (!stateTrim || !cityTrim) {
          return res.status(400).json({ success: false, message: 'State and city are both required' });
        }
        updatePayload.state = stateTrim;
        updatePayload.city = cityTrim;
        updatePayload.institute_location = formatLocationLine(cityTrim, stateTrim);
        updatePayload.google_maps_link = await resolveGoogleMapsLink({
          name: finalName,
          city: cityTrim,
          state: stateTrim,
        });
      } else if (
        institute_name !== undefined &&
        finalName !== existing.institute_name &&
        existing.state &&
        existing.city
      ) {
        updatePayload.google_maps_link = await resolveGoogleMapsLink({
          name: finalName,
          city: existing.city,
          state: existing.state,
        });
      }

      await Institute.update(instituteId, updatePayload);

      if (institute_description !== undefined || demo_available !== undefined || scholarship_available !== undefined) {
        await InstituteDetails.create({
          institute_id: instituteId,
          institute_description: institute_description != null ? String(institute_description).trim() : null,
          demo_available: !!demo_available,
          scholarship_available: !!scholarship_available
        });
      }

      if (ranking_score !== undefined || success_rate !== undefined || student_rating !== undefined) {
        await InstituteStatistics.create({
          institute_id: instituteId,
          ranking_score: toInstituteMetricText(ranking_score),
          success_rate: toInstituteMetricText(success_rate),
          student_rating: toInstituteMetricText(student_rating)
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
              duration_months: toInstituteMetricText(c.duration_months),
              fees: toInstituteMetricText(c.fees),
              batch_size: toInstituteMetricText(c.batch_size),
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
        'city',
        'institute_cityname',
        'state',
        'type',
        'logo_filename',
        'logo_file_link',
        'website',
        'contact_number',
        'branches_number',
        'student_strength',
        'fee_type',
        'fee_band',
        'batch_category',
        'course_cycle',
        'parent_institute',
        'institute_description',
        'demo_available',
        'scholarship_available',
        'ranking_score',
        'success_rate',
        'student_rating',
        'course_name',
        'target_class',
        'duration',
        'fees',
        'batch_size',
        'start_date'
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        [
          'Allen',
          'Kota',
          'Allen, Kota',
          'Rajasthan',
          'Offline',
          'allen.png',
          '',
          'https://allen.ac.in',
          '9876543210',
          '25',
          '5000+',
          'Annual',
          '₹1.5L–₹2.5L',
          'JEE Advanced',
          '1-year intensive',
          'Allen Career Institute',
          'Premier coaching for JEE and NEET.',
          'TRUE',
          'TRUE',
          '9.5',
          '85',
          '5',
          'JEE Main Intensive',
          'Class 11-12',
          '24',
          '150000',
          '60',
          '2025-06-01'
        ],
        [
          'Allen',
          'Kota',
          'Allen, Kota',
          'Rajasthan',
          '', '', '', '', '', '', '', '',
          '', '', '', '', '',
          '', '', '', '', '', '',
          'NEET Foundation',
          'Class 11-12',
          '12',
          '120000',
          '50',
          '2025-07-01'
        ],
        [
          'Unacademy',
          'Bengaluru',
          'Unacademy, Bengaluru',
          'Karnataka',
          'Online',
          '',
          'https://example.com/unacademy-logo.png',
          'https://unacademy.com',
          '',
          '',
          '',
          'Annual',
          '₹50k–₹1L',
          'Foundation',
          '2-year program',
          'Unacademy',
          'Online learning platform.',
          'TRUE',
          'FALSE',
          '8',
          '78',
          '4',
          'JEE Crash Course',
          'Class 12',
          '6',
          '50000',
          '200',
          '2025-03-01'
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

  /**
   * Optional courses_excel file: InstituteCourses sheet layout + catalog of course_name values in use.
   * Download separately from institutes-bulk-template.xlsx.
   */
  static async downloadCoursesExcelTemplate(req, res) {
    try {
      const courseHeaders = [
        'institute_name',
        'course_name',
        'target_class',
        'duration_months',
        'fees',
        'batch_size',
        'start_date'
      ];
      const wb = XLSX.utils.book_new();
      const wsCourses = XLSX.utils.aoa_to_sheet([
        courseHeaders,
        [
          'Allen Kota',
          'JEE Main Intensive',
          'Class 12',
          '12',
          '50000',
          '30',
          '2025-01-01'
        ],
        [
          'Allen Kota',
          'NEET Foundation',
          'Class 12',
          '24',
          '80000',
          '25',
          '2025-04-01'
        ],
      ]);
      XLSX.utils.book_append_sheet(wb, wsCourses, 'InstituteCourses');

      const distinctNames = await InstituteCourse.findDistinctCourseNames();
      const catalogRows = [
        ['course_names'],
        ['(Use exact spelling in the main institutes sheet column course_names, semicolon-separated, or as course_name per row below.)'],
      ];
      if (distinctNames.length === 0) {
        catalogRows.push(['(No saved institute courses yet — you may use any new name.)']);
      } else {
        for (const name of distinctNames) {
          catalogRows.push([name]);
        }
      }
      const wsCatalog = XLSX.utils.aoa_to_sheet(catalogRows);
      XLSX.utils.book_append_sheet(wb, wsCatalog, 'Course_names_catalog');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=institutes-courses-excel-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating courses Excel template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate courses template' });
    }
  }

  /** Download all institutes data as Excel (Super Admin only). Same columns as bulk template. */
  static async downloadAllExcel(req, res) {
    try {
      const institutes = await Institute.findAll();
      const headers = [
        'institute_name', 'state', 'city', 'institute_location', 'google_maps_link', 'type', 'logo_filename', 'website', 'contact_number', 'branches_number', 'student_strength',
        'fee_type', 'fee_band', 'batch_category', 'course_cycle', 'parent_institute',
        'institute_description', 'demo_available', 'scholarship_available', 'ranking_score', 'success_rate', 'student_rating',
        'course_names'
      ];
      const rows = [headers];
      const courseExportRows = [
        ['institute_name', 'course_name', 'target_class', 'duration_months', 'fees', 'batch_size', 'start_date']
      ];
      for (const inst of institutes) {
        const [details, statistics, courses] = await Promise.all([
          InstituteDetails.findByInstituteId(inst.id),
          InstituteStatistics.findByInstituteId(inst.id),
          InstituteCourse.findByInstituteId(inst.id)
        ]);
        const detail = details || {};
        const stats = statistics || {};
        const logoFilename = (inst.logo && typeof inst.logo === 'string' && inst.logo.split('/').pop()) ? inst.logo.split('/').pop() : '';
        const courseNamesStr = (courses && courses.length)
          ? courses.map((co) => (co.course_name || '').trim()).filter(Boolean).join('; ')
          : '';
        if (courses && courses.length) {
          for (const co of courses) {
            courseExportRows.push([
              inst.institute_name || '',
              co.course_name || '',
              co.target_class || '',
              co.duration_months != null ? String(co.duration_months) : '',
              co.fees != null ? String(co.fees) : '',
              co.batch_size != null ? String(co.batch_size) : '',
              co.start_date ? String(co.start_date).slice(0, 10) : ''
            ]);
          }
        }
        rows.push([
          inst.institute_name || '',
          inst.state || '',
          inst.city || '',
          inst.institute_location || '',
          inst.google_maps_link || '',
          inst.type || '',
          logoFilename,
          inst.website || '',
          inst.contact_number || '',
          metricTextForExport(inst.branches_number),
          metricTextForExport(inst.student_strength),
          inst.fee_type || '',
          inst.fee_band || '',
          inst.batch_category || '',
          inst.course_cycle || '',
          inst.parent_institute || '',
          (detail.institute_description != null ? detail.institute_description : '') || '',
          (detail.demo_available === true || detail.demo_available === 't') ? 'TRUE' : 'FALSE',
          (detail.scholarship_available === true || detail.scholarship_available === 't') ? 'TRUE' : 'FALSE',
          (stats.ranking_score != null) ? String(stats.ranking_score) : '',
          (stats.success_rate != null) ? String(stats.success_rate) : '',
          metricTextForExport(stats.student_rating),
          courseNamesStr
        ]);
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Institutes');
      const wsCourses = XLSX.utils.aoa_to_sheet(courseExportRows);
      XLSX.utils.book_append_sheet(wb, wsCourses, 'InstituteCourses');
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

      const normSheet = (n) => String(n).toLowerCase().replace(/\s+/g, '');
      const institutesSheetName =
        workbook.SheetNames.find((n) => normSheet(n) === 'institutes') || workbook.SheetNames[0];
      const sheet = workbook.Sheets[institutesSheetName];
      if (!sheet) {
        return res.status(400).json({ success: false, message: 'Excel has no valid sheet for institutes.' });
      }
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (!rows.length) {
        return res.status(400).json({ success: false, message: 'Excel file has no data rows.' });
      }

      // Group rows by normalized institute_cityname (or institute_name if city blank) — one institute per key.
      // Extra Excel rows with the same key merge as extra courses only; they are NOT separate institutes.
      const instituteGroups = new Map();
      const skippedEmptyNameDetails = [];
      const mergedSameKeyDetails = [];
      const MAX_MERGED_DETAIL_ROWS = 2000;
      let mergedDuplicateRowCount = 0;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const name = getCell(row, 'institute_name', 'institute_Name');
        const instituteCityName = getCell(row, 'institute_cityname', 'institute_Cityname', 'institute_cityName');
        if (!name || !String(name).trim()) {
          skippedEmptyNameDetails.push({
            row: rowNum,
            message: 'Skipped: institute_name is empty',
          });
          continue;
        }
        const groupKey = normalizeEntityKey(instituteCityName || name);
        const label =
          instituteCityName && String(instituteCityName).trim()
            ? String(instituteCityName).trim()
            : String(name).trim();
        const courseNameCell = getCell(row, 'course_name', 'course_Name');
        const hasCourse = !!(courseNameCell && String(courseNameCell).trim());
        const hadGroup = instituteGroups.has(groupKey);
        if (!hadGroup) {
          instituteGroups.set(groupKey, { firstRow: row, firstRowNum: rowNum, courses: [] });
        } else {
          mergedDuplicateRowCount += 1;
          if (mergedSameKeyDetails.length < MAX_MERGED_DETAIL_ROWS) {
            const anchorRow = instituteGroups.get(groupKey).firstRowNum;
            const courseHint = hasCourse
              ? ' Course columns from this row were merged into that single institute.'
              : ' No course_name on this row — nothing was applied from this line.';
            mergedSameKeyDetails.push({
              row: rowNum,
              message: `Same institute key as row ${anchorRow} ("${label}" after trim/lowercase). This is not a new institute.${courseHint}`,
            });
          }
        }
        if (hasCourse) {
          const durationRaw = getCell(row, 'duration', 'duration_months', 'duration_Months');
          const feesRaw = getCell(row, 'fees', 'Fees');
          const batchRaw = getCell(row, 'batch_size', 'batch_Size');
          const startRaw = getCell(row, 'start_date', 'start_Date');
          const start_date = startRaw ? parseDate(startRaw) : null;
          instituteGroups.get(groupKey).courses.push({
            course_name: String(courseNameCell).trim(),
            target_class: getCell(row, 'target_class', 'target_Class') || null,
            duration_months: durationRaw !== '' ? toInstituteMetricText(durationRaw) : null,
            fees: feesRaw !== '' ? toInstituteMetricText(feesRaw) : null,
            batch_size: batchRaw !== '' ? toInstituteMetricText(batchRaw) : null,
            start_date,
          });
        }
      }

      const mergedSameKeyDetailsTruncated = Math.max(0, mergedDuplicateRowCount - mergedSameKeyDetails.length);

      const created = [];
      const errors = [];

      for (const [groupKey, group] of instituteGroups) {
        const row = group.firstRow;
        const rowNum = group.firstRowNum;
        const name = getCell(row, 'institute_name', 'institute_Name');
        const cityTrim = getCell(row, 'city', 'City');
        const instituteCityName = getCell(row, 'institute_cityname', 'institute_Cityname', 'institute_cityName');
        const stateTrim = getCell(row, 'state', 'State');

        if (!instituteCityName) {
          errors.push({ row: rowNum, message: 'institute_cityname is required' });
          continue;
        }

        // Check uniqueness by institute_cityname
        const existing = await Institute.findByInstituteCityName(instituteCityName);
        if (existing) {
          errors.push({ row: rowNum, message: `institute "${instituteCityName}" already exists` });
          continue;
        }

        const typeRaw = getCell(row, 'type', 'Type');
        const instituteType = validTypes.find((t) => t.toLowerCase() === typeRaw.toLowerCase()) || null;
        const logoFilename = getCell(row, 'logo_filename', 'logo_Filename');
        const logoFileLink = getCell(row, 'logo_file_link', 'logo_File_Link');
        const website = getCell(row, 'website', 'Website') || null;
        const contactNumber = getCell(row, 'contact_number', 'contact_Number') || null;
        const branchesNumberRaw = getCell(row, 'branches_number', 'branches_Number', 'branches number');
        const studentStrengthRaw = getCell(row, 'student_strength', 'student_Strength', 'student strength');
        const feeTypeVal = getCell(row, 'fee_type', 'Fee_Type', 'Fee Type') || null;
        const feeBandVal = getCell(row, 'fee_band', 'Fee_Band', 'Fee Band') || null;
        const batchCategoryVal = getCell(row, 'batch_category', 'Batch_Category', 'Batch Category') || null;
        const courseCycleVal = getCell(row, 'course_cycle', 'Course_Cycle', 'Course Cycle') || null;
        const parentInstituteVal = getCell(row, 'parent_institute', 'Parent_Institute', 'Parent Institute') || null;
        const description = getCell(row, 'institute_description', 'institute_Description') || null;
        const demoAvailable = parseBool(row.demo_available, true);
        const scholarshipAvailable = parseBool(row.scholarship_available, false);
        const rankingScoreRaw = getCell(row, 'ranking_score', 'ranking_Score');
        const successRateRaw = getCell(row, 'success_rate', 'success_Rate');
        const studentRatingRaw = getCell(row, 'student_rating', 'student_Rating');

        // Resolve logo: prefer logo_file_link URL > logo from ZIP
        let logoUrl = null;
        if (logoFileLink) {
          logoUrl = logoFileLink;
        } else if (logoFilename) {
          const logoFile = logoMap.get(logoFilename.toLowerCase());
          if (logoFile && logoFile.buffer) {
            try {
              logoUrl = await uploadToS3(logoFile.buffer, logoFile.originalname || logoFilename, 'institute-logos');
            } catch (uploadErr) {
              errors.push({ row: rowNum, message: `logo upload failed for "${logoFilename}": ${uploadErr.message}` });
            }
          }
        }

        try {
          const institute = await Institute.create({
            institute_name: name,
            institute_location: instituteCityName,
            institute_cityname: instituteCityName,
            type: instituteType,
            logo: logoUrl,
            logo_filename: logoFilename || null,
            website,
            contact_number: contactNumber,
            branches_number: toInstituteMetricText(branchesNumberRaw),
            student_strength: toInstituteMetricText(studentStrengthRaw),
            fee_type: feeTypeVal,
            fee_band: feeBandVal,
            batch_category: batchCategoryVal,
            course_cycle: courseCycleVal,
            parent_institute: parentInstituteVal,
            state: stateTrim || null,
            city: cityTrim || null,
          });
          if (description || demoAvailable || scholarshipAvailable) {
            await InstituteDetails.create({
              institute_id: institute.id,
              institute_description: description,
              demo_available: demoAvailable,
              scholarship_available: scholarshipAvailable
            });
          }
          const ranking_score = toInstituteMetricText(rankingScoreRaw);
          const success_rate = toInstituteMetricText(successRateRaw);
          const student_rating = toInstituteMetricText(studentRatingRaw);
          if (ranking_score != null || success_rate != null || student_rating != null) {
            await InstituteStatistics.create({
              institute_id: institute.id,
              ranking_score,
              success_rate,
              student_rating
            });
          }

          // Insert courses from grouped rows
          for (const c of group.courses) {
            await InstituteCourse.create({
              institute_id: institute.id,
              course_name: c.course_name || null,
              target_class: c.target_class,
              duration_months: c.duration_months,
              fees: c.fees,
              batch_size: c.batch_size,
              start_date: c.start_date
            });
          }

          created.push({ id: institute.id, name: institute.institute_name });
        } catch (createErr) {
          errors.push({
            row: rowNum,
            message: createErr.message || 'Failed to create institute',
          });
        }
      }

      res.json({
        success: true,
        data: {
          totalExcelRows: rows.length,
          rowsWithInstituteName: rows.length - skippedEmptyNameDetails.length,
          skippedEmptyNameCount: skippedEmptyNameDetails.length,
          skippedEmptyNameDetails,
          uniqueInstituteKeys: instituteGroups.size,
          mergedDuplicateRowCount,
          mergedSameKeyDetails,
          mergedSameKeyDetailsTruncated,
          created: created.length,
          createdInstitutes: created,
          errors: errors.length,
          errorDetails: errors,
        },
        message:
          `Created ${created.length} institute(s) from ${instituteGroups.size} unique key(s). ` +
          `Excel had ${rows.length} data row(s); ${skippedEmptyNameDetails.length} skipped (empty institute_name); ` +
          `${mergedDuplicateRowCount} row(s) shared an existing key (same institute, not extra coachings).` +
          (errors.length ? ` ${errors.length} row-level error(s).` : ''),
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
