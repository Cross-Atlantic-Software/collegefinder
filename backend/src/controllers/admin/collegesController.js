const XLSX = require('xlsx');
const College = require('../../models/college/College');
const CollegeDetails = require('../../models/college/CollegeDetails');
const CollegeProgram = require('../../models/college/CollegeProgram');
const CollegePreviousCutoff = require('../../models/college/CollegePreviousCutoff');
const CollegeExpectedCutoff = require('../../models/college/CollegeExpectedCutoff');
const CollegeSeatMatrix = require('../../models/college/CollegeSeatMatrix');
const CollegeKeyDates = require('../../models/college/CollegeKeyDates');
const CollegeDocumentsRequired = require('../../models/college/CollegeDocumentsRequired');
const CollegeCounsellingProcess = require('../../models/college/CollegeCounsellingProcess');
const CollegeRecommendedExam = require('../../models/college/CollegeRecommendedExam');
const Program = require('../../models/taxonomy/Program');
const Branch = require('../../models/taxonomy/Branch');
const Exam = require('../../models/taxonomy/Exam');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');
const { splitList, parseDate, getCell, splitProgramBlocks } = require('../../utils/bulkUploadUtils');
const { formatLocationLine } = require('../../services/googlePlacesMapsLink');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const UploadJob = require('../../models/UploadJob');
const { enqueueCollegeBulkUploadJob } = require('../../jobs/queues/collegeBulkUploadQueue');
const { isLikelyS3Url, normalizeCollegeLogoFields } = require('../../utils/collegeLogoFields');

const COLLEGE_BULK_UPLOAD_DIR = path.join(__dirname, '../../../uploads/college-bulk');

/** Reference-only Programs_catalog sheet for bulk template (programs are defined on each Colleges row). */
async function appendProgramsCatalogSheet(wb) {
  const programs = await Program.findAll();
  const catalogRows = [
    ['program_id', 'program_name', 'stream', 'interest_labels'],
    ['', 'Reference only. On Colleges: program_names plus intake_capacities, program_durations, previous_year_cutoff, expected_cutoff, seat_matrix (same order; comma or semicolon between values). Use || between program blocks for cutoff/seat cells when a block contains ;.', '', ''],
  ];
  for (const p of programs) {
    catalogRows.push([
      p.id,
      p.name || '',
      p.stream_name || '',
      p.interest_labels || '',
    ]);
  }
  const wsCatalog = XLSX.utils.aoa_to_sheet(catalogRows);
  XLSX.utils.book_append_sheet(wb, wsCatalog, 'Programs_catalog');
}

