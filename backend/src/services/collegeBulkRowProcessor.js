/**
 * One-row processor for async colleges bulk Excel upload (shared with worker).
 */
const College = require('../models/college/College');
const CollegeDetails = require('../models/college/CollegeDetails');
const CollegeProgram = require('../models/college/CollegeProgram');
const CollegePreviousCutoff = require('../models/college/CollegePreviousCutoff');
const CollegeExpectedCutoff = require('../models/college/CollegeExpectedCutoff');
const CollegeSeatMatrix = require('../models/college/CollegeSeatMatrix');
const CollegeKeyDates = require('../models/college/CollegeKeyDates');
const CollegeDocumentsRequired = require('../models/college/CollegeDocumentsRequired');
const CollegeCounsellingProcess = require('../models/college/CollegeCounsellingProcess');
const CollegeRecommendedExam = require('../models/college/CollegeRecommendedExam');
const Program = require('../models/taxonomy/Program');
const Branch = require('../models/taxonomy/Branch');
const Exam = require('../models/taxonomy/Exam');
const { splitList, parseDate, getCell, splitProgramBlocks } = require('../utils/bulkUploadUtils');
const { formatLocationLine } = require('./googlePlacesMapsLink');
const { normalizeCollegeLogoFields } = require('../utils/collegeLogoFields');

const VALID_TYPES = ['Central', 'State', 'Private', 'Deemed'];

/**
 * Seat matrix, previous & expected cutoff strings — same format as one cell in the inline college row.
 */
async function addProgramCutoffsAndSeatMatrix(
  collegeProgramId,
  seatMatrixBlock,
  previousYearCutoffBlock,
  expectedCutoffBlock
) {
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
          year: isNaN(year) ? null : year,
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
              year: yearStr ? parseInt(yearStr, 10) : null,
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
          year: isNaN(yr) ? null : yr,
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
              year: yearStr ? parseInt(yearStr, 10) : null,
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
          year: isNaN(yr) ? null : yr,
        });
      }
    }
  }
}

/**
 * Duplicate names within the same Excel sheet are detected in the worker (first row wins).
 *
 * @param {{ row: object, rowNum: number }} args
 * @returns {Promise<{ ok: true, college: object } | { ok: false, error: string }>}
 */
