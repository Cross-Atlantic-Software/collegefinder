const XLSX = require('xlsx');
const db = require('../../config/database');
const Institute = require('../../models/institute/Institute');
const InstituteExam = require('../../models/institute/InstituteExam');
const InstituteExamSpecialization = require('../../models/institute/InstituteExamSpecialization');
const { resolveExamNamesToIds } = require('../../utils/resolveExamNamesToIds');

function cell(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return String(row[k]).trim();
    }
  }
  return '';
}

class CoachingExamsMappingController {
  static async getAll(req, res) {
    try {
      const result = await db.query(
        `SELECT i.id,
                COALESCE(TRIM(i.institute_cityname), '') AS institute_cityname,
                (SELECT string_agg(e.name, ', ' ORDER BY e.name)
                   FROM institute_exams ie
                   JOIN exams_taxonomies e ON e.id = ie.exam_id
                   WHERE ie.institute_id = i.id) AS exam_names,
                (SELECT string_agg(e.name, ', ' ORDER BY e.name)
                   FROM institute_exam_specialization isx
                   JOIN exams_taxonomies e ON e.id = isx.exam_id
                   WHERE isx.institute_id = i.id) AS specialization_exam_names
         FROM institutes i
         WHERE i.institute_cityname IS NOT NULL AND TRIM(i.institute_cityname) <> ''
         ORDER BY i.institute_cityname ASC`
      );
      res.json({ success: true, data: { mappings: result.rows } });
    } catch (error) {
      console.error('Error fetching coaching exams mappings:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch mappings' });
    }
  }

  static async downloadTemplate(req, res) {
    try {
      const headers = ['institute_cityname', 'exams', 'specialization_exams'];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        ["BYJU's, Bengaluru", 'JEE Main, NEET', 'JEE Advanced'],
        ['Allen, Kota', 'JEE Main', ''],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Mapping');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=coaching-exams-mapping-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating coaching exams mapping template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  static async downloadAllExcel(req, res) {
    try {
      const result = await db.query(
        `SELECT COALESCE(TRIM(i.institute_cityname), '') AS institute_cityname,
                COALESCE((SELECT string_agg(e.name, ', ' ORDER BY e.name)
                   FROM institute_exams ie
                   JOIN exams_taxonomies e ON e.id = ie.exam_id
                   WHERE ie.institute_id = i.id), '') AS exams,
                COALESCE((SELECT string_agg(e.name, ', ' ORDER BY e.name)
                   FROM institute_exam_specialization isx
                   JOIN exams_taxonomies e ON e.id = isx.exam_id
                   WHERE isx.institute_id = i.id), '') AS specialization_exams
         FROM institutes i
         WHERE i.institute_cityname IS NOT NULL AND TRIM(i.institute_cityname) <> ''
         ORDER BY i.institute_cityname ASC`
      );
      const headers = ['institute_cityname', 'exams', 'specialization_exams'];
      const dataRows = result.rows.map((r) => [r.institute_cityname, r.exams, r.specialization_exams]);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Mapping');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=coaching-exams-mapping.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error exporting coaching exams mapping:', error);
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

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (!rows.length) {
        return res.status(400).json({ success: false, message: 'Excel file has no data rows.' });
      }

      const upserted = [];
      const errors = [];
      const lastByCity = new Map();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const cityName = cell(
          row,
          'institute_cityname',
          'Institute Cityname',
          'INSTITUTE_CITYNAME',
          'institute_city_name'
        );
        const examsCell = cell(row, 'exams', 'Exams', 'EXAMS');
        const specCell = cell(
          row,
          'specialization_exams',
          'Specialization Exams',
          'SPECIALIZATION_EXAMS',
          'specialization exams'
        );

        if (!cityName) {
          errors.push({ row: rowNum, message: 'institute_cityname is required' });
          continue;
        }
        const key = cityName.toLowerCase();
        lastByCity.set(key, { rowNum, cityName, examsCell, specCell });
      }

      for (const { rowNum, cityName, examsCell, specCell } of lastByCity.values()) {
        const institute = await Institute.findByInstituteCityName(cityName);
        if (!institute) {
          errors.push({
            row: rowNum,
            message: `Institute not found for institute_cityname: "${cityName}"`,
          });
          continue;
        }

        const mainResolved = await resolveExamNamesToIds(examsCell);
        if (mainResolved.unknown.length) {
          errors.push({
            row: rowNum,
            message: `exam(s) not found: ${mainResolved.unknown.map((n) => `"${n}"`).join(', ')}`,
          });
          continue;
        }
        const specResolved = await resolveExamNamesToIds(specCell);
        if (specResolved.unknown.length) {
          errors.push({
            row: rowNum,
            message: `specialization exam(s) not found: ${specResolved.unknown.map((n) => `"${n}"`).join(', ')}`,
          });
          continue;
        }

        await InstituteExam.setExamsForInstitute(institute.id, mainResolved.ids);
        await InstituteExamSpecialization.setSpecializationsForInstitute(institute.id, specResolved.ids);
        upserted.push({
          id: institute.id,
          institute_cityname: cityName,
          examCount: mainResolved.ids.length,
          specializationExamCount: specResolved.ids.length,
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
            ? `Saved ${upserted.length} coaching exam mapping(s).`
            : `Saved ${upserted.length} mapping(s); ${errors.length} row(s) had errors.`,
      });
    } catch (error) {
      console.error('Error bulk uploading coaching exams mappings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to import mappings',
      });
    }
  }

  static async deleteOne(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid institute id' });
      }
      const inst = await Institute.findById(id);
      if (!inst) {
        return res.status(404).json({ success: false, message: 'Institute not found' });
      }
      await InstituteExam.deleteByInstituteId(id);
      await InstituteExamSpecialization.deleteByInstituteId(id);
      res.json({ success: true, message: 'Coaching exam links cleared for this institute' });
    } catch (error) {
      console.error('Error deleting coaching exams mapping:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete mapping' });
    }
  }

  static async deleteAll(req, res) {
    try {
      const r1 = await db.query('DELETE FROM institute_exams');
      const r2 = await db.query('DELETE FROM institute_exam_specialization');
      const n = (r1.rowCount || 0) + (r2.rowCount || 0);
      res.json({
        success: true,
        data: { deletedLinks: n },
        message: n === 0 ? 'No coaching exam links to delete.' : `Removed ${n} coaching exam link row(s).`,
      });
    } catch (error) {
      console.error('Error deleting all coaching exams mappings:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete mappings' });
    }
  }
}

module.exports = CoachingExamsMappingController;
