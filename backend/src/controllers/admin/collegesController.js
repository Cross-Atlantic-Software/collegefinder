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
const { buildLogoMapFromRequest, parseLogosFromZip, processMissingLogosFromZip } = require('../../utils/logoUploadUtils');
const { splitList, parseDate, getCell, normalizeEntityKey, countMapArrayValues } = require('../../utils/bulkUploadUtils');
const { resolveGoogleMapsLink, formatLocationLine } = require('../../services/googlePlacesMapsLink');

/**
 * Seat matrix, previous & expected cutoff strings — same format as one cell in the inline college row.
 */
async function addProgramCutoffsAndSeatMatrix(collegeProgramId, seatMatrixBlock, previousYearCutoffBlock, expectedCutoffBlock) {
  const seatMatrixRaw = (seatMatrixBlock ?? '').toString().trim();
  const previousYearCutoffRaw = (previousYearCutoffBlock ?? '').toString().trim();
  const expectedCutoffRaw = (expectedCutoffBlock ?? '').toString().trim();

  if (seatMatrixRaw) {
    const seatEntries = seatMatrixRaw.split(',').map((s) => s.trim());
    for (const ent of seatEntries) {
      if (!ent) continue;
      let branch = null;
      let category = null;
      let seat_count = null;
      let year = null;
      if (ent.includes(':')) {
        const [left, countPart] = ent.split(':').map((x) => x.trim());
        seat_count = countPart ? parseInt(countPart, 10) : null;
        if (left && left.includes('-')) {
          const dashIdx = left.lastIndexOf('-');
          branch = left.slice(0, dashIdx).trim() || null;
          category = left.slice(dashIdx + 1).trim() || null;
        } else {
          category = left || null;
        }
      } else if (ent.includes('|')) {
        const parts = ent.split('|').map((x) => x.trim());
        category = parts[0] || null;
        seat_count = parts[1] ? parseInt(parts[1], 10) : null;
        year = parts[2] ? parseInt(parts[2], 10) : null;
      }
      if (branch || category || seat_count || year) {
        await CollegeSeatMatrix.create({
          college_program_id: collegeProgramId,
          branch: branch || null,
          category: category || null,
          seat_count: isNaN(seat_count) ? null : seat_count,
          year: isNaN(year) ? null : year
        });
      }
    }
  }

  if (previousYearCutoffRaw) {
    const prevRecords = previousYearCutoffRaw.split(';').map((s) => s.trim());
    for (const rec of prevRecords) {
      if (!rec) continue;
      const parts = rec.split('|').map((x) => x.trim());
      const examName = parts[0];
      const yearStr = parts.length >= 3 ? parts[parts.length - 1] : '';
      const pairsRaw = parts.length >= 2 ? parts.slice(1, parts.length - 1).join('|') : parts[1] || '';
      const ex = examName ? await Exam.findByName(examName) : null;
      if (!ex) continue;
      if (pairsRaw.includes(':') && pairsRaw.includes('-')) {
        const pairStrs = pairsRaw.includes(',') ? pairsRaw.split(',') : [pairsRaw];
        for (const p of pairStrs) {
          const [left, rankStr] = p.trim().split(':').map((x) => x.trim());
          const cutoff_rank = rankStr ? parseInt(rankStr, 10) : null;
          let br = null;
          let category = null;
          if (left && left.includes('-')) {
            const dashIdx = left.lastIndexOf('-');
            br = left.slice(0, dashIdx).trim() || null;
            category = left.slice(dashIdx + 1).trim() || null;
          } else {
            category = left || null;
          }
          if (br || category || cutoff_rank) {
            await CollegePreviousCutoff.create({
              college_program_id: collegeProgramId,
              exam_id: ex.id,
              branch: br,
              category,
              cutoff_rank: isNaN(cutoff_rank) ? null : cutoff_rank,
              year: yearStr ? parseInt(yearStr, 10) : null
            });
          }
        }
      } else {
        const category = parts[1] || null;
        const cutoff_rank = parts[2] ? parseInt(parts[2], 10) : null;
        const yr = parts[3] ? parseInt(parts[3], 10) : null;
        await CollegePreviousCutoff.create({
          college_program_id: collegeProgramId,
          exam_id: ex.id,
          branch: null,
          category,
          cutoff_rank: isNaN(cutoff_rank) ? null : cutoff_rank,
          year: isNaN(yr) ? null : yr
        });
      }
    }
  }

  if (expectedCutoffRaw) {
    const expRecords = expectedCutoffRaw.split(';').map((s) => s.trim());
    for (const rec of expRecords) {
      if (!rec) continue;
      const parts = rec.split('|').map((x) => x.trim());
      const examName = parts[0];
      const yearStr = parts.length >= 3 ? parts[parts.length - 1] : '';
      const pairsRaw = parts.length >= 2 ? parts.slice(1, parts.length - 1).join('|') : parts[1] || '';
      const ex = examName ? await Exam.findByName(examName) : null;
      if (!ex) continue;
      if (pairsRaw.includes(':') && pairsRaw.includes('-')) {
        const pairStrs = pairsRaw.includes(',') ? pairsRaw.split(',') : [pairsRaw];
        for (const p of pairStrs) {
          const [left, rankStr] = p.trim().split(':').map((x) => x.trim());
          const expected_rank = rankStr ? parseInt(rankStr, 10) : null;
          let br = null;
          let category = null;
          if (left && left.includes('-')) {
            const dashIdx = left.lastIndexOf('-');
            br = left.slice(0, dashIdx).trim() || null;
            category = left.slice(dashIdx + 1).trim() || null;
          } else {
            category = left || null;
          }
          if (br || category || expected_rank) {
            await CollegeExpectedCutoff.create({
              college_program_id: collegeProgramId,
              exam_id: ex.id,
              branch: br,
              category,
              expected_rank: isNaN(expected_rank) ? null : expected_rank,
              year: yearStr ? parseInt(yearStr, 10) : null
            });
          }
        }
      } else {
        const category = parts[1] || null;
        const expected_rank = parts[2] ? parseInt(parts[2], 10) : null;
        const yr = parts[3] ? parseInt(parts[3], 10) : null;
        await CollegeExpectedCutoff.create({
          college_program_id: collegeProgramId,
          exam_id: ex.id,
          branch: null,
          category,
          expected_rank: isNaN(expected_rank) ? null : expected_rank,
          year: isNaN(yr) ? null : yr
        });
      }
    }
  }
}