/** Colleges + Programs_catalog — bulk create file. */
async function buildCollegesBulkTemplateBuffer() {
  const headers = [
    'college_name',
    'parent_university',
    'state',
    'city',
    'college_type',
    'website',
    'logo_url',
    'college_description',
    'program_names',
    'intake_capacities',
    'program_durations',
    'previous_year_cutoff',
    'expected_cutoff',
    'seat_matrix',
    'key_dates',
    'documents_required',
    'counselling_process',
    'recommended_exam_names',
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    headers,
    [
      'IIT Delhi',
      '',
      'Delhi',
      'New Delhi',
      'Central,State',
      'https://www.iitd.ac.in',
      'https://example.com/logos/iit-delhi.png',
      'Premier engineering institute.',
      'B.Tech; M.Tech',
      '300; 150',
      '4; 2',
      'JEE Main|GEN-OBC:1500|2024 || JEE Advanced|GEN-OBC:800|2024',
      'JEE Main|GEN-OBC:1400|2025 || JEE Advanced|GEN-OBC:750|2025',
      'GEN-OBC:200, SC:40 || GEN-OBC:85',
      'Admission Start|2025-01-01, Last Date|2025-02-28',
      'Aadhar, Marksheet, Photo',
      'JOSAA counselling',
      'JEE Advanced, JEE Main',
    ],
    [
      'State College of Engineering',
      'Mumbai University',
      'Maharashtra',
      'Mumbai City',
      'State',
      'https://www.sce.ac.in',
      'https://example.com/logos/state-college.png',
      'State level engineering college.',
      'B.Tech',
      '120',
      '4',
      'JEE Main|GEN|8000|2024',
      'JEE Main|GEN|7800|2025',
      'GEN:100, OBC:30, SC:15',
      'Application Start|2025-02-01',
      'Marksheet',
      'State counselling',
      'JEE Main',
    ]
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Colleges');
  await appendProgramsCatalogSheet(wb);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function resolveRecommendedExamIds(body) {
  if (body.recommendedExamNames && Array.isArray(body.recommendedExamNames) && body.recommendedExamNames.length > 0) {
    const ids = [];
    for (const name of body.recommendedExamNames) {
      const t = (name && typeof name === 'string') ? name.trim() : '';
      if (!t) continue;
      const exam = await Exam.findByName(t);
      if (exam) ids.push(exam.id);
    }
    return ids;
  }
  if (body.recommendedExamIds && Array.isArray(body.recommendedExamIds)) {
    return body.recommendedExamIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
  }
  return [];
}

async function resolveCollegePrograms(collegeId, collegePrograms) {
  if (!collegePrograms || !Array.isArray(collegePrograms)) return;
  for (const prog of collegePrograms) {
    let programId = prog.program_id ? parseInt(prog.program_id, 10) : null;
    if ((!programId || isNaN(programId)) && prog.program_name && typeof prog.program_name === 'string') {
      const p = await Program.findByName(prog.program_name.trim());
      if (p) programId = p.id;
    }
    if (!programId) continue;
    let branchId = null;
    const branchName = prog.branch_course ? String(prog.branch_course).trim() : '';
    if (branchName) {
      const branch = await Branch.findByNameCaseInsensitive(branchName);
      if (branch) branchId = branch.id;
    }
    const cp = await CollegeProgram.create({
      college_id: collegeId,
      program_id: programId,
      intake_capacity: prog.intake_capacity != null ? parseInt(prog.intake_capacity, 10) : null,
      duration_years: prog.duration_years != null ? parseInt(prog.duration_years, 10) : null,
      branch_id: branchId,
      branch_course: prog.branch_course || null,
      program_description: prog.program_description || null,
      duration_unit: prog.duration_unit || 'years',
      key_dates_summary: prog.key_dates_summary || null,
      fee_per_semester: prog.fee_per_semester != null ? parseFloat(prog.fee_per_semester) : null,
      total_fee: prog.total_fee != null ? parseFloat(prog.total_fee) : null,
      placement: prog.placement || null,
      scholarship: prog.scholarship || null,
      counselling_process: prog.counselling_process || null,
      documents_required: prog.documents_required || null,
      recommended_exam_ids: prog.recommended_exam_ids || null,
      contact_email: prog.contact_email || null,
      contact_number: prog.contact_number || null,
      brochure_url: prog.brochure_url || null
    });
    if (cp && cp.id) {
      if (prog.previousCutoffs && Array.isArray(prog.previousCutoffs)) {
        for (const c of prog.previousCutoffs) {
          let examId = c.exam_id ? parseInt(c.exam_id, 10) : null;
          if ((!examId || isNaN(examId)) && c.exam_name && typeof c.exam_name === 'string') {
            const ex = await Exam.findByName(c.exam_name.trim());
            if (ex) examId = ex.id;
          }
          if (examId) {
            await CollegePreviousCutoff.create({
              college_program_id: cp.id,
              exam_id: examId,
              branch: c.branch || null,
              category: c.category || null,
              cutoff_rank: c.cutoff_rank != null ? parseInt(c.cutoff_rank, 10) : null,
              year: c.year != null ? parseInt(c.year, 10) : null
            });
          }
        }
      }
      if (prog.expectedCutoffs && Array.isArray(prog.expectedCutoffs)) {
        for (const c of prog.expectedCutoffs) {
          let examId = c.exam_id ? parseInt(c.exam_id, 10) : null;
          if ((!examId || isNaN(examId)) && c.exam_name && typeof c.exam_name === 'string') {
            const ex = await Exam.findByName(c.exam_name.trim());
            if (ex) examId = ex.id;
          }
          if (examId) {
            await CollegeExpectedCutoff.create({
              college_program_id: cp.id,
              exam_id: examId,
              branch: c.branch || null,
              category: c.category || null,
              expected_rank: c.expected_rank != null ? parseInt(c.expected_rank, 10) : null,
              year: c.year != null ? parseInt(c.year, 10) : null
            });
          }
        }
      }
      if (prog.seatMatrix && Array.isArray(prog.seatMatrix)) {
        for (const s of prog.seatMatrix) {
          await CollegeSeatMatrix.create({
            college_program_id: cp.id,
            branch: s.branch || null,
            category: s.category || null,
            seat_count: s.seat_count != null ? parseInt(s.seat_count, 10) : null,
            year: s.year != null ? parseInt(s.year, 10) : null
          });
        }
      }
    }
  }
}

function adminListWantsPagination(req) {
  return (
    req.query.page !== undefined ||
    req.query.perPage !== undefined ||
    req.query.limit !== undefined ||
    req.query.q !== undefined ||
    req.query.search !== undefined
  );
}

class CollegesController {
  static async getAllAdmin(req, res) {
    try {
      if (!adminListWantsPagination(req)) {
        const colleges = await College.findAll();
        const total = colleges.length;
        return res.json({
          success: true,
          data: {
            colleges,
            pagination: {
              page: 1,
              perPage: total,
              total,
              totalPages: total === 0 ? 0 : 1,
            },
          },
        });
      }

      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const rawPer = req.query.perPage ?? req.query.limit;
      const perPage = Math.min(Math.max(parseInt(rawPer, 10) || 10, 1), 100);
      const q = (req.query.q ?? req.query.search ?? '').trim();

      const { rows, total } = await College.findPaginatedAdmin({ page, perPage, q });
      const totalPages = total === 0 ? 0 : Math.ceil(total / perPage);

      res.json({
        success: true,
        data: {
          colleges: rows,
          pagination: {
            page,
            perPage,
            total,
            totalPages,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching colleges:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch colleges' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const college = await College.findById(parseInt(id));
      if (!college) {
        return res.status(404).json({ success: false, message: 'College not found' });
      }
      const [
        details,
        programs,
        keyDates,
        documentsRequired,
        counsellingProcess,
        recommendedExamIds
      ] = await Promise.all([
        CollegeDetails.findByCollegeId(parseInt(id)),
        CollegeProgram.findByCollegeId(parseInt(id)),
        CollegeKeyDates.findByCollegeId(parseInt(id)),
        CollegeDocumentsRequired.findByCollegeId(parseInt(id)),
        CollegeCounsellingProcess.findByCollegeId(parseInt(id)),
        CollegeRecommendedExam.getExamIdsByCollegeId(parseInt(id))
      ]);

      const programsWithExtras = await Promise.all(
        programs.map(async (p) => {
          const [previousCutoffs, expectedCutoffs, seatMatrix] = await Promise.all([
            CollegePreviousCutoff.findByCollegeProgramId(p.id),
            CollegeExpectedCutoff.findByCollegeProgramId(p.id),
            CollegeSeatMatrix.findByCollegeProgramId(p.id)
          ]);
          return {
            ...p,
            previousCutoffs,
            expectedCutoffs,
            seatMatrix
          };
        })
      );

      res.json({
        success: true,
        data: {
          college,
          collegeDetails: details,
          collegePrograms: programsWithExtras,
          collegeKeyDates: keyDates || [],
          collegeDocumentsRequired: documentsRequired || [],
          collegeCounsellingProcess: counsellingProcess || [],
          recommendedExamIds: recommendedExamIds || []
        }
      });
    } catch (error) {
      console.error('Error fetching college:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch college' });
    }
  }

  static async uploadLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const s3Url = await uploadToS3(req.file.buffer, req.file.originalname, 'college-logos');
      res.json({ success: true, data: { logoUrl: s3Url }, message: 'Logo uploaded successfully' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to upload logo' });
    }
  }

  static async create(req, res) {
    try {
      const {
        college_name,
        college_type,
        college_logo,
        college_description,
        website,
        parent_university,
        state,
        city,
        major_program_ids,
        collegePrograms,
        collegeKeyDates,
        collegeDocumentsRequired,
        collegeCounsellingProcess,
        recommendedExamIds,
        recommendedExamNames
      } = req.body;

      if (!college_name || !college_name.trim()) {
        return res.status(400).json({ success: false, message: 'College name is required' });
      }

      const stateTrim = state != null ? String(state).trim() : '';
      const cityTrim = city != null ? String(city).trim() : '';
      if (!stateTrim || !cityTrim) {
        return res.status(400).json({ success: false, message: 'State and city are required' });
      }

      const existing = await College.findByName(college_name.trim());
      if (existing) {
        return res.status(400).json({ success: false, message: 'College with this name already exists' });
      }

      const college_location = formatLocationLine(cityTrim, stateTrim);
      const logoFields = normalizeCollegeLogoFields(college_logo);

      const college = await College.create({
        college_name: college_name.trim(),
        college_location,
        college_type: college_type || null,
        college_logo: logoFields.college_logo,
        logo_url: logoFields.logo_url,
        website: website ? website.trim() : null,
        parent_university: parent_university != null ? String(parent_university).trim() || null : null,
        state: stateTrim,
        city: cityTrim
      });

      const majorProgramIdsStr = Array.isArray(major_program_ids) && major_program_ids.length > 0
        ? major_program_ids.join(',') : (typeof major_program_ids === 'string' ? major_program_ids : null);
      if (college_description || majorProgramIdsStr) {
        await CollegeDetails.create({
          college_id: college.id,
          college_description: college_description ? college_description.trim() : null,
          major_program_ids: majorProgramIdsStr
        });
      }

      if (collegeKeyDates && Array.isArray(collegeKeyDates)) {
        for (const item of collegeKeyDates) {
          if (item.event_name || item.event_date) {
            await CollegeKeyDates.create({
              college_id: college.id,
              event_name: item.event_name || null,
              event_date: item.event_date || null
            });
          }
        }
      }

      if (collegeDocumentsRequired && Array.isArray(collegeDocumentsRequired)) {
        for (const item of collegeDocumentsRequired) {
          if (item.document_name) {
            await CollegeDocumentsRequired.create({
              college_id: college.id,
              document_name: item.document_name.trim()
            });
          }
        }
      }

      if (collegeCounsellingProcess && Array.isArray(collegeCounsellingProcess)) {
        for (const item of collegeCounsellingProcess) {
          if (item.step_number != null || item.description) {
            await CollegeCounsellingProcess.create({
              college_id: college.id,
              step_number: item.step_number,
              description: item.description || null
            });
          }
        }
      }

      const resolvedExamIds = await resolveRecommendedExamIds(req.body);
      if (resolvedExamIds.length > 0) {
        await CollegeRecommendedExam.setExamsForCollege(college.id, resolvedExamIds);
      }

      await resolveCollegePrograms(college.id, collegePrograms);

      res.status(201).json({
        success: true,
        data: { college },
        message: 'College created successfully'
      });
    } catch (error) {
      console.error('Error creating college:', error);
      res.status(500).json({ success: false, message: 'Failed to create college' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const collegeId = parseInt(id);
      const existing = await College.findById(collegeId);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'College not found' });
      }

      const {
        college_name,
        college_type,
        college_logo,
        college_description,
        website,
        parent_university,
        state,
        city,
        major_program_ids,
        collegePrograms,
        collegeKeyDates,
        collegeDocumentsRequired,
        collegeCounsellingProcess,
        recommendedExamIds,
        recommendedExamNames
      } = req.body;

      if (college_name && college_name.trim() !== existing.college_name) {
        const dup = await College.findByName(college_name.trim());
        if (dup) {
          return res.status(400).json({ success: false, message: 'College with this name already exists' });
        }
      }

      if (college_logo !== undefined) {
        const nextLogo = normalizeCollegeLogoFields(college_logo).college_logo;
        if (nextLogo !== existing.college_logo && existing.college_logo && isLikelyS3Url(existing.college_logo)) {
          await deleteFromS3(existing.college_logo);
        }
      }

      const hasStateKey = Object.prototype.hasOwnProperty.call(req.body, 'state');
      const hasCityKey = Object.prototype.hasOwnProperty.call(req.body, 'city');

      const logoNorm = college_logo !== undefined ? normalizeCollegeLogoFields(college_logo) : null;
      const updatePayload = {
        college_name: college_name !== undefined ? college_name.trim() : undefined,
        college_type: college_type !== undefined ? college_type || null : undefined,
        college_logo: logoNorm ? logoNorm.college_logo : undefined,
        logo_url: logoNorm ? logoNorm.logo_url : undefined,
        website: website !== undefined ? (website ? website.trim() : null) : undefined,
        parent_university: parent_university !== undefined
          ? (parent_university != null ? String(parent_university).trim() || null : null)
          : undefined
      };

      if (hasStateKey || hasCityKey) {
        const stateTrim = hasStateKey ? String(state ?? '').trim() : '';
        const cityTrim = hasCityKey ? String(city ?? '').trim() : '';
        if (!stateTrim || !cityTrim) {
          return res.status(400).json({ success: false, message: 'State and city are both required' });
        }
        updatePayload.state = stateTrim;
        updatePayload.city = cityTrim;
        updatePayload.college_location = formatLocationLine(cityTrim, stateTrim);
      }

      await College.update(collegeId, updatePayload);

      const majorProgramIdsStr = Array.isArray(major_program_ids) && major_program_ids.length > 0
        ? major_program_ids.join(',') : (typeof major_program_ids === 'string' ? major_program_ids : null);
      if (college_description !== undefined || major_program_ids !== undefined) {
        await CollegeDetails.create({
          college_id: collegeId,
          college_description: college_description !== undefined ? (college_description ? college_description.trim() : null) : undefined,
          major_program_ids: major_program_ids !== undefined ? majorProgramIdsStr : undefined
        });
      }

      await CollegeKeyDates.deleteByCollegeId(collegeId);
      if (collegeKeyDates && Array.isArray(collegeKeyDates)) {
        for (const item of collegeKeyDates) {
          if (item.event_name || item.event_date) {
            await CollegeKeyDates.create({
              college_id: collegeId,
              event_name: item.event_name || null,
              event_date: item.event_date || null
            });
          }
        }
      }

      await CollegeDocumentsRequired.deleteByCollegeId(collegeId);
      if (collegeDocumentsRequired && Array.isArray(collegeDocumentsRequired)) {
        for (const item of collegeDocumentsRequired) {
          if (item.document_name) {
            await CollegeDocumentsRequired.create({
              college_id: collegeId,
              document_name: item.document_name.trim()
            });
          }
        }
      }

      await CollegeCounsellingProcess.deleteByCollegeId(collegeId);
      if (collegeCounsellingProcess && Array.isArray(collegeCounsellingProcess)) {
        for (const item of collegeCounsellingProcess) {
          if (item.step_number != null || item.description) {
            await CollegeCounsellingProcess.create({
              college_id: collegeId,
              step_number: item.step_number,
              description: item.description || null
            });
          }
        }
      }

      await CollegeProgram.deleteByCollegeId(collegeId);
      await resolveCollegePrograms(collegeId, collegePrograms);

      const resolvedExamIds = await resolveRecommendedExamIds(req.body);
      await CollegeRecommendedExam.setExamsForCollege(collegeId, resolvedExamIds);

      const college = await College.findById(collegeId);
      res.json({ success: true, data: { college }, message: 'College updated successfully' });
    } catch (error) {
      console.error('Error updating college:', error);
      res.status(500).json({ success: false, message: 'Failed to update college' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const college = await College.findById(parseInt(id));
      if (!college) {
        return res.status(404).json({ success: false, message: 'College not found' });
      }
      if (college.college_logo) {
        await deleteFromS3(college.college_logo);
      }
      await College.delete(parseInt(id));
      res.json({ success: true, message: 'College deleted successfully' });
    } catch (error) {
      console.error('Error deleting college:', error);
      res.status(500).json({ success: false, message: 'Failed to delete college' });
    }
  }

  static async deleteAll(req, res) {
    try {
      const all = await College.findAll();
      for (const c of all) {
        if (c.college_logo) await deleteFromS3(c.college_logo);
        await College.delete(c.id);
      }
      res.json({
        success: true,
        message: `All ${all.length} colleges deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting all colleges:', error);
      res.status(500).json({ success: false, message: 'Failed to delete all colleges' });
    }
  }

  static async downloadBulkTemplate(req, res) {
    try {
      const buf = await buildCollegesBulkTemplateBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=colleges-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  /** Legacy route: same workbook as colleges-bulk-template.xlsx (Colleges + Programs_catalog). */
  static async downloadProgramsExcelTemplate(req, res) {
    try {
      const buf = await buildCollegesBulkTemplateBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=colleges-programs-excel-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating programs Excel template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate programs template' });
    }
  }

  /** Download all colleges data as Excel (Super Admin only). Same columns as bulk template. */
  static async downloadAllExcel(req, res) {
    try {
      const colleges = await College.findAll();
      const headers = [
        'college_name', 'parent_university', 'state', 'city', 'college_location', 'college_type', 'major_program_names', 'website',
        'logo_url', 'college_description',
        'program_names', 'branch_courses', 'program_descriptions', 'program_duration_units', 'program_durations',
        'intake_capacities', 'previous_year_cutoff', 'expected_cutoff',
        'fee_per_semesters', 'total_fees',
        'counselling_processes', 'documents_requireds', 'placements', 'scholarships', 'recommended_exam_names',
        'contact_emails', 'contact_numbers', 'brochure_urls',
        'seat_matrix', 'key_dates'
      ];
      const rows = [headers];
      for (const c of colleges) {
        const [keyDates, docs, counselling, recExamIds, programs] = await Promise.all([
          CollegeKeyDates.findByCollegeId(c.id),
          CollegeDocumentsRequired.findByCollegeId(c.id),
          CollegeCounsellingProcess.findByCollegeId(c.id),
          CollegeRecommendedExam.getExamIdsByCollegeId(c.id),
          CollegeProgram.findByCollegeId(c.id)
        ]);
        const keyDatesStr = (keyDates && keyDates.length)
          ? keyDates.map((k) => `${k.event_name || ''}|${k.event_date ? String(k.event_date).slice(0, 10) : ''}`).filter((s) => s !== '|').join(';')
          : '';
        const docsStr = (docs && docs.length) ? docs.map((d) => d.document_name || '').filter(Boolean).join(';') : '';
        const counsellingStr = (counselling && counselling.length)
          ? counselling.map((x) => x.description || '').filter(Boolean).join(', ')
          : '';
        const recExamNames = [];
        for (const eid of recExamIds || []) {
          const ex = await Exam.findById(eid);
          if (ex && ex.name) recExamNames.push(ex.name);
        }
        const recNamesStr = recExamNames.join(';');
        const programNamesArr = [];
        const intakeArr = [];
        const durationArr = [];
        const branchCoursesArr = [];
        const programDescsArr = [];
        const durationUnitsArr = [];
        const feePerSemArr = [];
        const totalFeeArr = [];
        const counsellingArr = [];
        const documentsArr = [];
        const placementsArr = [];
        const scholarshipsArr = [];
        const progRecExamsArr = [];
        const contactEmailsArr = [];
        const contactNumbersArr = [];
        const brochureUrlsArr = [];
        const seatMatrixBlocks = [];
        const previousCutoffBlocks = [];
        const expectedCutoffBlocks = [];
        for (const p of programs || []) {
          const prog = await Program.findById(p.program_id);
          programNamesArr.push(prog && prog.name ? prog.name : String(p.program_id));
          intakeArr.push(p.intake_capacity != null ? String(p.intake_capacity) : '');
          durationArr.push(p.duration_years != null ? String(p.duration_years) : '');
          branchCoursesArr.push(p.branch_course || '');
          programDescsArr.push(p.program_description || '');
          durationUnitsArr.push(p.duration_unit || 'years');
          feePerSemArr.push(p.fee_per_semester != null ? String(p.fee_per_semester) : '');
          totalFeeArr.push(p.total_fee != null ? String(p.total_fee) : '');
          counsellingArr.push(p.counselling_process || '');
          documentsArr.push(p.documents_required || '');
          placementsArr.push(p.placement || '');
          scholarshipsArr.push(p.scholarship || '');
          contactEmailsArr.push(p.contact_email || '');
          contactNumbersArr.push(p.contact_number || '');
          brochureUrlsArr.push(p.brochure_url || '');
          if (p.recommended_exam_ids) {
            const eids = p.recommended_exam_ids.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
            const enames = [];
            for (const eid of eids) {
              const ex = await Exam.findById(eid);
              if (ex && ex.name) enames.push(ex.name);
            }
            progRecExamsArr.push(enames.join(', '));
          } else {
            progRecExamsArr.push('');
          }
          const [prevCutoffs, expCutoffs, seatMatrix] = await Promise.all([
            CollegePreviousCutoff.findByCollegeProgramId(p.id),
            CollegeExpectedCutoff.findByCollegeProgramId(p.id),
            CollegeSeatMatrix.findByCollegeProgramId(p.id)
          ]);
          seatMatrixBlocks.push(seatMatrix.map((s) => {
            if (s.branch && s.category) return `${s.branch}-${s.category}:${s.seat_count ?? ''}`;
            if (s.category) return `${s.category}:${s.seat_count ?? ''}`;
            return `${s.branch || ''}-${s.category || ''}:${s.seat_count ?? ''}`;
          }).filter(Boolean).join(','));
          const prevStrs = [];
          const prevByExamYear = new Map();
          for (const pc of prevCutoffs || []) {
            const key = `${pc.exam_id}|${pc.year ?? ''}`;
            if (!prevByExamYear.has(key)) prevByExamYear.set(key, []);
            prevByExamYear.get(key).push(pc);
          }
          for (const [key, pcs] of prevByExamYear) {
            const [examId, year] = key.split('|');
            const ex = await Exam.findById(examId);
            const en = ex && ex.name ? ex.name : examId;
            const pairStrs = pcs.map((p) => {
              if (p.branch && p.category) return `${p.branch}-${p.category}:${p.cutoff_rank ?? ''}`;
              return `${p.category || ''}:${p.cutoff_rank ?? ''}`;
            }).filter(Boolean);
            prevStrs.push(`${en}|${pairStrs.join(',')}|${year ?? ''}`);
          }
          previousCutoffBlocks.push(prevStrs.join('; '));
          const expStrs = [];
          const expByExamYear = new Map();
          for (const ec of expCutoffs || []) {
            const key = `${ec.exam_id}|${ec.year ?? ''}`;
            if (!expByExamYear.has(key)) expByExamYear.set(key, []);
            expByExamYear.get(key).push(ec);
          }
          for (const [key, ecs] of expByExamYear) {
            const [examId, year] = key.split('|');
            const ex = await Exam.findById(examId);
            const en = ex && ex.name ? ex.name : examId;
            const pairStrs = ecs.map((e) => {
              if (e.branch && e.category) return `${e.branch}-${e.category}:${e.expected_rank ?? ''}`;
              return `${e.category || ''}:${e.expected_rank ?? ''}`;
            }).filter(Boolean);
            expStrs.push(`${en}|${pairStrs.join(',')}|${year ?? ''}`);
          }
          expectedCutoffBlocks.push(expStrs.join('; '));
        }
        const collegeDetails = await CollegeDetails.findByCollegeId(c.id);
        const desc = collegeDetails && collegeDetails.college_description ? collegeDetails.college_description : '';
        const majorIds = collegeDetails && collegeDetails.major_program_ids ? collegeDetails.major_program_ids : '';
        let majorProgramNamesStr = '';
        if (majorIds) {
          const mids = majorIds.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
          const mnames = [];
          for (const mid of mids) {
            const mp = await Program.findById(mid);
            if (mp && mp.name) mnames.push(mp.name);
          }
          majorProgramNamesStr = mnames.join(', ');
        }
        rows.push([
          c.college_name || '',
          c.parent_university || '',
          c.state || '',
          c.city || '',
          c.college_location || '',
          c.college_type || '',
          majorProgramNamesStr,
          c.website || '',
          c.college_logo || '',
          desc,
          programNamesArr.join('; '),
          branchCoursesArr.join('; '),
          programDescsArr.join('; '),
          durationUnitsArr.join('; '),
          durationArr.join('; '),
          intakeArr.join('; '),
          previousCutoffBlocks.join('; '),
          expectedCutoffBlocks.join('; '),
          feePerSemArr.join('; '),
          totalFeeArr.join('; '),
          counsellingArr.join('; '),
          documentsArr.join('; '),
          placementsArr.join('; '),
          scholarshipsArr.join('; '),
          progRecExamsArr.join('; '),
          contactEmailsArr.join('; '),
          contactNumbersArr.join('; '),
          brochureUrlsArr.join('; '),
          seatMatrixBlocks.join('; '),
          keyDatesStr,
        ]);
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Colleges');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=colleges-all-data.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating colleges export:', error);
      res.status(500).json({ success: false, message: 'Failed to export colleges data' });
    }
  }

  /**
   * Queue async bulk upload — stores Excel on disk, returns job id immediately.
   * POST /api/admin/colleges/bulk-upload
   */
  static async bulkUpload(req, res) {
    try {
      const excelFile = req.files?.excel?.[0] || req.file;
      if (!excelFile || !excelFile.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Use field name "excel".',
        });
      }

      let workbook;
      try {
        workbook = XLSX.read(excelFile.buffer, { type: 'buffer', raw: true });
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid Excel file or format.' });
      }

      const normSheet = (n) => String(n).toLowerCase().replace(/\s+/g, '');
      const collegesSheetName =
        workbook.SheetNames.find((n) => normSheet(n) === 'colleges') || workbook.SheetNames[0];
      const sheet = workbook.Sheets[collegesSheetName];
      if (!sheet) {
        return res.status(400).json({ success: false, message: 'Excel has no valid sheet for colleges.' });
      }
      const dataRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (!dataRows.length) {
        return res.status(400).json({ success: false, message: 'Excel file has no data rows.' });
      }

      if (!fs.existsSync(COLLEGE_BULK_UPLOAD_DIR)) {
        fs.mkdirSync(COLLEGE_BULK_UPLOAD_DIR, { recursive: true });
      }

      const fileKey = randomUUID();
      const excelPath = path.join(COLLEGE_BULK_UPLOAD_DIR, `${fileKey}.xlsx`);
      fs.writeFileSync(excelPath, excelFile.buffer);

      const adminId = req.admin?.id ?? null;
      const uploadJob = await UploadJob.create({
        module: 'colleges',
        file_path: excelPath,
        thumbnails_zip_path: null,
        original_filename: excelFile.originalname || null,
        total_rows: dataRows.length,
        created_by_admin_id: adminId,
      });

      try {
        await enqueueCollegeBulkUploadJob(uploadJob.id);
      } catch (queueErr) {
        console.error('[colleges bulkUpload] queue error:', queueErr);
        try {
          if (fs.existsSync(excelPath)) fs.unlinkSync(excelPath);
        } catch (_) {}
        await UploadJob.update(uploadJob.id, {
          status: 'failed',
          error_message: queueErr.message || 'Queue unavailable',
        });
        return res.status(503).json({
          success: false,
          message:
            'Background job queue unavailable (Redis). Start Redis or configure REDIS_HOST / REDIS_PORT. ' +
            (queueErr.message || ''),
        });
      }

      return res.status(202).json({
        success: true,
        data: {
          jobId: String(uploadJob.id),
        },
        message: 'Bulk upload job queued. Poll GET /api/admin/colleges/upload-jobs/:id/status for progress.',
      });
    } catch (error) {
      console.error('Error starting colleges bulk upload job:', error);
      res.status(500).json({ success: false, message: error.message || 'Bulk upload failed' });
    }
  }

  /** GET /api/admin/colleges/upload-jobs/:id/status */
  static async getBulkUploadJobStatus(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid job id' });
      }
      const job = await UploadJob.findById(id);
      if (!job || job.module !== 'colleges') {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
      return res.json({
        success: true,
        data: {
          total: job.total_rows,
          processed: job.processed_rows,
          success: job.success_count,
          failed: job.failed_count,
          status: job.status,
          hookSummariesQueued: 0,
          errorMessage: job.error_message || null,
          originalFilename: job.original_filename,
        },
      });
    } catch (error) {
      console.error('colleges getBulkUploadJobStatus:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to load job status' });
    }
  }

  /** GET /api/admin/colleges/upload-jobs/:id/failures.csv */
  static async downloadBulkUploadFailuresCsv(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid job id' });
      }
      const job = await UploadJob.findById(id);
      if (!job || job.module !== 'colleges') {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
      const rows = await UploadJob.listFailedRowsForCsv(id);
      const lines = ['row_number,error_message'];
      for (const r of rows) {
        const msg = String(r.error_message || '').replace(/"/g, '""');
        lines.push(`${r.row_number},"${msg}"`);
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=college-bulk-job-${id}-failures.csv`);
      res.send(lines.join('\n'));
    } catch (error) {
      console.error('colleges downloadBulkUploadFailuresCsv:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to export CSV' });
    }
  }
}

module.exports = CollegesController;
