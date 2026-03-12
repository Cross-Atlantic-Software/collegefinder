const XLSX = require('xlsx');
const AdmZip = require('adm-zip');
const Exam = require('../../models/taxonomy/Exam');
const UserExamPreferences = require('../../models/user/UserExamPreferences');
const UserAcademics = require('../../models/user/UserAcademics');
const UserCareerGoals = require('../../models/user/UserCareerGoals');
const ExamDates = require('../../models/exam/ExamDates');
const ExamEligibilityCriteria = require('../../models/exam/ExamEligibilityCriteria');
const ExamPattern = require('../../models/exam/ExamPattern');
const ExamCutoff = require('../../models/exam/ExamCutoff');
const ExamCareerGoal = require('../../models/exam/ExamCareerGoal');
const Stream = require('../../models/taxonomy/Stream');
const Subject = require('../../models/taxonomy/Subject');
const CareerGoal = require('../../models/taxonomy/CareerGoal');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');

class ExamsTaxonomyController {
  /**
   * Get all exams (for users - public endpoint)
   * GET /api/exams
   */
  static async getAll(req, res) {
    try {
      const exams = await Exam.findAll();
      res.json({
        success: true,
        data: { exams }
      });
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exams'
      });
    }
  }

  /**
   * Get all exams (for admin)
   * GET /api/admin/exams
   */
  static async getAllAdmin(req, res) {
    try {
      const exams = await Exam.findAll();
      res.json({
        success: true,
        data: { exams }
      });
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exams'
      });
    }
  }

  /**
   * Get exam by ID (for admin) - includes all related data
   * GET /api/admin/exams/:id
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const exam = await Exam.findById(parseInt(id));

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found'
        });
      }

      // Get all related data
      const examDates = await ExamDates.findByExamId(parseInt(id));
      const eligibilityCriteria = await ExamEligibilityCriteria.findByExamId(parseInt(id));
      const examPattern = await ExamPattern.findByExamId(parseInt(id));
      const examCutoff = await ExamCutoff.findByExamId(parseInt(id));
      const careerGoalIds = await ExamCareerGoal.getCareerGoalIds(parseInt(id));

      res.json({
        success: true,
        data: {
          exam,
          examDates: examDates || null,
          eligibilityCriteria: eligibilityCriteria || null,
          examPattern: examPattern || null,
          examCutoff: examCutoff || null,
          careerGoalIds: careerGoalIds || []
        }
      });
    } catch (error) {
      console.error('Error fetching exam:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exam'
      });
    }
  }

  /**
   * Upload exam logo to S3 (for admin)
   * POST /api/admin/exams/upload-logo
   */
  static async uploadLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const s3Url = await uploadToS3(fileBuffer, fileName, 'exam-logos');

      res.json({
        success: true,
        data: { logoUrl: s3Url },
        message: 'Logo uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload logo'
      });
    }
  }

  /**
   * Upload missing logos from a ZIP file.
   * Matches files by logo_file_name; updates exams where exam_logo is null.
   * POST /api/admin/exams/upload-missing-logos
   */
  static async uploadMissingLogos(req, res) {
    try {
      const logosZipFile = req.files?.logos_zip?.[0] || req.file;
      if (!logosZipFile || !logosZipFile.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No ZIP file uploaded. Use field name "logos_zip".'
        });
      }

      let logoMap;
      try {
        const zip = new AdmZip(logosZipFile.buffer);
        const entries = zip.getEntries();
        const imageExt = /\.(jpe?g|png|gif|webp|bmp)$/i;
        logoMap = new Map();
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
          message: 'Invalid or corrupted ZIP file. Use a ZIP containing only image files (e.g. .jpg, .png).'
        });
      }

      const updated = [];
      const skipped = [];
      const errors = [];

      for (const [filenameLower, file] of logoMap) {
        const exams = await Exam.findMissingLogosByFilename(file.originalname);
        if (exams.length === 0) {
          skipped.push(file.originalname);
          continue;
        }
        try {
          const logoUrl = await uploadToS3(file.buffer, file.originalname, 'exam-logos');
          for (const exam of exams) {
            await Exam.update(exam.id, { exam_logo: logoUrl });
            updated.push({ id: exam.id, name: exam.name, code: exam.code, logo_file_name: exam.logo_file_name });
          }
        } catch (uploadErr) {
          errors.push({ file: file.originalname, message: uploadErr.message });
        }
      }

      res.json({
        success: true,
        data: {
          updated,
          skipped,
          errors,
          summary: {
            logosAdded: updated.length,
            filesSkipped: skipped.length,
            uploadErrors: errors.length
          }
        },
        message: `Added ${updated.length} logo(s). ${skipped.length} file(s) had no matching exams.`
      });
    } catch (error) {
      console.error('Error uploading missing logos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload missing logos'
      });
    }
  }

  /**
   * Create new exam (for admin) - includes related data
   * POST /api/admin/exams
   */
  static async create(req, res) {
    try {
      const { 
        name, 
        code, 
        description, 
        exam_logo, 
        exam_type, 
        conducting_authority,
        examDates,
        eligibilityCriteria,
        examPattern,
        examCutoff,
        careerGoalIds
      } = req.body;

      // Validate required fields
      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: 'Name and code are required'
        });
      }

      // Check if name or code already exists
      const existingByName = await Exam.findByName(name);
      if (existingByName) {
        return res.status(400).json({
          success: false,
          message: 'Exam with this name already exists'
        });
      }

      const existingByCode = await Exam.findByCode(code);
      if (existingByCode) {
        return res.status(400).json({
          success: false,
          message: 'Exam with this code already exists'
        });
      }

      // Create exam
      const exam = await Exam.create({ 
        name, 
        code, 
        description,
        exam_logo,
        exam_type,
        conducting_authority
      });

      // Create related data if provided
      let createdDates = null;
      let createdEligibility = null;
      let createdPattern = null;
      let createdCutoff = null;
      let createdCareerGoals = [];

      if (examDates) {
        createdDates = await ExamDates.create({ exam_id: exam.id, ...examDates });
      }

      if (eligibilityCriteria) {
        createdEligibility = await ExamEligibilityCriteria.create({ exam_id: exam.id, ...eligibilityCriteria });
      }

      if (examPattern) {
        createdPattern = await ExamPattern.create({ exam_id: exam.id, ...examPattern });
      }

      if (examCutoff) {
        const cutoffPayload = { ...examCutoff };
        if (cutoffPayload.category_wise_cutoff != null && typeof cutoffPayload.category_wise_cutoff === 'object') {
          cutoffPayload.category_wise_cutoff = JSON.stringify(cutoffPayload.category_wise_cutoff);
        }
        createdCutoff = await ExamCutoff.create({ exam_id: exam.id, ...cutoffPayload });
      }

      if (careerGoalIds && Array.isArray(careerGoalIds) && careerGoalIds.length > 0) {
        createdCareerGoals = await ExamCareerGoal.setCareerGoalsForExam(exam.id, careerGoalIds);
      }

      res.status(201).json({
        success: true,
        data: { 
          exam,
          examDates: createdDates,
          eligibilityCriteria: createdEligibility,
          examPattern: createdPattern,
          examCutoff: createdCutoff,
          careerGoalIds: createdCareerGoals.map(cg => cg.career_goal_id)
        },
        message: 'Exam created successfully'
      });
    } catch (error) {
      console.error('Error creating exam:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create exam'
      });
    }
  }

  /**
   * Update exam (for admin) - includes related data
   * PUT /api/admin/exams/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { 
        name, 
        code, 
        description,
        exam_logo,
        exam_type,
        conducting_authority,
        examDates,
        eligibilityCriteria,
        examPattern,
        examCutoff,
        careerGoalIds
      } = req.body;

      const existing = await Exam.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found'
        });
      }

      // Check if name or code conflicts with another exam
      if (name && name !== existing.name) {
        const duplicate = await Exam.findByName(name);
        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: 'Exam with this name already exists'
          });
        }
      }

      if (code && code !== existing.code) {
        const duplicate = await Exam.findByCode(code);
        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: 'Exam with this code already exists'
          });
        }
      }

      // If logo is being updated, delete old logo from S3
      if (exam_logo && exam_logo !== existing.exam_logo && existing.exam_logo) {
        await deleteFromS3(existing.exam_logo);
      }

      // Update exam
      const exam = await Exam.update(parseInt(id), { 
        name, 
        code, 
        description,
        exam_logo,
        exam_type,
        conducting_authority
      });

      // Update related data if provided
      let updatedDates = null;
      let updatedEligibility = null;
      let updatedPattern = null;
      let updatedCutoff = null;
      let updatedCareerGoalIds = [];

      if (examDates !== undefined) {
        updatedDates = await ExamDates.upsert({ exam_id: parseInt(id), ...examDates });
      }

      if (eligibilityCriteria !== undefined) {
        updatedEligibility = await ExamEligibilityCriteria.upsert({ exam_id: parseInt(id), ...eligibilityCriteria });
      }

      if (examPattern !== undefined) {
        updatedPattern = await ExamPattern.upsert({ exam_id: parseInt(id), ...examPattern });
      }

      if (examCutoff !== undefined) {
        const cutoffPayload = { ...examCutoff };
        if (cutoffPayload.category_wise_cutoff != null && typeof cutoffPayload.category_wise_cutoff === 'object') {
          cutoffPayload.category_wise_cutoff = JSON.stringify(cutoffPayload.category_wise_cutoff);
        }
        updatedCutoff = await ExamCutoff.upsert({ exam_id: parseInt(id), ...cutoffPayload });
      }

      if (careerGoalIds !== undefined) {
        const created = await ExamCareerGoal.setCareerGoalsForExam(parseInt(id), Array.isArray(careerGoalIds) ? careerGoalIds : []);
        updatedCareerGoalIds = created.map(cg => cg.career_goal_id);
      } else {
        // If not provided, get existing ones
        updatedCareerGoalIds = await ExamCareerGoal.getCareerGoalIds(parseInt(id));
      }

      res.json({
        success: true,
        data: { 
          exam,
          examDates: updatedDates,
          eligibilityCriteria: updatedEligibility,
          examPattern: updatedPattern,
          examCutoff: updatedCutoff,
          careerGoalIds: updatedCareerGoalIds
        },
        message: 'Exam updated successfully'
      });
    } catch (error) {
      console.error('Error updating exam:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update exam'
      });
    }
  }

  /**
   * Delete exam (for admin) - also deletes related data via CASCADE
   * DELETE /api/admin/exams/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const exam = await Exam.findById(parseInt(id));

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found'
        });
      }

      // Delete logo from S3 if exists
      if (exam.exam_logo) {
        await deleteFromS3(exam.exam_logo);
      }

      // Delete exam (related data will be deleted via CASCADE)
      await Exam.delete(parseInt(id));
      res.json({
        success: true,
        message: 'Exam deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting exam:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete exam'
      });
    }
  }

  /**
   * Delete all exams (Super Admin only)
   * DELETE /api/admin/exams/all
   */
  static async deleteAll(req, res) {
    try {
      const all = await Exam.findAll();
      for (const ex of all) {
        if (ex.exam_logo) await deleteFromS3(ex.exam_logo);
        await Exam.delete(ex.id);
      }
      res.json({
        success: true,
        message: `All ${all.length} exams deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting all exams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete all exams'
      });
    }
  }

  /**
   * Get user's exam preferences
   * GET /api/auth/profile/exam-preferences
   */
  static async getExamPreferences(req, res) {
    try {
      const userId = req.user.id;
      const userExamPreferences = await UserExamPreferences.findByUserId(userId);

      if (!userExamPreferences) {
        return res.json({
          success: true,
          data: {
            target_exams: [],
            previous_attempts: []
          }
        });
      }

      let targetExams = [];
      if (userExamPreferences.target_exams) {
        targetExams = Array.isArray(userExamPreferences.target_exams)
          ? userExamPreferences.target_exams.map(id => id.toString())
          : [userExamPreferences.target_exams.toString()];
      }

      let previousAttempts = [];
      if (userExamPreferences.previous_attempts) {
        previousAttempts = Array.isArray(userExamPreferences.previous_attempts)
          ? userExamPreferences.previous_attempts
          : JSON.parse(userExamPreferences.previous_attempts);
      }

      res.json({
        success: true,
        data: {
          target_exams: targetExams,
          previous_attempts: previousAttempts
        }
      });
    } catch (error) {
      console.error('Error fetching exam preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exam preferences'
      });
    }
  }

  /**
   * Update user's exam preferences
   * PUT /api/auth/profile/exam-preferences
   */
  static async updateExamPreferences(req, res) {
    try {
      const userId = req.user.id;
      const { target_exams, previous_attempts } = req.body;

      // Validate previous_attempts structure
      if (previous_attempts && Array.isArray(previous_attempts)) {
        for (const attempt of previous_attempts) {
          if (!attempt.exam_id || !attempt.year) {
            return res.status(400).json({
              success: false,
              message: 'Each previous attempt must have exam_id and year'
            });
          }
        }
      }

      const userExamPreferences = await UserExamPreferences.upsert(userId, {
        target_exams,
        previous_attempts
      });

      let targetExams = [];
      if (userExamPreferences.target_exams) {
        targetExams = Array.isArray(userExamPreferences.target_exams)
          ? userExamPreferences.target_exams.map(id => id.toString())
          : [userExamPreferences.target_exams.toString()];
      }

      let previousAttempts = [];
      if (userExamPreferences.previous_attempts) {
        previousAttempts = Array.isArray(userExamPreferences.previous_attempts)
          ? userExamPreferences.previous_attempts
          : JSON.parse(userExamPreferences.previous_attempts);
      }

      res.json({
        success: true,
        data: {
          target_exams: targetExams,
          previous_attempts: previousAttempts
        },
        message: 'Exam preferences updated successfully'
      });
    } catch (error) {
      console.error('Error updating exam preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update exam preferences'
      });
    }
  }

  /**
   * Get recommended exams for the authenticated user.
   * Uses: user_academics (stream), user_career_goals (interests), exam_career_goal, exam_eligibility_criteria.
   * Returns exam IDs only; frontend can fetch full exam details by ID.
   * GET /api/auth/profile/recommended-exams
   */
  static async getRecommendedExams(req, res) {
    try {
      const userId = req.user.id;

      const [academics, careerGoalsRow] = await Promise.all([
        UserAcademics.findByUserId(userId),
        UserCareerGoals.findByUserId(userId)
      ]);

      const streamId = academics?.stream_id ?? null;
      const careerGoalIds = careerGoalsRow?.interests ?? [];
      const normalizedCareerGoalIds = Array.isArray(careerGoalIds)
        ? careerGoalIds.map(id => (typeof id === 'string' ? parseInt(id, 10) : id)).filter(id => !isNaN(id))
        : [];

      if (normalizedCareerGoalIds.length === 0) {
        return res.json({
          success: true,
          data: { examIds: [], message: 'Add career goals to get recommended exams.' }
        });
      }

      const candidateExamIds = await ExamCareerGoal.getExamIdsByCareerGoalIds(normalizedCareerGoalIds);
      if (candidateExamIds.length === 0) {
        return res.json({
          success: true,
          data: { examIds: [] }
        });
      }

      const eligibilityRows = await ExamEligibilityCriteria.findByExamIds(candidateExamIds);
      const eligibilityByExamId = new Map(eligibilityRows.map(row => [row.exam_id, row]));

      const streamIdNum = streamId != null ? Number(streamId) : null;
      const examIds = candidateExamIds.filter(examId => {
        const criteria = eligibilityByExamId.get(examId);
        if (!criteria) {
          return true;
        }
        const streamIds = criteria.stream_ids;
        if (!streamIds || !Array.isArray(streamIds) || streamIds.length === 0) {
          return true;
        }
        if (streamIdNum == null) {
          return false;
        }
        return streamIds.some(s => Number(s) === streamIdNum);
      });

      res.json({
        success: true,
        data: {
          examIds: examIds.map(id => id.toString())
        }
      });
    } catch (error) {
      console.error('Error fetching recommended exams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recommended exams'
      });
    }
  }

  /**
   * Download Excel template for bulk exam upload (all exam details supported)
   * GET /api/admin/exams/bulk-upload-template
   */
  static async downloadBulkTemplate(req, res) {
    try {
      const headers = [
        'name',
        'code',
        'description',
        'exam_type',
        'conducting_authority',
        'logo_filename',
        'application_start_date',
        'application_close_date',
        'exam_date',
        'stream_ids',
        'subject_ids',
        'age_limit_min',
        'age_limit_max',
        'attempt_limit',
        'mode',
        'number_of_questions',
        'marking_scheme',
        'duration_minutes',
        'previous_year_cutoff',
        'ranks_percentiles',
        'category_wise_cutoff',
        'target_rank_range',
        'career_goal_ids'
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        [
          'JEE Main',
          'JEE_MAIN',
          'Engineering entrance',
          'National',
          'NTA',
          'jee_main.png',
          '2025-12-01',
          '2026-01-15',
          '2026-01-25',
          '1,2',
          '1,2,3',
          '17',
          '25',
          '3',
          'Online',
          '90',
          '+4 -1',
          '180',
          'Previous year cutoffs',
          'Rank vs percentile',
          '{"General": 95, "OBC": 90, "SC": 85, "ST": 80}',
          'Top 10k',
          '1,2'
        ],
        [
          'NEET',
          'NEET',
          'Medical entrance',
          'National',
          'NTA',
          'neet.png',
          '2025-11-01',
          '2025-12-15',
          '2026-05-05',
          'PCM, PCB',
          'Physics, Chemistry, Mathematics',
          '17',
          '',
          '',
          'Offline',
          '200',
          '',
          '200',
          '',
          '',
          '',
          '',
          'Engineering'
        ]
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Exams');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=exams-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating bulk template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate template'
      });
    }
  }

  /**
   * Download all exams data as Excel (Super Admin only). Same columns as bulk template, filled with current data.
   * GET /api/admin/exams/download-excel
   */
  static async downloadAllExcel(req, res) {
    try {
      const [exams, allStreams, allSubjects, allCareerGoals] = await Promise.all([
        Exam.findAll(),
        Stream.findAll(),
        Subject.findAll(),
        CareerGoal.findAll()
      ]);
      const streamMap = new Map(allStreams.map((s) => [s.id, s.name]));
      const subjectMap = new Map(allSubjects.map((s) => [s.id, s.name]));
      const careerGoalMap = new Map(allCareerGoals.map((c) => [c.id, c.label]));

      const headers = [
        'name', 'code', 'description', 'exam_type', 'conducting_authority', 'logo_filename', 'exam_logo',
        'application_start_date', 'application_close_date', 'exam_date',
        'Streams', 'Subjects', 'age_limit_min', 'age_limit_max', 'attempt_limit',
        'mode', 'number_of_questions', 'marking_scheme', 'duration_minutes',
        'previous_year_cutoff', 'ranks_percentiles', 'category_wise_cutoff', 'target_rank_range', 'Interests'
      ];
      const rows = [headers];
      for (const exam of exams) {
        const [dates, eligibility, pattern, cutoff, careerGoalIds] = await Promise.all([
          ExamDates.findByExamId(exam.id),
          ExamEligibilityCriteria.findByExamId(exam.id),
          ExamPattern.findByExamId(exam.id),
          ExamCutoff.findByExamId(exam.id),
          ExamCareerGoal.getCareerGoalIds(exam.id)
        ]);
        const logoFilename = exam.logo_file_name || (exam.exam_logo && typeof exam.exam_logo === 'string' ? exam.exam_logo.split('/').pop() : '') || '';
        const examLogoUrl = (exam.exam_logo && typeof exam.exam_logo === 'string') ? exam.exam_logo : '';
        const streamIds = eligibility?.stream_ids;
        const subjectIds = eligibility?.subject_ids;
        const streamNames = (Array.isArray(streamIds) ? streamIds : []).map((id) => streamMap.get(id) ?? id).filter(Boolean).join(', ');
        const subjectNames = (Array.isArray(subjectIds) ? subjectIds : []).map((id) => subjectMap.get(id) ?? id).filter(Boolean).join(', ');
        const interestNames = (Array.isArray(careerGoalIds) ? careerGoalIds : []).map((id) => careerGoalMap.get(id) ?? id).filter(Boolean).join(', ');
        rows.push([
          exam.name || '',
          exam.code || '',
          exam.description || '',
          exam.exam_type || '',
          exam.conducting_authority || '',
          logoFilename,
          examLogoUrl,
          (dates && dates.application_start_date) ? String(dates.application_start_date).slice(0, 10) : '',
          (dates && dates.application_close_date) ? String(dates.application_close_date).slice(0, 10) : '',
          (dates && dates.exam_date) ? String(dates.exam_date).slice(0, 10) : '',
          streamNames,
          subjectNames,
          (eligibility && eligibility.age_limit_min != null) ? String(eligibility.age_limit_min) : '',
          (eligibility && eligibility.age_limit_max != null) ? String(eligibility.age_limit_max) : '',
          (eligibility && eligibility.attempt_limit != null) ? String(eligibility.attempt_limit) : '',
          (pattern && pattern.mode) ? pattern.mode : '',
          (pattern && pattern.number_of_questions != null) ? String(pattern.number_of_questions) : '',
          (pattern && pattern.marking_scheme) || '',
          (pattern && pattern.duration_minutes != null) ? String(pattern.duration_minutes) : '',
          (cutoff && cutoff.previous_year_cutoff) || '',
          (cutoff && cutoff.ranks_percentiles) || '',
          (cutoff && cutoff.category_wise_cutoff) ? (typeof cutoff.category_wise_cutoff === 'object' ? JSON.stringify(cutoff.category_wise_cutoff) : String(cutoff.category_wise_cutoff)) : '',
          (cutoff && cutoff.target_rank_range) || '',
          interestNames
        ]);
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Exams');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=exams-all-data.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating exams export:', error);
      res.status(500).json({ success: false, message: 'Failed to export exams data' });
    }
  }

  /**
   * Bulk create exams from Excel with full details; optional bulk logos matched by logo_filename.
   * Streams, subjects and career goals accept either IDs or names/labels (comma/semicolon-separated).
   * Use stream_ids or stream_names (e.g. "PCM, PCB"), subject_ids or subject_names (e.g. "Physics, Chemistry"),
   * career_goal_ids or career_goal_labels (e.g. "Engineering") — names are resolved to IDs from taxonomy tables.
   */
  static async bulkUpload(req, res) {
    const parseIdList = (val) => {
      if (val == null || val === '') return [];
      const s = String(val).trim();
      if (!s) return [];
      return s.split(/[,;\s]+/).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
    };
    const getCell = (row, ...keys) => {
      for (const k of keys) {
        const v = row[k];
        if (v != null && String(v).trim() !== '') return String(v).trim();
      }
      return '';
    };
    const getCellByKeyword = (row, keyword) => {
      const lower = keyword.toLowerCase();
      for (const k of Object.keys(row || {})) {
        if (k.toLowerCase().includes(lower)) {
          const v = row[k];
          if (v != null && String(v).trim() !== '') return String(v).trim();
        }
      }
      return '';
    };
    const resolveStreamIds = async (row, allStreams) => {
      const raw = getCell(row, 'stream_ids', 'Stream_Ids', 'stream_names', 'Stream_Names', 'streams', 'Streams') || getCellByKeyword(row, 'stream');
      if (!raw) return { ids: [], notFound: [] };
      let parts;
      if (/\bScience\s*[–-]\s*|Commerce|Humanities|Vocational|Others/i.test(raw) && raw.includes('),')) {
        parts = raw.split(/\s*\)\s*,\s*/).map((s) => {
          s = s.trim();
          if (s && !s.endsWith(')')) s += ')';
          return s;
        }).filter(Boolean);
      } else {
        parts = raw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
      }
      const ids = [];
      const notFound = [];
      const streamNames = (allStreams || await Stream.findAll()).slice().sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));
      const normalizeForMatch = (str) => (str || '').replace(/\s+/g, ' ').replace(/[\u2013\u2014-]/g, '-').trim().toLowerCase();
      for (const p of parts) {
        if (/^\d+$/.test(p)) {
          ids.push(parseInt(p, 10));
        } else {
          let found = await Stream.findByName(p);
          if (!found && streamNames.length > 0) {
            const partNorm = normalizeForMatch(p);
            found = streamNames.find((s) => normalizeForMatch(s.name) === partNorm || partNorm.includes(normalizeForMatch(s.name)) || normalizeForMatch(s.name).includes(partNorm));
          }
          if (found) ids.push(found.id);
          else notFound.push(`stream "${p}"`);
        }
      }
      return { ids, notFound };
    };
    const resolveSubjectIds = async (row) => {
      const raw = getCell(row, 'subject_ids', 'Subject_Ids', 'subject_names', 'Subject_Names', 'subjects', 'Subjects') || getCellByKeyword(row, 'subject');
      if (!raw) return { ids: [], notFound: [] };
      const parts = raw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
      const ids = [];
      const notFound = [];
      for (const p of parts) {
        if (/^\d+$/.test(p)) {
          ids.push(parseInt(p, 10));
        } else {
          const found = await Subject.findByName(p);
          if (found) ids.push(found.id);
          else notFound.push(`subject "${p}"`);
        }
      }
      return { ids, notFound };
    };
    const resolveCareerGoalIds = async (row, allCareerGoals) => {
      const raw = getCell(row, 'career_goal_ids', 'Career_Goal_Ids', 'career_goal_labels', 'Career_Goal_Labels', 'career_goals', 'Career_Goals') || getCellByKeyword(row, 'career');
      if (!raw) return { ids: [], notFound: [] };
      const parts = raw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
      const ids = [];
      const notFound = [];
      const goals = allCareerGoals || await CareerGoal.findAll();
      const normalize = (s) => (s || '').replace(/\s*&\s*/g, ' and ').trim().toLowerCase();
      for (const p of parts) {
        if (/^\d+$/.test(p)) {
          ids.push(parseInt(p, 10));
        } else {
          let found = await CareerGoal.findByLabel(p);
          if (!found) found = await CareerGoal.findByLabel(p.replace(/\s*&\s*/g, ' and '));
          if (!found && goals.length > 0) {
            const partNorm = normalize(p);
            found = goals.find((g) => normalize(g.label) === partNorm || partNorm.includes(normalize(g.label)) || normalize(g.label).includes(partNorm));
          }
          if (found) ids.push(found.id);
          else notFound.push(`career goal "${p}"`);
        }
      }
      return { ids, notFound };
    };
    const parseDate = (val) => {
      if (val == null || val === '') return null;
      const s = String(val).trim();
      if (!s) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      return null;
    };

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
            message: 'Invalid or corrupted ZIP file for logos. Use a ZIP containing only image files (e.g. .jpg, .png).'
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
        return res.status(400).json({
          success: false,
          message: 'Invalid Excel file or format.'
        });
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (!rows.length) {
        return res.status(400).json({
          success: false,
          message: 'Excel file has no data rows.'
        });
      }

      const allStreams = await Stream.findAll();
      const allCareerGoals = await CareerGoal.findAll();

      const created = [];
      const errors = [];
      const validTypes = ['National', 'State', 'Institute'];
      const validModes = ['Offline', 'Online', 'Hybrid'];
      const codesInFile = new Set();
      const namesInFile = new Set();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const name = (row.name ?? row.Name ?? '').toString().trim();
        const code = (row.code ?? row.Code ?? '').toString().trim().toUpperCase().replace(/\s+/g, '_');
        const description = (row.description ?? row.Description ?? '') ? (row.description ?? row.Description).toString().trim() : null;
        const examType = (row.exam_type ?? row.Exam_Type ?? '').toString().trim();
        const conductingAuthority = (row.conducting_authority ?? row.Conducting_Authority ?? '') ? (row.conducting_authority ?? row.Conducting_Authority).toString().trim() : null;
        const logoFilename = (row.logo_filename ?? row.Logo_Filename ?? '').toString().trim();

        if (!name || !code) {
          errors.push({ row: rowNum, message: 'name and code are required' });
          continue;
        }

        if (codesInFile.has(code)) {
          errors.push({ row: rowNum, message: `duplicate code "${code}" in this file (use unique code per row)` });
          continue;
        }
        if (namesInFile.has(name.toLowerCase())) {
          errors.push({ row: rowNum, message: `duplicate name "${name}" in this file (use unique name per row)` });
          continue;
        }

        const existingByCode = await Exam.findByCode(code);
        if (existingByCode) {
          errors.push({ row: rowNum, message: `exam with code "${code}" already exists in database` });
          continue;
        }

        const existingByName = await Exam.findByName(name);
        if (existingByName) {
          errors.push({ row: rowNum, message: `exam with name "${name}" already exists in database` });
          continue;
        }

        let examLogoUrl = null;
        if (logoFilename) {
          const logoFile = logoMap.get(logoFilename.toLowerCase());
          if (logoFile && logoFile.buffer) {
            try {
              examLogoUrl = await uploadToS3(logoFile.buffer, logoFile.originalname || logoFilename, 'exam-logos');
            } catch (uploadErr) {
              errors.push({ row: rowNum, message: `logo upload failed for "${logoFilename}": ${uploadErr.message}` });
            }
          }
          // If logo file not in ZIP: still create exam with logo_file_name; can upload later via "Upload missing logos"
        }

        const finalExamType = validTypes.includes(examType) ? examType : null;
        let exam;
        try {
          exam = await Exam.create({
            name,
            code,
            description,
            exam_logo: examLogoUrl,
            exam_type: finalExamType,
            conducting_authority: conductingAuthority,
            logo_file_name: logoFilename || null
          });
          created.push({ id: exam.id, name: exam.name, code: exam.code });
          codesInFile.add(code);
          namesInFile.add(name.toLowerCase());
        } catch (createErr) {
          errors.push({ row: rowNum, message: createErr.message || 'Failed to create exam' });
          continue;
        }

        const examId = exam.id;

        try {
          const appStart = parseDate(row.application_start_date ?? row.Application_Start_Date);
          const appClose = parseDate(row.application_close_date ?? row.Application_Close_Date);
          const examDate = parseDate(row.exam_date ?? row.Exam_Date);
          if (appStart || appClose || examDate) {
            await ExamDates.create({
              exam_id: examId,
              application_start_date: appStart,
              application_close_date: appClose,
              exam_date: examDate
            });
          }
        } catch (e) {
          errors.push({ row: rowNum, message: `dates: ${e.message}` });
        }

        try {
          const streamRes = await resolveStreamIds(row);
          const subjectRes = await resolveSubjectIds(row);
          const allNotFound = [...streamRes.notFound, ...subjectRes.notFound];
          if (allNotFound.length > 0) {
            errors.push({ row: rowNum, message: `eligibility: not found: ${allNotFound.join(', ')}` });
          }
          const streamIds = streamRes.ids;
          const subjectIds = subjectRes.ids;
          const ageMin = row.age_limit_min != null && row.age_limit_min !== '' ? parseInt(String(row.age_limit_min), 10) : null;
          const ageMax = row.age_limit_max != null && row.age_limit_max !== '' ? parseInt(String(row.age_limit_max), 10) : null;
          const attemptLimit = row.attempt_limit != null && row.attempt_limit !== '' ? parseInt(String(row.attempt_limit), 10) : null;
          if (streamIds.length > 0 || subjectIds.length > 0 || ageMin != null || ageMax != null || attemptLimit != null) {
            await ExamEligibilityCriteria.create({
              exam_id: examId,
              stream_ids: streamIds,
              subject_ids: subjectIds,
              age_limit_min: !isNaN(ageMin) ? ageMin : null,
              age_limit_max: !isNaN(ageMax) ? ageMax : null,
              attempt_limit: !isNaN(attemptLimit) ? attemptLimit : null
            });
          }
        } catch (e) {
          errors.push({ row: rowNum, message: `eligibility: ${e.message}` });
        }

        try {
          const mode = (row.mode ?? row.Mode ?? '').toString().trim();
          const numQ = row.number_of_questions != null && row.number_of_questions !== '' ? parseInt(String(row.number_of_questions), 10) : null;
          const markingScheme = (row.marking_scheme ?? row.Marking_Scheme ?? '') ? (row.marking_scheme ?? row.Marking_Scheme).toString().trim() : null;
          const duration = row.duration_minutes != null && row.duration_minutes !== '' ? parseInt(String(row.duration_minutes), 10) : null;
          const finalMode = validModes.includes(mode) ? mode : null;
          if (finalMode || numQ != null || markingScheme || duration != null) {
            await ExamPattern.create({
              exam_id: examId,
              mode: finalMode,
              number_of_questions: !isNaN(numQ) ? numQ : null,
              marking_scheme: markingScheme,
              duration_minutes: !isNaN(duration) ? duration : null
            });
          }
        } catch (e) {
          errors.push({ row: rowNum, message: `pattern: ${e.message}` });
        }

        try {
          const toStr = (v) => (v == null || v === '') ? null : (typeof v === 'object' ? JSON.stringify(v) : String(v).trim() || null);
          const prevCutoff = toStr(row.previous_year_cutoff ?? row.Previous_Year_Cutoff ?? getCellByKeyword(row, 'previous_year'));
          const ranks = toStr(row.ranks_percentiles ?? row.Ranks_Percentiles ?? getCellByKeyword(row, 'ranks_percentile'));
          const rawCat = row.category_wise_cutoff ?? row.Category_Wise_Cutoff ?? getCellByKeyword(row, 'category_wise') ?? getCellByKeyword(row, 'category');
          const catCutoff = (rawCat != null && rawCat !== '') ? (typeof rawCat === 'object' ? JSON.stringify(rawCat) : String(rawCat).trim()) : null;
          const targetRank = toStr(row.target_rank_range ?? row.Target_Rank_Range ?? getCellByKeyword(row, 'target_rank'));
          if (prevCutoff || ranks || catCutoff || targetRank) {
            await ExamCutoff.create({
              exam_id: examId,
              previous_year_cutoff: prevCutoff,
              ranks_percentiles: ranks,
              category_wise_cutoff: catCutoff,
              target_rank_range: targetRank
            });
          }
        } catch (e) {
          errors.push({ row: rowNum, message: `cutoff: ${e.message}` });
        }

        try {
          const careerRes = await resolveCareerGoalIds(row, allCareerGoals);
          if (careerRes.notFound.length > 0) {
            errors.push({ row: rowNum, message: `career goals: not found: ${careerRes.notFound.join(', ')}` });
          }
          if (careerRes.ids.length > 0) {
            await ExamCareerGoal.setCareerGoalsForExam(examId, careerRes.ids);
          }
        } catch (e) {
          errors.push({ row: rowNum, message: `career goals: ${e.message}` });
        }
      }

      res.json({
        success: true,
        data: {
          created: created.length,
          createdExams: created,
          errors: errors.length,
          errorDetails: errors
        },
        message: `Created ${created.length} exam(s).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`
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

module.exports = ExamsTaxonomyController;

