const XLSX = require('xlsx');
const db = require('../../config/database');
const Scholarship = require('../../models/scholarship/Scholarship');
const ScholarshipExam = require('../../models/scholarship/ScholarshipExam');
const ScholarshipCollege = require('../../models/scholarship/ScholarshipCollege');
const College = require('../../models/college/College');
const { splitList } = require('../../utils/bulkUploadUtils');
const { resolveExamNamesToIds } = require('../../utils/resolveExamNamesToIds');

function cell(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return String(row[k]).trim();
    }
  }
  return '';
}

/** Excel/CSV often prefixes the first header with a BOM; keys may have trailing spaces. */
function normalizeExcelRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      const key = String(k).replace(/^\ufeff/g, '').trim();
      out[key] = v;
    }
    return out;
  });
}

function normalizeHeaderKey(k) {
  return String(k || '')
    .toLowerCase()
    .replace(/\ufeff/g, '')
    .replace(/[\s_-]+/g, '');
}

/** Accepts scholarship_names, scholarships_names (template), and similar headers. */
function pickScholarshipNameFromRow(row) {
  const direct = cell(
    row,
    'scholarship_names',
    'scholarships_names',
    'scholarship_name',
    'scholarships_name',
    'Scholarship Names',
    'Scholarships Names',
    'SCHOLARSHIP_NAMES',
    'SCHOLARSHIPS_NAMES',
    'Scholarship',
    'scholarship'
  );
  if (direct) return direct;
  for (const key of Object.keys(row)) {
    const nk = normalizeHeaderKey(key);
    if (
      nk === 'scholarshipnames' ||
      nk === 'scholarshipsnames' ||
      (nk.includes('scholarship') && nk.includes('name'))
    ) {
      const raw = row[key];
      if (raw != null && String(raw).trim() !== '') return String(raw).trim();
    }
  }
  return '';
}

async function resolveCollegeNamesToIds(namesStr) {
  if (namesStr == null) return { ids: [], unknown: [] };
  const names = splitList(namesStr);
  if (!names.length) return { ids: [], unknown: [] };
  const map = await College.findIdMapByCollegeNamesLowercase(names);
  const ids = [];
  const unknown = [];
  for (const nm of names) {
    const key = nm.trim().toLowerCase();
    if (!key) continue;
    if (map.has(key)) ids.push(map.get(key));
    else unknown.push(nm);
  }
  return { ids, unknown };
}

