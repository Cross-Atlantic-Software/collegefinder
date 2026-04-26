const XLSX = require('xlsx');
const Stream = require('../../models/taxonomy/Stream');
const CareerGoal = require('../../models/taxonomy/CareerGoal');
const Program = require('../../models/taxonomy/Program');
const Exam = require('../../models/taxonomy/Exam');
const StreamInterestRecommendation = require('../../models/mapping/StreamInterestRecommendation');

function splitMulti(value) {
  if (value == null) return [];
  const s = String(value).trim();
  if (!s) return [];
  return s
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function cell(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return String(row[k]).trim();
    }
  }
  return '';
}

class RecommendedMappingController {
  static async getAll(req, res) {
    try {
      const rows = await StreamInterestRecommendation.findAll();
      res.json({ success: true, data: { mappings: rows } });
    } catch (error) {
      console.error('Error fetching stream–interest recommended mappings:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch mappings' });
    }
  }

  static async downloadTemplate(req, res) {
    try {
      const headers = ['Stream', 'Interest', 'Programs', 'Exams'];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        [
          'Engineering',
          'Computer Science',
          'B.Tech, B.E. Computer Science',
          'JEE Main, JEE Advanced',
        ],
        [
          'Engineering',
          'Mechanical Engineering',
          'B.Tech Mechanical',
          'BITSAT',
        ],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Mapping');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=recommended-exams-mapping-template.xlsx'
      );
      res.send(buf);
    } catch (error) {
      console.error('Error generating recommended mapping template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
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

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (!rows.length) {
        return res.status(400).json({ success: false, message: 'Excel file has no data rows.' });
      }

      const upserted = [];
      const errors = [];
      /** Last row for a given stream+interest pair wins (Excel fix rows at bottom). */
      const lastByPair = new Map();
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        const streamName = cell(row, 'stream', 'Stream', 'STREAM');
        const interestName = cell(row, 'interest', 'Interest', 'INTEREST');
        const programsCell = cell(row, 'programs', 'Programs', 'PROGRAMS', 'Program(s)');
        const examsCell = cell(row, 'exams', 'Exams', 'EXAMS', 'Exam(s)');

        if (!streamName) {
          errors.push({ row: rowNum, message: 'Stream is required' });
          continue;
        }
        if (!interestName) {
          errors.push({ row: rowNum, message: 'Interest is required' });
          continue;
        }

        const stream = await Stream.findByName(streamName);
        if (!stream) {
          errors.push({ row: rowNum, message: `Stream not found: "${streamName}"` });
          continue;
        }

        const interest = await CareerGoal.findByStreamIdAndLabel(stream.id, interestName);
        if (!interest) {
          errors.push({
            row: rowNum,
            message: `Interest not found for this stream: "${interestName}" (stream: "${streamName}")`,
          });
          continue;
        }

        const key = `${stream.id}:${interest.id}`;
        lastByPair.set(key, {
          rowNum,
          stream,
          interest,
          streamName,
          interestName,
          programsCell,
          examsCell,
        });
      }

      for (const {
        rowNum,
        stream,
        interest,
        streamName,
        interestName,
        programsCell,
        examsCell,
      } of lastByPair.values()) {
        const programNames = splitMulti(programsCell);
        const examNames = splitMulti(examsCell);
        const programIds = [];
        const examIds = [];
        const missingPrograms = [];
        const missingExams = [];

        for (const name of programNames) {
          const p = await Program.findByNameCaseInsensitive(name);
          if (p) programIds.push(p.id);
          else missingPrograms.push(name);
        }
        for (const name of examNames) {
          const e = await Exam.findByName(name);
          if (e) examIds.push(e.id);
          else missingExams.push(name);
        }

        if (missingPrograms.length) {
          errors.push({
            row: rowNum,
            message: `Program(s) not found: ${missingPrograms.map((n) => `"${n}"`).join(', ')}`,
          });
          continue;
        }
        if (missingExams.length) {
          errors.push({
            row: rowNum,
            message: `Exam(s) not found: ${missingExams.map((n) => `"${n}"`).join(', ')}`,
          });
          continue;
        }

        const saved = await StreamInterestRecommendation.upsert(
          stream.id,
          interest.id,
          programIds,
          examIds
        );
        upserted.push({
          id: saved.id,
          stream: streamName,
          interest: interestName,
          programCount: programIds.length,
          examCount: examIds.length,
        });
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
            ? `Saved ${upserted.length} mapping(s).`
            : `Saved ${upserted.length} mapping(s); ${errors.length} row(s) had errors.`,
      });
    } catch (error) {
      console.error('Error bulk uploading recommended mappings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to import mappings',
      });
    }
  }
}

module.exports = RecommendedMappingController;