function groupCollegeProgramRowsToMap(rows) {
  const map = new Map();
  if (!rows || !rows.length) return map;
  for (const row of rows) {
    const collegeName = getCell(row, 'college_name', 'college_Name');
    if (!collegeName) continue;
    const program_name = getCell(row, 'program_name', 'program_Name');
    if (!program_name) continue;
    const key = normalizeEntityKey(collegeName);
    if (!map.has(key)) map.set(key, []);
    const intakeRaw = getCell(row, 'intake_capacity', 'intake_Capacity');
    const durRaw = getCell(row, 'duration_years', 'duration_Years', 'program_durations');
    const feeSemRaw = getCell(row, 'fee_per_semester', 'fee_Per_Semester', 'fee_per_semesters');
    const totalFeeRaw = getCell(row, 'total_fee', 'total_Fee', 'total_fees');
    map.get(key).push({
      college_name: collegeName,
      program_name,
      branch_course: getCell(row, 'branch_course', 'branch_Course') || null,
      program_description: getCell(row, 'program_description', 'program_Description', 'program_descriptions') || null,
      duration_unit: getCell(row, 'program_duration_unit', 'program_Duration_Unit', 'duration_unit') || 'years',
      intake_capacity: intakeRaw !== '' ? parseInt(intakeRaw, 10) : null,
      duration_years: durRaw !== '' ? parseInt(durRaw, 10) : null,
      key_dates_summary: getCell(row, 'key_dates_summary', 'key_Dates_Summary', 'key_dates_summaries') || null,
      fee_per_semester: feeSemRaw !== '' ? parseFloat(feeSemRaw) : null,
      total_fee: totalFeeRaw !== '' ? parseFloat(totalFeeRaw) : null,
      placement: getCell(row, 'placement', 'placements') || null,
      scholarship: getCell(row, 'scholarship', 'scholarships') || null,
      counselling_process: getCell(row, 'counselling_process', 'counselling_Process', 'counselling_processes') || null,
      documents_required: getCell(row, 'documents_required', 'documents_Required', 'documents_requireds') || null,
      recommended_exam_names: getCell(row, 'recommended_exam_names', 'recommended_exam_Names') || null,
      contact_email: getCell(row, 'contact_email', 'contact_Email', 'contact_emails') || null,
      contact_number: getCell(row, 'contact_number', 'contact_Number', 'contact_numbers') || null,
      brochure_url: getCell(row, 'brochure_url', 'brochure_Url', 'brochure_urls') || null,
      seat_matrix: getCell(row, 'seat_matrix', 'seat_Matrix') || null,
      previous_year_cutoff: getCell(row, 'previous_year_cutoff', 'previous_year_Cutoff') || null,
      expected_cutoff: getCell(row, 'expected_cutoff', 'expected_Cutoff') || null
    });
  }
  return map;
}

function programSheetNorm(n) {
  return String(n).toLowerCase().replace(/\s+/g, '');
}

function isProgramsCatalogSheet(n) {
  const x = programSheetNorm(n);
  return x === 'programscatalog' || x === 'programs_catalog';
}

function isExcludedFromCollegeProgramsPick(n) {
  const x = programSheetNorm(n);
  return x === 'colleges' || x === 'institutes' || isProgramsCatalogSheet(n);
}