class ScholarshipExamsCollegesMappingController {
  static async getAll(req, res) {
    try {
      const result = await db.query(
        `SELECT s.id,
                s.scholarship_name,
                (SELECT string_agg(e.name, ', ' ORDER BY e.name)
                   FROM scholarship_exams se
                   JOIN exams_taxonomies e ON e.id = se.exam_id
                   WHERE se.scholarship_id = s.id) AS exam_names,
                (SELECT string_agg(c.college_name, ', ' ORDER BY c.college_name)
                   FROM scholarship_colleges sc
                   JOIN colleges c ON c.id = sc.college_id
                   WHERE sc.scholarship_id = s.id) AS college_names
         FROM scholarships s
         ORDER BY s.scholarship_name ASC`
      );
      res.json({ success: true, data: { mappings: result.rows } });
    } catch (error) {
      console.error('Error fetching scholarship exams/colleges mappings:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch mappings' });
    }
  }

  static async downloadTemplate(req, res) {
    try {
      const headers = ['scholarship_names', 'exams', 'colleges'];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        ['National Merit Scholarship', 'JEE Main, NEET', 'IIT Delhi, IIT Bombay'],
        ['State Engineering Scholarship', 'JEE Main', ''],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Mapping');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=scholarship-exams-colleges-mapping-template.xlsx'
      );
      res.send(buf);
    } catch (error) {
      console.error('Error generating scholarship mapping template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  static async downloadAllExcel(req, res) {
    try {
      const result = await db.query(
        `SELECT s.scholarship_name AS scholarship_names,
                COALESCE((SELECT string_agg(e.name, ', ' ORDER BY e.name)
                   FROM scholarship_exams se
                   JOIN exams_taxonomies e ON e.id = se.exam_id
                   WHERE se.scholarship_id = s.id), '') AS exams,
                COALESCE((SELECT string_agg(c.college_name, ', ' ORDER BY c.college_name)
                   FROM scholarship_colleges sc
                   JOIN colleges c ON c.id = sc.college_id
                   WHERE sc.scholarship_id = s.id), '') AS colleges
         FROM scholarships s
         ORDER BY s.scholarship_name ASC`
      );
      const headers = ['scholarship_names', 'exams', 'colleges'];
      const dataRows = result.rows.map((r) => [r.scholarship_names, r.exams, r.colleges]);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Mapping');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=scholarship-exams-colleges-mapping.xlsx'
      );
      res.send(buf);
    } catch (error) {
      console.error('Error exporting scholarship mapping:', error);
      res.status(500).json({ success: false, message: 'Failed to export mappings' });
    }
  }

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
      } catch (parseErr) {
        return res.status(400).json({ success: false, message: 'Invalid Excel file or format.' });
      }

      const normSheet = (n) => String(n).toLowerCase().replace(/\s+/g, '');
      const sheetName =
        workbook.SheetNames.find((n) => normSheet(n) === 'mapping') || workbook.SheetNames[0];
      if (!sheetName || !workbook.Sheets[sheetName]) {
        return res.status(400).json({
          success: false,
          message: 'Excel has no usable sheet (expected a sheet named "Mapping" or at least one sheet).',
        });
      }
      const sheet = workbook.Sheets[sheetName];
      const rows = normalizeExcelRows(
        XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
      );
      if (!rows.length) {
        return res.status(400).json({ success: false, message: 'Excel file has no data rows.' });
      }

      const upserted = [];
      const errors = [];
      const lastByName = new Map();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const scholarshipName = pickScholarshipNameFromRow(row);
        const examsCell = cell(row, 'exams', 'exam', 'Exams', 'EXAMS');
        const collegesCell = cell(row, 'colleges', 'college', 'Colleges', 'COLLEGES');

        if (!scholarshipName) {
          errors.push({
            row: rowNum,
            message: 'scholarship_names (or scholarships_names) column is required and must be non-empty',
          });
          continue;
        }
        const key = scholarshipName.toLowerCase();
        lastByName.set(key, { rowNum, scholarshipName, examsCell, collegesCell });
      }

      for (const { rowNum, scholarshipName, examsCell, collegesCell } of lastByName.values()) {
        try {
          const scholarship = await Scholarship.findByName(scholarshipName);
          if (!scholarship) {
            errors.push({
              row: rowNum,
              message: `Scholarship not found: "${scholarshipName}"`,
            });
            continue;
          }

          const examRes = await resolveExamNamesToIds(examsCell);
          if (examRes.unknown.length) {
            errors.push({
              row: rowNum,
              message: `exam(s) not found: ${examRes.unknown.map((n) => `"${n}"`).join(', ')}`,
            });
            continue;
          }
          const colRes = await resolveCollegeNamesToIds(collegesCell);
          if (colRes.unknown.length) {
            errors.push({
              row: rowNum,
              message: `college(s) not found: ${colRes.unknown.map((n) => `"${n}"`).join(', ')}`,
            });
            continue;
          }

          await ScholarshipExam.setExamsForScholarship(scholarship.id, examRes.ids);
          await ScholarshipCollege.setCollegesForScholarship(scholarship.id, colRes.ids);
          upserted.push({
            id: scholarship.id,
            scholarship_name: scholarshipName,
            examCount: examRes.ids.length,
            collegeCount: colRes.ids.length,
          });
        } catch (rowErr) {
          const code = rowErr && rowErr.code ? ` (${rowErr.code})` : '';
          errors.push({
            row: rowNum,
            message: (rowErr && rowErr.message) || `Unexpected error while saving this row${code}`,
          });
        }
      }

      res.json({
        success: true,
        data: {
          upserted: upserted.length,
          rows: upserted,
          errors: errors.length,
          errorDetails: errors,
        },
        message:
          errors.length === 0
            ? `Saved ${upserted.length} scholarship mapping(s).`
            : `Saved ${upserted.length} mapping(s); ${errors.length} row(s) had errors.`,
      });
    } catch (error) {
      console.error('Error bulk uploading scholarship exams/colleges mappings:', error);
      const code = error && error.code ? ` [${error.code}]` : '';
      const detail = error && error.detail ? ` — ${error.detail}` : '';
      res.status(500).json({
        success: false,
        message: `${error.message || 'Failed to import mappings'}${code}${detail}`,
      });
    }
  }

  static async deleteOne(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid scholarship id' });
      }
      const s = await Scholarship.findById(id);
      if (!s) {
        return res.status(404).json({ success: false, message: 'Scholarship not found' });
      }
      await ScholarshipExam.deleteByScholarshipId(id);
      await ScholarshipCollege.deleteByScholarshipId(id);
      res.json({ success: true, message: 'Scholarship exam and college links cleared' });
    } catch (error) {
      console.error('Error deleting scholarship mapping:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete mapping' });
    }
  }

  static async deleteAll(req, res) {
    try {
      const r1 = await db.query('DELETE FROM scholarship_exams');
      const r2 = await db.query('DELETE FROM scholarship_colleges');
      const n = (r1.rowCount || 0) + (r2.rowCount || 0);
      res.json({
        success: true,
        data: { deletedLinks: n },
        message: n === 0 ? 'No links to delete.' : `Removed ${n} scholarship link row(s).`,
      });
    } catch (error) {
      console.error('Error deleting all scholarship mappings:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete mappings' });
    }
  }
}

module.exports = ScholarshipExamsCollegesMappingController;
