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
const Exam = require('../../models/taxonomy/Exam');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');
const { buildLogoMapFromRequest, parseLogosFromZip, processMissingLogosFromZip } = require('../../utils/logoUploadUtils');
const { splitList, parseDate } = require('../../utils/bulkUploadUtils');

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
    const cp = await CollegeProgram.create({
      college_id: collegeId,
      program_id: programId,
      intake_capacity: prog.intake_capacity != null ? parseInt(prog.intake_capacity, 10) : null,
      duration_years: prog.duration_years != null ? parseInt(prog.duration_years, 10) : null
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
        college_location,
        college_type,
        college_logo,
        college_description,
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

      const existing = await College.findByName(college_name.trim());
      if (existing) {
        return res.status(400).json({ success: false, message: 'College with this name already exists' });
      }

      const college = await College.create({
        college_name: college_name.trim(),
        college_location: college_location ? college_location.trim() : null,
        college_type: college_type || null,
        college_logo: college_logo || null
      });

      if (college_description) {
        await CollegeDetails.create({ college_id: college.id, college_description: college_description.trim() });
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
        college_location,
        college_type,
        college_logo,
        college_description,
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

      await College.update(collegeId, {
        college_name: college_name !== undefined ? college_name.trim() : undefined,
        college_location: college_location !== undefined ? (college_location && college_location.trim()) || null : undefined,
        college_type: college_type !== undefined ? college_type || null : undefined,
        college_logo: college_logo !== undefined ? college_logo : undefined
      });

      if (college_description !== undefined) {
        await CollegeDetails.create({ college_id: collegeId, college_description: college_description ? college_description.trim() : null });
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
        'college_location',
        'college_type',
        'logo_filename',
        'college_description',
        'key_dates',
        'documents_required',
        'counselling_process',
        'recommended_exam_names',
        'program_names',
        'intake_capacities',
        'program_durations',
        'seat_matrix',
        'previous_year_cutoff',
        'expected_cutoff'
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        [
          'IIT Delhi',
          'New Delhi',
          'Central',
          'iit_delhi.png',
          'Premier engineering institute.',
          'Admission Start|2025-01-01, Last Date|2025-02-28',
          'Aadhar, Marksheet, Photo',
          'JOSAA counselling',
          'JEE Advanced, JEE Main',
          'B.Tech, M.Tech',
          '120, 60',
          '4, 2',
          'CSE-general:50, CSE-OBC:30',
          'JEE Main|CSE-GEN:1000,CSE-OBC:1500|2024; JEE Main|CSE-GEN:900|2025',
          'JEE Main|CSE-GEN:2000|2024; JEE Main|CSE-GEN:1800|2025'
        ],
        [
          'State College of Engineering',
          'Mumbai',
          'State',
          'state_eng.png',
          'State level engineering college.',
          'Application Start|2025-02-01',
          'Marksheet',
          'JOSAA counselling',
          'JEE Main',
          'B.Tech',
          '100',
          '4',
          'CSE-general:80, CSE-OBC:20',
          'JEE Main|CSE-GEN:2000|2024',
          'JEE Main|CSE-GEN:1800|2025'
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

  /** Download all colleges data as Excel (Super Admin only). Same columns as bulk template. */
  static async downloadAllExcel(req, res) {
    try {
      const colleges = await College.findAll();
      const headers = [
        'college_name', 'college_location', 'college_type', 'logo_filename', 'college_description',
        'key_dates', 'documents_required', 'counselling_process', 'recommended_exam_names', 'program_names', 'intake_capacities',
        'program_durations', 'seat_matrix', 'previous_year_cutoff', 'expected_cutoff'
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
        const seatMatrixBlocks = [];
        const previousCutoffBlocks = [];
        const expectedCutoffBlocks = [];
        for (const p of programs || []) {
          const prog = await Program.findById(p.program_id);
          programNamesArr.push(prog && prog.name ? prog.name : String(p.program_id));
          intakeArr.push(p.intake_capacity != null ? String(p.intake_capacity) : '');
          durationArr.push(p.duration_years != null ? String(p.duration_years) : '');
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
        const logoFilename = (c.college_logo && typeof c.college_logo === 'string' && c.college_logo.split('/').pop()) ? c.college_logo.split('/').pop() : '';
        const collegeDetails = await CollegeDetails.findByCollegeId(c.id);
        const desc = collegeDetails && collegeDetails.college_description ? collegeDetails.college_description : '';
        rows.push([
          c.college_name || '',
          c.college_location || '',
          c.college_type || '',
          logoFilename,
          desc,
          keyDatesStr,
          docsStr,
          counsellingStr,
          recNamesStr,
          programNamesArr.join(';'),
          intakeArr.join(','),
          durationArr.join(','),
          seatMatrixBlocks.join(';'),
          previousCutoffBlocks.join(';'),
          expectedCutoffBlocks.join(';')
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

        const location = (row.college_location ?? row.college_Location ?? '').toString().trim() || null;
        const typeRaw = (row.college_type ?? row.college_Type ?? '').toString().trim();
        const collegeType = validTypes.find((t) => t.toLowerCase() === typeRaw.toLowerCase()) || null;
        const logoFilename = (row.logo_filename ?? row.logo_Filename ?? '').toString().trim();
        const description = (row.college_description ?? row.college_Description ?? '').toString().trim() || null;

        const keyDatesRaw = (row.key_dates ?? row.key_Dates ?? '').toString().trim();
        const documentsRaw = (row.documents_required ?? row.documents_Required ?? '').toString().trim();
        const counsellingRaw = (row.counselling_process ?? row.counselling_Process ?? '').toString().trim();
        const recommendedExamNamesRaw = (row.recommended_exam_names ?? row.recommended_exam_Names ?? '').toString().trim();
        const recommendedExamIdsRaw = (row.recommended_exam_ids ?? row.recommended_exam_Ids ?? '').toString().trim();
        const programNamesRaw = (row.program_names ?? row.program_Names ?? '').toString().trim();
        const programIdsRaw = (row.program_ids ?? row.program_Ids ?? '').toString().trim();
        const intakeCapacitiesRaw = (row.intake_capacities ?? row.intake_Capacities ?? '').toString().trim();
        const programDurationsRaw = (row.program_durations ?? row.program_Durations ?? '').toString().trim();
        const seatMatrixRaw = (row.seat_matrix ?? row.seat_Matrix ?? '').toString().trim();
        const previousYearCutoffRaw = (row.previous_year_cutoff ?? row.previous_year_Cutoff ?? '').toString().trim();
        const expectedCutoffRaw = (row.expected_cutoff ?? row.expected_Cutoff ?? '').toString().trim();

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
            logo_filename: logoFilename || null
          });
          if (description) {
            await CollegeDetails.create({ college_id: college.id, college_description: description });
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
          const intakeCapacities = intakeCapacitiesRaw ? intakeCapacitiesRaw.split(',').map((s) => s.trim()) : [];
          const programDurations = programDurationsRaw ? programDurationsRaw.split(',').map((s) => s.trim()) : [];
          const seatMatrixBlocks = seatMatrixRaw ? seatMatrixRaw.split(';').map((s) => s.trim()) : [];
          const previousCutoffBlocks = previousYearCutoffRaw ? previousYearCutoffRaw.split(';').map((s) => s.trim()) : [];
          const expectedCutoffBlocks = expectedCutoffRaw ? expectedCutoffRaw.split(';').map((s) => s.trim()) : [];

          const numPrograms = Math.max(programNames.length, programIds.length);
          for (let idx = 0; idx < numPrograms; idx++) {
            let programId = programIds[idx] != null ? parseInt(programIds[idx], 10) : null;
            if ((!programId || isNaN(programId)) && programNames[idx]) {
              const prog = await Program.findByName(programNames[idx].trim());
              if (prog) programId = prog.id;
            }
            if (!programId) continue;
            const intakeVal = intakeCapacities[idx];
            const intake_capacity = intakeVal ? parseInt(intakeVal, 10) : null;
            const durVal = programDurations[idx];
            const duration_years = durVal ? parseInt(durVal, 10) : null;
            const cp = await CollegeProgram.create({
              college_id: college.id,
              program_id: programId,
              intake_capacity: isNaN(intake_capacity) ? null : intake_capacity,
              duration_years: isNaN(duration_years) ? null : duration_years
            });
            if (cp && cp.id) {
              const seatEntries = seatMatrixBlocks[idx] ? seatMatrixBlocks[idx].split(',').map((s) => s.trim()) : [];
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
                    college_program_id: cp.id,
                    branch: branch || null,
                    category: category || null,
                    seat_count: isNaN(seat_count) ? null : seat_count,
                    year: isNaN(year) ? null : year
                  });
                }
              }
              const prevRecords = previousCutoffBlocks[idx] ? previousCutoffBlocks[idx].split(';').map((s) => s.trim()) : [];
              for (const rec of prevRecords) {
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
                    let branch = null;
                    let category = null;
                    if (left && left.includes('-')) {
                      const dashIdx = left.lastIndexOf('-');
                      branch = left.slice(0, dashIdx).trim() || null;
                      category = left.slice(dashIdx + 1).trim() || null;
                    } else {
                      category = left || null;
                    }
                    if (branch || category || cutoff_rank) {
                      await CollegePreviousCutoff.create({
                        college_program_id: cp.id,
                        exam_id: ex.id,
                        branch,
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
                    college_program_id: cp.id,
                    exam_id: ex.id,
                    branch: null,
                    category,
                    cutoff_rank: isNaN(cutoff_rank) ? null : cutoff_rank,
                    year: isNaN(yr) ? null : yr
                  });
                }
              }
              const expRecords = expectedCutoffBlocks[idx] ? expectedCutoffBlocks[idx].split(';').map((s) => s.trim()) : [];
              for (const rec of expRecords) {
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
                    let branch = null;
                    let category = null;
                    if (left && left.includes('-')) {
                      const dashIdx = left.lastIndexOf('-');
                      branch = left.slice(0, dashIdx).trim() || null;
                      category = left.slice(dashIdx + 1).trim() || null;
                    } else {
                      category = left || null;
                    }
                    if (branch || category || expected_rank) {
                      await CollegeExpectedCutoff.create({
                        college_program_id: cp.id,
                        exam_id: ex.id,
                        branch,
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
                    college_program_id: cp.id,
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
          created.push({ id: college.id, name: college.college_name });
          namesInFile.add(name.toLowerCase());
        } catch (createErr) {
          errors.push({ row: rowNum, message: createErr.message || 'Failed to create college' });
        }
      }

      res.json({
        success: true,
        data: {
          created: created.length,
          createdColleges: created,
          errors: errors.length,
          errorDetails: errors
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