function loadGroupedProgramsFromWorkbook(workbook, opts = { dedicatedProgramsFile: false }) {
  if (!workbook?.SheetNames?.length) return new Map();
  const names = workbook.SheetNames;
  const norm = programSheetNorm;
  let sheetName = names.find((n) => {
    const x = norm(n);
    return x === 'collegeprograms' || x === 'college_programs';
  });
  if (!sheetName) {
    sheetName = names.find((n) => !isExcludedFromCollegeProgramsPick(n)) || null;
  }
  if (!sheetName && names.length === 1 && opts.dedicatedProgramsFile) {
    const only = names[0];
    sheetName = isExcludedFromCollegeProgramsPick(only) ? null : only;
  }
  if (!sheetName) return new Map();
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return new Map();
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  return groupCollegeProgramRowsToMap(rows);
}

function mergeGroupedProgramMaps(base, extra) {
  const out = new Map(base);
  for (const [k, arr] of extra) {
    if (!out.has(k)) out.set(k, []);
    out.get(k).push(...arr);
  }
  return out;
}

function programRowMatchesPickToken(token, row) {
  const t = String(token).trim();
  if (!t) return false;
  const pipe = t.indexOf('|');
  const pname = (pipe >= 0 ? t.slice(0, pipe) : t).trim().toLowerCase();
  const wantBranch = pipe >= 0 ? t.slice(pipe + 1).trim().toLowerCase() : '';
  if ((row.program_name || '').trim().toLowerCase() !== pname) return false;
  if (!wantBranch) return true;
  return (row.branch_course || '').trim().toLowerCase() === wantBranch;
}

async function createCollegeProgramFromSheetRow(collegeId, entry, errors, rowNum) {
  const prog = await Program.findByNameCaseInsensitive(entry.program_name);
  if (!prog) {
    errors.push({
      row: rowNum,
      message: `Unknown program name "${entry.program_name}" (CollegePrograms sheet for "${entry.college_name}")`
    });
    return;
  }
  let branchId = null;
  const branchNameExcel = entry.branch_course ? String(entry.branch_course).trim() : '';
  if (branchNameExcel) {
    const branch = await Branch.findByNameCaseInsensitive(branchNameExcel);
    if (branch) branchId = branch.id;
  }
  let progRecommendedExamIds = null;
  if (entry.recommended_exam_names) {
    const enames = String(entry.recommended_exam_names)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const eids = [];
    for (const en of enames) {
      const ex = await Exam.findByName(en);
      if (ex) eids.push(ex.id);
    }
    if (eids.length > 0) progRecommendedExamIds = eids.join(',');
  }
  const intake_capacity = entry.intake_capacity != null && !Number.isNaN(entry.intake_capacity) ? entry.intake_capacity : null;
  const duration_years = entry.duration_years != null && !Number.isNaN(entry.duration_years) ? entry.duration_years : null;
  const feePs = entry.fee_per_semester != null && !Number.isNaN(entry.fee_per_semester) ? entry.fee_per_semester : null;
  const totalFee = entry.total_fee != null && !Number.isNaN(entry.total_fee) ? entry.total_fee : null;
  const cp = await CollegeProgram.create({
    college_id: collegeId,
    program_id: prog.id,
    intake_capacity,
    duration_years,
    branch_id: branchId,
    branch_course: entry.branch_course || null,
    program_description: entry.program_description || null,
    duration_unit: entry.duration_unit || 'years',
    key_dates_summary: entry.key_dates_summary || null,
    fee_per_semester: feePs,
    total_fee: totalFee,
    placement: entry.placement || null,
    scholarship: entry.scholarship || null,
    counselling_process: entry.counselling_process || null,
    documents_required: entry.documents_required || null,
    recommended_exam_ids: progRecommendedExamIds,
    contact_email: entry.contact_email || null,
    contact_number: entry.contact_number || null,
    brochure_url: entry.brochure_url || null
  });
  if (cp && cp.id) {
    await addProgramCutoffsAndSeatMatrix(cp.id, entry.seat_matrix, entry.previous_year_cutoff, entry.expected_cutoff);
  }
}