async function processCollegeBulkRow({ row, rowNum }) {
  const name = (row.college_name ?? row.college_Name ?? '').toString().trim();
  if (!name) {
    return { ok: false, error: 'college_name is required' };
  }

  const existing = await College.findByName(name);
  if (existing) {
    return {
      ok: false,
      error: `College "${name}" already exists in the database (imported earlier or created outside this upload). Remove this row or fix college_name.`,
    };
  }

  const stateTrim = getCell(row, 'state', 'State');
  const cityTrim = getCell(row, 'city', 'City');
  if (!stateTrim || !cityTrim) {
    return { ok: false, error: 'state and city are required' };
  }
  const location = formatLocationLine(cityTrim, stateTrim);
  const typeRaw = (row.college_type ?? row.college_Type ?? '').toString().trim();
  const typeParts = typeRaw.split(',').map((s) => s.trim()).filter(Boolean);
  const collegeType =
    typeParts.length > 0
      ? typeParts
          .filter((t) => VALID_TYPES.find((v) => v.toLowerCase() === t.toLowerCase()))
          .map((t) => VALID_TYPES.find((v) => v.toLowerCase() === t.toLowerCase()))
          .join(',')
      : null;
  const logoUrlRaw = getCell(row, 'logo_url', 'Logo URL') || getCell(row, 'logo_filename', 'logo_Filename');
  const logoFields = normalizeCollegeLogoFields(logoUrlRaw || null);
  const description = (row.college_description ?? row.college_Description ?? '').toString().trim() || null;
  const websiteVal = (row.website ?? '').toString().trim() || null;
  const parentUniversityVal = getCell(row, 'parent_university', 'Parent university');
  const majorProgramNamesRaw = (row.major_program_names ?? '').toString().trim();

  const keyDatesRaw = (row.key_dates ?? row.key_Dates ?? '').toString().trim();
  const documentsRaw = (row.documents_required ?? row.documents_Required ?? '').toString().trim();
  const counsellingRaw = (row.counselling_process ?? row.counselling_Process ?? '').toString().trim();
  const recommendedExamNamesRaw = (row.recommended_exam_names ?? row.recommended_exam_Names ?? '').toString().trim();
  const recommendedExamIdsRaw = (row.recommended_exam_ids ?? row.recommended_exam_Ids ?? '').toString().trim();
  const programNamesRaw = (row.program_names ?? row.program_Names ?? '').toString().trim();
  const programIdsRaw = (row.program_ids ?? row.program_Ids ?? '').toString().trim();
  const intakeCapacitiesRaw = getCell(row, 'intake_capacities', 'Intake capacities');
  const programDurationsRaw = getCell(row, 'program_durations', 'Program durations');
  const seatMatrixRaw = getCell(row, 'seat_matrix', 'Seat matrix');
  const previousYearCutoffRaw = getCell(row, 'previous_year_cutoff', 'Previous year cutoff');
  const expectedCutoffRaw = getCell(row, 'expected_cutoff', 'Expected cutoff');

  const branchCoursesRaw = (row.branch_courses ?? '').toString().trim();
  const programDescriptionsRaw = (row.program_descriptions ?? '').toString().trim();
  const programDurationUnitsRaw = (row.program_duration_units ?? '').toString().trim();
  const feePerSemestersRaw = (row.fee_per_semesters ?? '').toString().trim();
  const totalFeesRaw = (row.total_fees ?? '').toString().trim();
  const counsellingProcessesRaw = (row.counselling_processes ?? '').toString().trim();
  const documentsRequiredsRaw = (row.documents_requireds ?? '').toString().trim();
  const placementsRaw = (row.placements ?? '').toString().trim();
  const scholarshipsRaw = (row.scholarships ?? '').toString().trim();
  const contactEmailsRaw = (row.contact_emails ?? '').toString().trim();
  const contactNumbersRaw = (row.contact_numbers ?? '').toString().trim();
  const brochureUrlsRaw = (row.brochure_urls ?? '').toString().trim();

  const programNamesList = programNamesRaw ? splitList(programNamesRaw) : [];
  const programIdsRawParts = programIdsRaw ? programIdsRaw.split(',').map((s) => s.trim()) : [];
  const numProgramsSlots = Math.max(programNamesList.length, programIdsRawParts.length);

  if (majorProgramNamesRaw) {
    const mpNames = splitList(majorProgramNamesRaw);
    const mpNotFound = [];
    for (const mpn of mpNames) {
      const mp =
        (await Program.findByNameCaseInsensitive(mpn.trim())) || (await Program.findByName(mpn.trim()));
      if (!mp) mpNotFound.push(mpn.trim());
    }
    if (mpNotFound.length) {
      return { ok: false, error: `Major program(s) not found: ${mpNotFound.join(', ')}` };
    }
  }

  const progResolveErrors = [];
  const resolvedProgramIdPerSlot = [];
  for (let idx = 0; idx < numProgramsSlots; idx++) {
    const pname = programNamesList[idx] ? String(programNamesList[idx]).trim() : '';
    const pidToken = programIdsRawParts[idx] != null ? String(programIdsRawParts[idx]).trim() : '';
    if (!pname && !pidToken) {
      resolvedProgramIdPerSlot[idx] = null;
      continue;
    }
    if (pidToken && /^\d+$/.test(pidToken)) {
      const pid = parseInt(pidToken, 10);
      const prow = await Program.findById(pid);
      if (!prow) progResolveErrors.push(`Program id ${pid} not found`);
      else resolvedProgramIdPerSlot[idx] = pid;
    } else if (pname) {
      const prog = await Program.findByNameCaseInsensitive(pname);
      if (!prog) progResolveErrors.push(`Program "${pname}" not found`);
      else resolvedProgramIdPerSlot[idx] = prog.id;
    } else {
      progResolveErrors.push(`Invalid program id "${pidToken}"`);
      resolvedProgramIdPerSlot[idx] = null;
    }
  }
  if (progResolveErrors.length) {
    return { ok: false, error: progResolveErrors.join('; ') };
  }

  try {
    const college = await College.create({
      college_name: name,
      college_location: location,
      college_type: collegeType,
      college_logo: logoFields.college_logo,
      logo_url: logoFields.logo_url,
      website: websiteVal,
      parent_university: parentUniversityVal || null,
      state: stateTrim,
      city: cityTrim,
    });
    let majorProgramIdsStr = null;
    if (majorProgramNamesRaw) {
      const mpNames = splitList(majorProgramNamesRaw);
      const mpIds = [];
      for (const mpn of mpNames) {
        const mp =
          (await Program.findByNameCaseInsensitive(mpn.trim())) || (await Program.findByName(mpn.trim()));
        if (mp) mpIds.push(mp.id);
      }
      if (mpIds.length > 0) majorProgramIdsStr = mpIds.join(',');
    }
    if (description || majorProgramIdsStr) {
      await CollegeDetails.create({
        college_id: college.id,
        college_description: description,
        major_program_ids: majorProgramIdsStr,
      });
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
            event_date: event_date || null,
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
          description: singleDesc,
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

    const numPrograms = numProgramsSlots;
    const intakeCapacities = intakeCapacitiesRaw ? splitList(intakeCapacitiesRaw) : [];
    const programDurations = programDurationsRaw ? splitList(programDurationsRaw) : [];
    const seatMatrixBlocks = splitProgramBlocks(seatMatrixRaw, numPrograms);
    const previousCutoffBlocks = splitProgramBlocks(previousYearCutoffRaw, numPrograms);
    const expectedCutoffBlocks = splitProgramBlocks(expectedCutoffRaw, numPrograms);

    const branchCourses = branchCoursesRaw ? splitList(branchCoursesRaw) : [];
    const programDescriptions = programDescriptionsRaw ? splitList(programDescriptionsRaw) : [];
    const programDurationUnits = programDurationUnitsRaw ? splitList(programDurationUnitsRaw) : [];
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

    for (let idx = 0; idx < numPrograms; idx++) {
      const programId = resolvedProgramIdPerSlot[idx];
      if (!programId) continue;
      const intakeVal = intakeCapacities[idx];
      const intake_capacity = intakeVal ? parseInt(intakeVal, 10) : null;
      const durVal = programDurations[idx];
      const duration_years = durVal ? parseInt(durVal, 10) : null;
      let progRecommendedExamIds = null;
      const progRecExamNamesStr = recExamNamesByProg[idx];
      if (progRecExamNamesStr) {
        const enames = progRecExamNamesStr.split(',').map((s) => s.trim()).filter(Boolean);
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
        key_dates_summary: null,
        fee_per_semester: feePerSemesters[idx] ? parseFloat(feePerSemesters[idx]) : null,
        total_fee: totalFees[idx] ? parseFloat(totalFees[idx]) : null,
        placement: placements[idx] || null,
        scholarship: scholarships[idx] || null,
        counselling_process: counsellingProcesses[idx] || null,
        documents_required: documentsRequireds[idx] || null,
        recommended_exam_ids: progRecommendedExamIds,
        contact_email: contactEmails[idx] || null,
        contact_number: contactNumbers[idx] || null,
        brochure_url: brochureUrls[idx] || null,
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
    return { ok: true, college };
  } catch (createErr) {
    return { ok: false, error: createErr.message || 'Failed to create college' };
  }
}

module.exports = { processCollegeBulkRow };
