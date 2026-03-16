const User = require('../../models/user/User');
const UserAcademics = require('../../models/user/UserAcademics');
const StrengthResult = require('../../models/strength/StrengthResult');
const StrengthPayment = require('../../models/strength/StrengthPayment');
const AdmissionExpert = require('../../models/admission/AdmissionExpert');
const { calculateAgeFromDOB } = require('../../utils/dateUtils');
const XLSX = require('xlsx');
const db = require('../../config/database');
const { parsePdfsFromZip } = require('../../utils/logoUploadUtils');

class CounsellorController {
  /**
   * GET /api/admin/counsellor/search/:userId
   * Search student by ID, return basic info
   */
  static async searchStudent(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      const academics = await UserAcademics.findByUserId(userId);
      const payment = await StrengthPayment.findByUserId(userId);
      const existingResults = await StrengthResult.findByUserId(userId);

      const classInfo = academics?.is_pursuing_12th ? '12th (Pursuing)' :
        academics?.postmatric_passing_year ? '12th' :
        academics?.matric_passing_year ? '10th' : null;

      const age = calculateAgeFromDOB(user.date_of_birth);

      res.json({
        success: true,
        data: {
          student: {
            id: user.id,
            name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            email: user.email,
            phone: user.phone_number,
            class_info: classInfo,
            school: academics?.postmatric_school_name || academics?.matric_school_name || null,
            age,
            profile_photo: user.profile_photo
          },
          payment_status: payment?.payment_status || 'not_paid',
          has_existing_results: !!existingResults,
          existing_results: existingResults
        }
      });
    } catch (error) {
      console.error('Error searching student:', error);
      res.status(500).json({ success: false, message: 'Failed to search student' });
    }
  }

  /**
   * POST /api/admin/counsellor/results
   * Submit strength results for a student
   * Body: { user_id, strengths: [...], career_recommendations: [...] }
   * File: report (PDF)
   */
  static async submitResults(req, res) {
    try {
      const { user_id, strengths, career_recommendations, assigned_expert_id, assigned_expert_ids } = req.body;

      if (!user_id) {
        return res.status(400).json({ success: false, message: 'user_id is required' });
      }

      const userId = parseInt(user_id, 10);
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      let parsedStrengths = strengths;
      let parsedCareerRecs = career_recommendations;
      if (typeof strengths === 'string') {
        try { parsedStrengths = JSON.parse(strengths); } catch (_) {}
      }
      if (typeof career_recommendations === 'string') {
        try { parsedCareerRecs = JSON.parse(career_recommendations); } catch (_) {}
      }

      let expertIds = [];
      if (assigned_expert_ids !== undefined) {
        const parsed = typeof assigned_expert_ids === 'string' ? JSON.parse(assigned_expert_ids || '[]') : (assigned_expert_ids || []);
        expertIds = Array.isArray(parsed) ? parsed.map(id => parseInt(id, 10)).filter(n => !isNaN(n)) : [];
      } else if (assigned_expert_id !== undefined && assigned_expert_id !== '' && assigned_expert_id != null) {
        const single = parseInt(assigned_expert_id, 10);
        if (!isNaN(single)) expertIds = [single];
      }

      let reportUrl = null;
      if (req.file) {
        const base64 = req.file.buffer.toString('base64');
        reportUrl = `data:${req.file.mimetype};base64,${base64}`;
      }

      const result = await StrengthResult.upsert({
        user_id: userId,
        counsellor_admin_id: req.admin.id,
        strengths: parsedStrengths || [],
        career_recommendations: parsedCareerRecs || [],
        report_url: reportUrl,
        assigned_expert_ids: expertIds
      });

      res.json({
        success: true,
        message: 'Results saved successfully',
        data: { result }
      });
    } catch (error) {
      console.error('Error submitting results:', error);
      res.status(500).json({ success: false, message: 'Failed to save results' });
    }
  }

  /**
   * GET /api/admin/counsellor/results/:userId
   */
  static async getResults(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }

      const results = await StrengthResult.findByUserId(userId);
      res.json({
        success: true,
        data: { results: results || null }
      });
    } catch (error) {
      console.error('Error fetching results:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch results' });
    }
  }

  /**
   * PUT /api/admin/counsellor/results/:userId
   */
  static async updateResults(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }

      const { strengths, career_recommendations, assigned_expert_id, assigned_expert_ids } = req.body;

      let parsedStrengths = strengths;
      let parsedCareerRecs = career_recommendations;
      if (typeof strengths === 'string') {
        try { parsedStrengths = JSON.parse(strengths); } catch (_) {}
      }
      if (typeof career_recommendations === 'string') {
        try { parsedCareerRecs = JSON.parse(career_recommendations); } catch (_) {}
      }

      let expertIds = [];
      if (assigned_expert_ids !== undefined) {
        const parsed = typeof assigned_expert_ids === 'string' ? JSON.parse(assigned_expert_ids || '[]') : (assigned_expert_ids || []);
        expertIds = Array.isArray(parsed) ? parsed.map(id => parseInt(id, 10)).filter(n => !isNaN(n)) : [];
      } else if (assigned_expert_id !== undefined && assigned_expert_id !== '' && assigned_expert_id != null) {
        const single = parseInt(assigned_expert_id, 10);
        if (!isNaN(single)) expertIds = [single];
      }

      const updateData = {
        counsellor_admin_id: req.admin.id,
      };
      if (parsedStrengths !== undefined) updateData.strengths = parsedStrengths;
      if (parsedCareerRecs !== undefined) updateData.career_recommendations = parsedCareerRecs;
      if (assigned_expert_ids !== undefined || assigned_expert_id !== undefined) updateData.assigned_expert_ids = expertIds;

      if (req.file) {
        const base64 = req.file.buffer.toString('base64');
        updateData.report_url = `data:${req.file.mimetype};base64,${base64}`;
      }

      const result = await StrengthResult.update(userId, updateData);
      if (!result) {
        return res.status(404).json({ success: false, message: 'No existing results to update' });
      }

      res.json({
        success: true,
        message: 'Results updated successfully',
        data: { result }
      });
    } catch (error) {
      console.error('Error updating results:', error);
      res.status(500).json({ success: false, message: 'Failed to update results' });
    }
  }

  /**
   * GET /api/admin/counsellor/bulk-upload-template
   * Download bulk upload Excel template
   */
  static async downloadBulkTemplate(req, res) {
    try {
      const wb = XLSX.utils.book_new();
      const headers = [
        'user_id',
        'strength_1',
        'strength_2',
        'strength_3',
        'strength_4',
        'strength_5',
        'career_1_name',
        'career_1_details',
        'career_2_name',
        'career_2_details',
        'career_3_name',
        'career_3_details',
        'career_4_name',
        'career_4_details',
        'career_5_name',
        'career_5_details',
        'assigned_consultant_names',
        'report_file_name'
      ];
      const exampleRow = [
        '123',
        'Leadership',
        'Analytical thinking',
        'Creative problem solving',
        'Communication',
        'Time management',
        'Software Engineer',
        'Strong fit for tech industry with problem-solving skills',
        'Data Analyst',
        'Good analytical and communication abilities',
        'Product Manager',
        'Leadership and strategic thinking strengths',
        '',
        '',
        '',
        '',
        'John Doe, Jane Smith',
        '123.pdf'
      ];
      const data = [headers, exampleRow];
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [
        { wch: 10 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 25 },
        { wch: 40 },
        { wch: 25 },
        { wch: 40 },
        { wch: 25 },
        { wch: 40 },
        { wch: 25 },
        { wch: 40 },
        { wch: 25 },
        { wch: 40 },
        { wch: 30 },
        { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Strength Results');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=strength-results-bulk-template.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Error generating template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  /**
   * GET /api/admin/counsellor/download-excel
   * Download all strength results as Excel
   */
  static async downloadAllExcel(req, res) {
    try {
      const result = await db.query(
        `SELECT sr.id, sr.user_id, u.name as student_name, u.email as student_email, u.phone_number as student_phone,
                sr.strengths, sr.career_recommendations, sr.assigned_expert_ids, sr.report_file_name,
                sr.counsellor_admin_id, au.email as counsellor_email, sr.created_at, sr.updated_at
         FROM strength_results sr
         LEFT JOIN users u ON sr.user_id = u.id
         LEFT JOIN admin_users au ON sr.counsellor_admin_id = au.id
         ORDER BY sr.created_at DESC`
      );

      const allExpertIds = [...new Set(result.rows.flatMap(r => (r.assigned_expert_ids && Array.isArray(r.assigned_expert_ids) ? r.assigned_expert_ids : [])))];
      const expertIdToName = {};
      if (allExpertIds.length > 0) {
        const experts = await AdmissionExpert.findAll();
        experts.forEach(e => { expertIdToName[e.id] = e.name || ''; });
      }

      const rows = result.rows.map(row => {
        const strengths = Array.isArray(row.strengths) ? row.strengths : (typeof row.strengths === 'string' ? JSON.parse(row.strengths) : []);
        const careers = Array.isArray(row.career_recommendations) ? row.career_recommendations : (typeof row.career_recommendations === 'string' ? JSON.parse(row.career_recommendations) : []);
        const ids = row.assigned_expert_ids && Array.isArray(row.assigned_expert_ids) ? row.assigned_expert_ids : [];
        const assigned_consultant_names = ids.map(id => expertIdToName[id] || '').filter(Boolean).join(', ');
        return {
          id: row.id,
          user_id: row.user_id,
          student_name: row.student_name || '',
          student_email: row.student_email || '',
          student_phone: row.student_phone || '',
          strength_1: strengths[0] || '',
          strength_2: strengths[1] || '',
          strength_3: strengths[2] || '',
          strength_4: strengths[3] || '',
          strength_5: strengths[4] || '',
          career_1_name: careers[0]?.career || '',
          career_1_details: careers[0]?.details || '',
          career_2_name: careers[1]?.career || '',
          career_2_details: careers[1]?.details || '',
          career_3_name: careers[2]?.career || '',
          career_3_details: careers[2]?.details || '',
          career_4_name: careers[3]?.career || '',
          career_4_details: careers[3]?.details || '',
          career_5_name: careers[4]?.career || '',
          career_5_details: careers[4]?.details || '',
          assigned_consultant_names,
          report_file_name: row.report_file_name || '',
          counsellor_email: row.counsellor_email || '',
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 8 },
        { wch: 10 },
        { wch: 25 },
        { wch: 30 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 25 },
        { wch: 40 },
        { wch: 25 },
        { wch: 40 },
        { wch: 25 },
        { wch: 40 },
        { wch: 25 },
        { wch: 40 },
        { wch: 25 },
        { wch: 40 },
        { wch: 30 },
        { wch: 18 },
        { wch: 30 },
        { wch: 20 },
        { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Strength Results');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=strength-results-all-data.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      res.status(500).json({ success: false, message: 'Failed to download Excel' });
    }
  }

  /**
   * POST /api/admin/counsellor/bulk-upload
   * Bulk upload strength results from Excel; optional reports_zip of PDFs (filenames match report_file_name in Excel).
   */
  static async bulkUpload(req, res) {
    try {
      const excelFile = req.files?.excel?.[0] || req.file;
      if (!excelFile || !excelFile.buffer) {
        return res.status(400).json({ success: false, message: 'No Excel file uploaded. Use field name "excel".' });
      }

      const workbook = XLSX.read(excelFile.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      if (!data || data.length === 0) {
        return res.status(400).json({ success: false, message: 'Excel file is empty' });
      }

      const allExperts = await AdmissionExpert.findAll();
      const nameToId = {};
      allExperts.forEach(e => {
        if (e.name && String(e.name).trim()) {
          const key = String(e.name).trim().toLowerCase();
          if (!nameToId[key]) nameToId[key] = e.id;
        }
      });

      const created = [];
      const errorDetails = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2;

        try {
          const userId = parseInt(row.user_id, 10);
          if (isNaN(userId)) {
            errorDetails.push({ row: rowNum, message: 'Invalid or missing user_id' });
            continue;
          }

          const user = await User.findById(userId);
          if (!user) {
            errorDetails.push({ row: rowNum, message: `User ID ${userId} not found` });
            continue;
          }

          const strengths = [
            row.strength_1,
            row.strength_2,
            row.strength_3,
            row.strength_4,
            row.strength_5
          ].filter(s => s && String(s).trim());

          const careerRecs = [];
          for (let j = 1; j <= 5; j++) {
            const careerName = row[`career_${j}_name`];
            const careerDetails = row[`career_${j}_details`];
            if (careerName && String(careerName).trim()) {
              careerRecs.push({
                career: String(careerName).trim(),
                details: careerDetails ? String(careerDetails).trim() : ''
              });
            }
          }

          let expertIds = [];
          const namesStr = row.assigned_consultant_names || row.assigned_expert_names || '';
          if (namesStr && String(namesStr).trim()) {
            const names = String(namesStr).split(',').map(s => s.trim()).filter(Boolean);
            expertIds = names.map(n => nameToId[n.toLowerCase()]).filter(Boolean);
          } else if (row.assigned_expert_id != null && row.assigned_expert_id !== '') {
            const single = parseInt(row.assigned_expert_id, 10);
            if (!isNaN(single)) expertIds = [single];
          }

          const reportFileName = row.report_file_name != null && String(row.report_file_name).trim() ? String(row.report_file_name).trim() : null;

          const result = await StrengthResult.upsert({
            user_id: userId,
            counsellor_admin_id: req.admin.id,
            strengths,
            career_recommendations: careerRecs,
            report_url: null,
            assigned_expert_ids: expertIds,
            report_file_name: reportFileName
          });

          created.push({ id: result.id, user_id: userId, student_name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() });
        } catch (err) {
          console.error(`Error processing row ${rowNum}:`, err);
          errorDetails.push({ row: rowNum, message: err.message || 'Unknown error' });
        }
      }

      let reportsAdded = 0;
      const reportsZip = req.files?.reports_zip?.[0];
      if (reportsZip && reportsZip.buffer) {
        const pdfMap = parsePdfsFromZip(reportsZip.buffer);
        for (const [, file] of pdfMap) {
          const rows = await StrengthResult.findByReportFileName(file.originalname);
          if (rows.length === 0) continue;
          const base64 = file.buffer.toString('base64');
          const reportUrl = `data:application/pdf;base64,${base64}`;
          for (const row of rows) {
            await StrengthResult.update(row.user_id, { report_url: reportUrl });
            reportsAdded++;
          }
        }
      }

      let message = `Created/updated ${created.length} result(s), ${errorDetails.length} error(s)`;
      if (reportsAdded > 0) message += `; ${reportsAdded} report PDF(s) attached.`;

      res.json({
        success: true,
        message,
        data: {
          created: created.length,
          createdResults: created,
          errors: errorDetails.length,
          errorDetails,
          reportsAdded: reportsAdded || undefined
        }
      });
    } catch (error) {
      console.error('Error bulk upload:', error);
      res.status(500).json({ success: false, message: 'Bulk upload failed' });
    }
  }

  /**
   * POST /api/admin/counsellor/upload-report-pdfs
   * Upload a ZIP of report PDFs; filenames must match report_file_name on strength_results.
   */
  static async uploadReportPdfs(req, res) {
    try {
      const zipFile = req.files?.reports_zip?.[0] || req.file;
      if (!zipFile || !zipFile.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No ZIP file uploaded. Use field name "reports_zip".'
        });
      }

      const pdfMap = parsePdfsFromZip(zipFile.buffer);
      if (pdfMap.size === 0) {
        return res.status(400).json({
          success: false,
          message: 'ZIP contains no PDF files. Add .pdf files named to match report_file_name in your data.'
        });
      }

      const updated = [];
      const skipped = [];
      const errors = [];

      for (const [, file] of pdfMap) {
        const rows = await StrengthResult.findByReportFileName(file.originalname);
        if (!rows || rows.length === 0) {
          skipped.push(file.originalname);
          continue;
        }
        try {
          const base64 = file.buffer.toString('base64');
          const reportUrl = `data:application/pdf;base64,${base64}`;
          for (const row of rows) {
            await StrengthResult.update(row.user_id, { report_url: reportUrl });
            updated.push({ user_id: row.user_id, report_file_name: file.originalname });
          }
        } catch (err) {
          errors.push({ file: file.originalname, message: err.message || 'Update failed' });
        }
      }

      res.json({
        success: true,
        message: `Attached ${updated.length} report(s); ${skipped.length} file(s) skipped (no matching report_file_name).`,
        data: {
          summary: { reportsAdded: updated.length, filesSkipped: skipped.length, uploadErrors: errors.length },
          updated,
          skipped,
          errors
        }
      });
    } catch (error) {
      console.error('Error uploading report PDFs:', error);
      res.status(500).json({ success: false, message: 'Failed to upload report PDFs' });
    }
  }
}

module.exports = CounsellorController;