async function insertCollegeProgramsFromBucket(collegeId, bucket, pickTokens, errors, rowNum) {
  if (!bucket || !bucket.length) return;
  let toInsert = bucket;
  if (pickTokens && pickTokens.length > 0) {
    const picked = [];
    const missingToks = [];
    for (const tok of pickTokens) {
      const t = String(tok).trim();
      if (!t) continue;
      const matches = bucket.filter((b) => programRowMatchesPickToken(t, b));
      if (!matches.length) missingToks.push(tok);
      else for (const m of matches) if (!picked.includes(m)) picked.push(m);
    }
    if (picked.length > 0) {
      toInsert = picked;
      for (const tok of missingToks) {
        errors.push({
          row: rowNum,
          message: `program_names selector "${tok}" has no matching row in CollegePrograms for this college`
        });
      }
    } else {
      toInsert = bucket;
      if (missingToks.length) {
        errors.push({
          row: rowNum,
          message:
            'program_names / bulk_program_names did not match any row in the programs sheet for this college; all program rows from the sheet were attached instead.'
        });
      }
    }
  }
  for (const e of toInsert) {
    await createCollegeProgramFromSheetRow(collegeId, e, errors, rowNum);
  }
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

class CollegesController {
  static async getAllAdmin(req, res) {
    try {
      const colleges = await College.findAll();
      res.json({ success: true, data: { colleges } });
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
        logo_filename,
        college_description,
        website,
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
      const google_map_link = await resolveGoogleMapsLink({
        name: college_name.trim(),
        city: cityTrim,
        state: stateTrim
      });

      const college = await College.create({
        college_name: college_name.trim(),
        college_location,
        college_type: college_type || null,
        college_logo: college_logo || null,
        logo_filename: logo_filename ? String(logo_filename).trim() || null : null,
        google_map_link,
        website: website ? website.trim() : null,
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
        logo_filename,
        college_description,
        website,
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

      if (college_logo && college_logo !== existing.college_logo && existing.college_logo) {
        await deleteFromS3(existing.college_logo);
      }

      const hasStateKey = Object.prototype.hasOwnProperty.call(req.body, 'state');
      const hasCityKey = Object.prototype.hasOwnProperty.call(req.body, 'city');
      const finalName = college_name !== undefined ? college_name.trim() : existing.college_name;

      const updatePayload = {
        college_name: college_name !== undefined ? college_name.trim() : undefined,
        college_type: college_type !== undefined ? college_type || null : undefined,
        college_logo: college_logo !== undefined ? college_logo : undefined,
        logo_filename: logo_filename !== undefined ? (logo_filename ? String(logo_filename).trim() || null : null) : undefined,
        website: website !== undefined ? (website ? website.trim() : null) : undefined
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
        updatePayload.google_map_link = await resolveGoogleMapsLink({
          name: finalName,
          city: cityTrim,
          state: stateTrim
        });
      } else if (
        college_name !== undefined &&
        finalName !== existing.college_name &&
        existing.state &&
        existing.city
      ) {
        updatePayload.google_map_link = await resolveGoogleMapsLink({
          name: finalName,
          city: existing.city,
          state: existing.state
        });
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
      const headers = [
        'college_name',
        'state',
        'city',
        'college_type',
        'website',
        'logo_filename',
        'college_description',
        'program_names',
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
          'Delhi',
          'New Delhi',
          'Central,State',
          'https://www.iitd.ac.in',
          'iit_delhi.png',
          'Premier engineering institute.',
          'B.Tech; M.Tech',
          'Admission Start|2025-01-01, Last Date|2025-02-28',
          'Aadhar, Marksheet, Photo',
          'JOSAA counselling',
          'JEE Advanced, JEE Main',
        ],
        [
          'State College of Engineering',
          'Maharashtra',
          'Mumbai City',
          'State',
          'https://www.sce.ac.in',
          'state_eng.png',
          'State level engineering college.',
          'B.Tech',
          'Application Start|2025-02-01',
          'Marksheet',
          'State counselling',
          'JEE Main',
        ]
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Colleges');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=colleges-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  /**
   * Optional programs_excel: CollegePrograms sheet + programs taxonomy (exact program_name strings).
   * Download separately from colleges-bulk-template.xlsx.
   */
  static async downloadProgramsExcelTemplate(req, res) {
    try {
      const collegeProgramsHeaders = [
        'college_name',
        'program_name',
        'branch_course',
        'program_description',
        'program_duration_unit',
        'duration_years',
        'intake_capacity',
        'previous_year_cutoff',
        'expected_cutoff',
        'key_dates_summary',
        'fee_per_semester',
        'total_fee',
        'counselling_process',
        'documents_required',
        'placement',
        'scholarship',
        'recommended_exam_names',
        'contact_email',
        'contact_number',
        'brochure_url',
        'seat_matrix'
      ];
      const wb = XLSX.utils.book_new();
      const wsPrograms = XLSX.utils.aoa_to_sheet([
        collegeProgramsHeaders,
        [
          'State College of Engineering',
          'B.Tech',
          'Computer Science',
          'Undergraduate engineering program',
          'years',
          '4',
          '100',
          'JEE Main|CSE-GEN:2000|2024',
          'JEE Main|CSE-GEN:1800|2025',
          'Applications open Feb 2025',
          '80000',
          '320000',
          'State counselling',
          'Marksheet',
          'Average 6 LPA',
          'SC/ST fee waiver',
          'JEE Main',
          'admissions@sce.ac.in',
          '022-12345678',
          'https://sce.ac.in/brochure.pdf',
          'CSE-general:80, CSE-OBC:20'
        ]
      ]);
      XLSX.utils.book_append_sheet(wb, wsPrograms, 'CollegePrograms');

      const programs = await Program.findAll();
      const catalogRows = [
        ['program_id', 'program_name', 'stream', 'interest_labels'],
        ['', 'Use program_name in CollegePrograms; list which programs attach on the Colleges sheet in program_names only.', '', ''],
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

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
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
        'college_name', 'state', 'city', 'college_location', 'google_map_link', 'college_type', 'major_program_names', 'website',
        'logo_filename', 'college_description', 'bulk_program_names',
        'program_names', 'branch_courses', 'program_descriptions', 'program_duration_units', 'program_durations',
        'intake_capacities', 'previous_year_cutoff', 'expected_cutoff',
        'key_dates_summaries', 'fee_per_semesters', 'total_fees',
        'counselling_processes', 'documents_requireds', 'placements', 'scholarships', 'recommended_exam_names',
        'contact_emails', 'contact_numbers', 'brochure_urls',
        'seat_matrix', 'key_dates'
      ];
      const rows = [headers];
      const programExportRows = [
        [
          'college_name',
          'program_name',
          'branch_course',
          'program_description',
          'program_duration_unit',
          'duration_years',
          'intake_capacity',
          'previous_year_cutoff',
          'expected_cutoff',
          'key_dates_summary',
          'fee_per_semester',
          'total_fee',
          'counselling_process',
          'documents_required',
          'placement',
          'scholarship',
          'recommended_exam_names',
          'contact_email',
          'contact_number',
          'brochure_url',
          'seat_matrix'
        ]
      ];
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
        const keyDatesSummariesArr = [];
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
          keyDatesSummariesArr.push(p.key_dates_summary || '');
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
          const seatStr = seatMatrixBlocks[seatMatrixBlocks.length - 1];
          const prevStr = previousCutoffBlocks[previousCutoffBlocks.length - 1];
          const expStr = expectedCutoffBlocks[expectedCutoffBlocks.length - 1];
          const progRecStr = progRecExamsArr[progRecExamsArr.length - 1];
          programExportRows.push([
            c.college_name || '',
            prog && prog.name ? prog.name : String(p.program_id),
            p.branch_course || '',
            p.program_description || '',
            p.duration_unit || 'years',
            p.duration_years != null ? String(p.duration_years) : '',
            p.intake_capacity != null ? String(p.intake_capacity) : '',
            prevStr,
            expStr,
            p.key_dates_summary || '',
            p.fee_per_semester != null ? String(p.fee_per_semester) : '',
            p.total_fee != null ? String(p.total_fee) : '',
            p.counselling_process || '',
            p.documents_required || '',
            p.placement || '',
            p.scholarship || '',
            progRecStr,
            p.contact_email || '',
            p.contact_number || '',
            p.brochure_url || '',
            seatStr
          ]);
        }
        const logoFilename = (c.college_logo && typeof c.college_logo === 'string' && c.college_logo.split('/').pop()) ? c.college_logo.split('/').pop() : '';
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
          c.state || '',
          c.city || '',
          c.college_location || '',
          c.google_map_link || '',
          c.college_type || '',
          majorProgramNamesStr,
          c.website || '',
          logoFilename,
          desc,
          '',
          programNamesArr.join('; '),
          branchCoursesArr.join('; '),
          programDescsArr.join('; '),
          durationUnitsArr.join('; '),
          durationArr.join('; '),
          intakeArr.join('; '),
          previousCutoffBlocks.join('; '),
          expectedCutoffBlocks.join('; '),
          keyDatesSummariesArr.join('; '),
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
      const wsPrograms = XLSX.utils.aoa_to_sheet(programExportRows);
      XLSX.utils.book_append_sheet(wb, wsPrograms, 'CollegePrograms');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=colleges-all-data.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating colleges export:', error);
      res.status(500).json({ success: false, message: 'Failed to export colleges data' });
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
        findRecordsByFilename: (f) => College.findMissingLogosByFilename(f),
        uploadToS3,
        s3Folder: 'college-logos',
        logoColumn: 'college_logo',
        updateRecord: (id, data) => College.update(id, data),
        toResultItem: (r) => ({ id: r.id, college_name: r.college_name, logo_filename: r.logo_filename })
      });
      res.json({
        success: true,
        data: result,
        message: `Added ${result.updated.length} logo(s). ${result.skipped.length} file(s) had no matching colleges.`
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
    const validTypes = ['Central', 'State', 'Private', 'Deemed'];
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

      let programGrouped = loadGroupedProgramsFromWorkbook(workbook, { dedicatedProgramsFile: false });
      const programsExcelFile = req.files?.programs_excel?.[0];
      let dedicatedProgramsRowCount = 0;
      if (programsExcelFile?.buffer) {
        try {
          const wbProg = XLSX.read(programsExcelFile.buffer, { type: 'buffer', raw: true });
          const fromDedicated = loadGroupedProgramsFromWorkbook(wbProg, { dedicatedProgramsFile: true });
          dedicatedProgramsRowCount = countMapArrayValues(fromDedicated);
          programGrouped = mergeGroupedProgramMaps(programGrouped, fromDedicated);
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Invalid programs Excel file or format.' });
        }
      }

      const normSheet = (n) => String(n).toLowerCase().replace(/\s+/g, '');
      const collegesSheetName =
        workbook.SheetNames.find((n) => normSheet(n) === 'colleges') || workbook.SheetNames[0];
      const sheet = workbook.Sheets[collegesSheetName];
      if (!sheet) {
        return res.status(400).json({ success: false, message: 'Excel has no valid sheet for colleges.' });
      }
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
        const name = (row.college_name ?? row.college_Name ?? '').toString().trim();
        if (!name) {
          errors.push({ row: rowNum, message: 'college_name is required' });
          continue;
        }
        if (namesInFile.has(name.toLowerCase())) {
          errors.push({ row: rowNum, message: `duplicate name "${name}" in this file` });
          continue;
        }
        const existing = await College.findByName(name);
        if (existing) {
          errors.push({ row: rowNum, message: `college "${name}" already exists` });
          continue;
        }

        const stateTrim = getCell(row, 'state', 'State');
        const cityTrim = getCell(row, 'city', 'City');
        if (!stateTrim || !cityTrim) {
          errors.push({ row: rowNum, message: 'state and city are required' });
          continue;
        }
        const location = formatLocationLine(cityTrim, stateTrim);
        const googleMapLink = await resolveGoogleMapsLink({
          name,
          city: cityTrim,
          state: stateTrim
        });
        const typeRaw = (row.college_type ?? row.college_Type ?? '').toString().trim();
        const typeParts = typeRaw.split(',').map(s => s.trim()).filter(Boolean);
        const collegeType = typeParts.length > 0 ? typeParts.filter(t => validTypes.find(v => v.toLowerCase() === t.toLowerCase())).map(t => validTypes.find(v => v.toLowerCase() === t.toLowerCase())).join(',') : null;
        const logoFilename = (row.logo_filename ?? row.logo_Filename ?? '').toString().trim();
        const description = (row.college_description ?? row.college_Description ?? '').toString().trim() || null;
        const websiteVal = (row.website ?? '').toString().trim() || null;
        const majorProgramNamesRaw = (row.major_program_names ?? '').toString().trim();

        const keyDatesRaw = (row.key_dates ?? row.key_Dates ?? '').toString().trim();
        const documentsRaw = (row.documents_required ?? row.documents_Required ?? '').toString().trim();
        const counsellingRaw = (row.counselling_process ?? row.counselling_Process ?? '').toString().trim();
        const recommendedExamNamesRaw = (row.recommended_exam_names ?? row.recommended_exam_Names ?? '').toString().trim();
        const recommendedExamIdsRaw = (row.recommended_exam_ids ?? row.recommended_exam_Ids ?? '').toString().trim();
        const bulkProgramNamesRaw = getCell(row, 'bulk_program_names', 'bulk_Program_Names');
        const programNamesRaw = (row.program_names ?? row.program_Names ?? '').toString().trim();
        const programPickTokens = splitList(bulkProgramNamesRaw).length
          ? splitList(bulkProgramNamesRaw)
          : splitList(programNamesRaw);
        const programIdsRaw = (row.program_ids ?? row.program_Ids ?? '').toString().trim();
        const intakeCapacitiesRaw = (row.intake_capacities ?? row.intake_Capacities ?? '').toString().trim();
        const programDurationsRaw = (row.program_durations ?? row.program_Durations ?? '').toString().trim();
        const seatMatrixRaw = (row.seat_matrix ?? row.seat_Matrix ?? '').toString().trim();
        const previousYearCutoffRaw = (row.previous_year_cutoff ?? row.previous_year_Cutoff ?? '').toString().trim();
        const expectedCutoffRaw = (row.expected_cutoff ?? row.expected_Cutoff ?? '').toString().trim();

        const branchCoursesRaw = (row.branch_courses ?? '').toString().trim();
        const programDescriptionsRaw = (row.program_descriptions ?? '').toString().trim();
        const programDurationUnitsRaw = (row.program_duration_units ?? '').toString().trim();
        const keyDatesSummariesRaw = (row.key_dates_summaries ?? '').toString().trim();
        const feePerSemestersRaw = (row.fee_per_semesters ?? '').toString().trim();
        const totalFeesRaw = (row.total_fees ?? '').toString().trim();
        const counsellingProcessesRaw = (row.counselling_processes ?? '').toString().trim();
        const documentsRequiredsRaw = (row.documents_requireds ?? '').toString().trim();
        const placementsRaw = (row.placements ?? '').toString().trim();
        const scholarshipsRaw = (row.scholarships ?? '').toString().trim();
        const contactEmailsRaw = (row.contact_emails ?? '').toString().trim();
        const contactNumbersRaw = (row.contact_numbers ?? '').toString().trim();
        const brochureUrlsRaw = (row.brochure_urls ?? '').toString().trim();

        let collegeLogoUrl = null;
        if (logoFilename) {
          const logoFile = logoMap.get(logoFilename.toLowerCase());
          if (logoFile && logoFile.buffer) {
            try {
              collegeLogoUrl = await uploadToS3(logoFile.buffer, logoFile.originalname || logoFilename, 'college-logos');
            } catch (uploadErr) {
              errors.push({ row: rowNum, message: `logo upload failed for "${logoFilename}": ${uploadErr.message}` });
            }
          }
          // If logo file not found: still create college with logo_filename stored; user can upload missing logos later
        }

        try {
          const college = await College.create({
            college_name: name,
            college_location: location,
            college_type: collegeType,
            college_logo: collegeLogoUrl,
            logo_filename: logoFilename || null,
            google_map_link: googleMapLink,
            website: websiteVal,
            state: stateTrim,
            city: cityTrim
          });
          let majorProgramIdsStr = null;
          if (majorProgramNamesRaw) {
            const mpNames = splitList(majorProgramNamesRaw);
            const mpIds = [];
            for (const mpn of mpNames) {
              const mp = await Program.findByName(mpn.trim());
              if (mp) mpIds.push(mp.id);
            }
            if (mpIds.length > 0) majorProgramIdsStr = mpIds.join(',');
          }
          if (description || majorProgramIdsStr) {
            await CollegeDetails.create({ college_id: college.id, college_description: description, major_program_ids: majorProgramIdsStr });
          }
          if (keyDatesRaw) {
            const parts = splitList(keyDatesRaw);
            for (const part of parts) {
              const [event_name, event_dateRaw] = part.split('|').map((s) => s.trim());
              const event_date = event_dateRaw ? parseDate(event_dateRaw) : null;
              if (event_name || event_date) {
                await CollegeKeyDates.create({
                  college_id: college.id,
                  event_name: event_name || null,
                  event_date: event_date || null
                });
              }
            }
          }
          if (documentsRaw) {
            const docs = splitList(documentsRaw);
            for (const doc of docs) {
              await CollegeDocumentsRequired.create({ college_id: college.id, document_name: doc });
            }
          }
          if (counsellingRaw) {
            const parts = splitList(counsellingRaw);
            const descriptions = parts.map((p) => {
              const m = p.match(/^\d+\s*\|?\s*(.*)$/);
              return m ? m[1].trim() : p.trim();
            }).filter(Boolean);
            const singleDesc = descriptions.length ? descriptions.join(', ') : counsellingRaw.trim();
            if (singleDesc) {
              await CollegeCounsellingProcess.create({
                college_id: college.id,
                step_number: null,
                description: singleDesc
              });
            }
          }
          let recExamIds = [];
          if (recommendedExamNamesRaw) {
            const names = splitList(recommendedExamNamesRaw);
            for (const nm of names) {
              const ex = await Exam.findByName(nm);
              if (ex) recExamIds.push(ex.id);
            }
          }
          if (recExamIds.length === 0 && recommendedExamIdsRaw) {
            recExamIds = recommendedExamIdsRaw.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
          }
          if (recExamIds.length) await CollegeRecommendedExam.setExamsForCollege(college.id, recExamIds);

          const programNames = programNamesRaw ? splitList(programNamesRaw) : [];
          const programIds = programIdsRaw ? programIdsRaw.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n)) : [];
          const intakeCapacities = intakeCapacitiesRaw ? splitList(intakeCapacitiesRaw) : [];
          const programDurations = programDurationsRaw ? splitList(programDurationsRaw) : [];
          const seatMatrixBlocks = seatMatrixRaw ? seatMatrixRaw.split(';').map((s) => s.trim()) : [];
          const previousCutoffBlocks = previousYearCutoffRaw ? previousYearCutoffRaw.split(';').map((s) => s.trim()) : [];
          const expectedCutoffBlocks = expectedCutoffRaw ? expectedCutoffRaw.split(';').map((s) => s.trim()) : [];

          const branchCourses = branchCoursesRaw ? splitList(branchCoursesRaw) : [];
          const programDescriptions = programDescriptionsRaw ? splitList(programDescriptionsRaw) : [];
          const programDurationUnits = programDurationUnitsRaw ? splitList(programDurationUnitsRaw) : [];
          const keyDatesSummaries = keyDatesSummariesRaw ? splitList(keyDatesSummariesRaw) : [];
          const feePerSemesters = feePerSemestersRaw ? splitList(feePerSemestersRaw) : [];
          const totalFees = totalFeesRaw ? splitList(totalFeesRaw) : [];
          const counsellingProcesses = counsellingProcessesRaw ? splitList(counsellingProcessesRaw) : [];
          const documentsRequireds = documentsRequiredsRaw ? splitList(documentsRequiredsRaw) : [];
          const placements = placementsRaw ? splitList(placementsRaw) : [];
          const scholarships = scholarshipsRaw ? splitList(scholarshipsRaw) : [];
          const contactEmails = contactEmailsRaw ? splitList(contactEmailsRaw) : [];
          const contactNumbers = contactNumbersRaw ? splitList(contactNumbersRaw) : [];
          const brochureUrls = brochureUrlsRaw ? splitList(brochureUrlsRaw) : [];
          const recExamNamesByProg = recommendedExamNamesRaw ? splitList(recommendedExamNamesRaw) : [];

          const programBucket = programGrouped.get(normalizeEntityKey(name)) || [];
          if (programBucket.length > 0) {
            await insertCollegeProgramsFromBucket(
              college.id,
              programBucket,
              programPickTokens,
              errors,
              rowNum
            );
          } else {
          const numPrograms = Math.max(programNames.length, programIds.length);
          for (let idx = 0; idx < numPrograms; idx++) {
            let programId = programIds[idx] != null ? parseInt(programIds[idx], 10) : null;
            if ((!programId || isNaN(programId)) && programNames[idx]) {
              const prog = await Program.findByNameCaseInsensitive(programNames[idx].trim());
              if (prog) programId = prog.id;
            }
            if (!programId) continue;
            const intakeVal = intakeCapacities[idx];
            const intake_capacity = intakeVal ? parseInt(intakeVal, 10) : null;
            const durVal = programDurations[idx];
            const duration_years = durVal ? parseInt(durVal, 10) : null;
            let progRecommendedExamIds = null;
            const progRecExamNamesStr = recExamNamesByProg[idx];
            if (progRecExamNamesStr) {
              const enames = progRecExamNamesStr.split(',').map(s => s.trim()).filter(Boolean);
              const eids = [];
              for (const en of enames) {
                const ex = await Exam.findByName(en);
                if (ex) eids.push(ex.id);
              }
              if (eids.length > 0) progRecommendedExamIds = eids.join(',');
            }
            const branchNameExcel = branchCourses[idx] ? String(branchCourses[idx]).trim() : '';
            let branchId = null;
            if (branchNameExcel) {
              const branch = await Branch.findByNameCaseInsensitive(branchNameExcel);
              if (branch) branchId = branch.id;
            }
            const cp = await CollegeProgram.create({
              college_id: college.id,
              program_id: programId,
              intake_capacity: isNaN(intake_capacity) ? null : intake_capacity,
              duration_years: isNaN(duration_years) ? null : duration_years,
              branch_id: branchId,
              branch_course: branchCourses[idx] || null,
              program_description: programDescriptions[idx] || null,
              duration_unit: programDurationUnits[idx] || 'years',
              key_dates_summary: keyDatesSummaries[idx] || null,
              fee_per_semester: feePerSemesters[idx] ? parseFloat(feePerSemesters[idx]) : null,
              total_fee: totalFees[idx] ? parseFloat(totalFees[idx]) : null,
              placement: placements[idx] || null,
              scholarship: scholarships[idx] || null,
              counselling_process: counsellingProcesses[idx] || null,
              documents_required: documentsRequireds[idx] || null,
              recommended_exam_ids: progRecommendedExamIds,
              contact_email: contactEmails[idx] || null,
              contact_number: contactNumbers[idx] || null,
              brochure_url: brochureUrls[idx] || null
            });
            if (cp && cp.id) {
              await addProgramCutoffsAndSeatMatrix(
                cp.id,
                seatMatrixBlocks[idx] || '',
                previousCutoffBlocks[idx] || '',
                expectedCutoffBlocks[idx] || ''
              );
            }
          }
          }
          created.push({ id: college.id, name: college.college_name });
          namesInFile.add(name.toLowerCase());
        } catch (createErr) {
          errors.push({ row: rowNum, message: createErr.message || 'Failed to create college' });
        }
      }

      const createdNamesLower = new Set(created.map((c) => normalizeEntityKey(c.name)));
      const programSheetWarnings = [];
      if (programsExcelFile?.buffer && dedicatedProgramsRowCount === 0) {
        programSheetWarnings.push(
          'A programs Excel file was received, but no program rows were read from it. Use a sheet named CollegePrograms (or college_programs) with college_name and program_name on each data row. The Programs_catalog sheet is reference-only and is not imported as programs.'
        );
      }
      for (const [key, arr] of programGrouped) {
        if (!createdNamesLower.has(key) && arr.length) {
          const label = arr[0].college_name || key;
          programSheetWarnings.push(
            `CollegePrograms data references "${label}" but that college was not created in this upload (${arr.length} program row(s)).`
          );
        }
      }

      res.json({
        success: true,
        data: {
          created: created.length,
          createdColleges: created,
          errors: errors.length,
          errorDetails: errors,
          programSheetWarnings
        },
        message: `Created ${created.length} college(s).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`
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

module.exports = CollegesController;
