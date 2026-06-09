const XLSX = require('xlsx');
const Scholarship = require('../../models/scholarship/Scholarship');
const ScholarshipEligibleCategory = require('../../models/scholarship/ScholarshipEligibleCategory');
const ScholarshipApplicableState = require('../../models/scholarship/ScholarshipApplicableState');
const ScholarshipDocumentsRequired = require('../../models/scholarship/ScholarshipDocumentsRequired');
const ScholarshipExam = require('../../models/scholarship/ScholarshipExam');
const ScholarshipCollege = require('../../models/scholarship/ScholarshipCollege');
const Stream = require('../../models/taxonomy/Stream');
const Exam = require('../../models/taxonomy/Exam');
const College = require('../../models/college/College');
const { splitList, parseDate } = require('../../utils/bulkUploadUtils');

function normalizeStreamIds(value) {
  if (value == null) return [];
  const raw = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      raw
        .map((id) => parseInt(id, 10))
        .filter((n) => Number.isInteger(n) && n > 0)
    ),
  ];
}

function resolveStreamIdsFromBody(body) {
  if (body.stream_ids !== undefined) {
    return normalizeStreamIds(body.stream_ids);
  }
  if (body.stream_id !== undefined && body.stream_id !== null && body.stream_id !== '') {
    return normalizeStreamIds([body.stream_id]);
  }
  return undefined;
}

async function resolveStreamNameToId(nameStr) {
  if (!nameStr || typeof nameStr !== 'string') return null;
  const name = nameStr.trim();
  if (!name) return null;
  const stream = await Stream.findByName(name);
  return stream ? stream.id : null;
}

async function resolveStreamNamesToIds(nameStr) {
  const names = splitList(nameStr);
  if (!names.length) return [];
  const ids = [];
  for (const name of names) {
    const id = await resolveStreamNameToId(name);
    if (id == null) {
      return { error: `stream not found: "${name}"` };
    }
    ids.push(id);
  }
  return { ids: [...new Set(ids)] };
}

async function loadStreamNamesForScholarship(scholarship) {
  const streamIds = normalizeStreamIds(scholarship?.stream_ids);
  if (!streamIds.length) {
    return { streamIds: [], streamNames: [], streamName: null };
  }
  const streamRows = await Stream.findByIds(streamIds);
  const nameById = new Map(streamRows.map((s) => [s.id, s.name]));
  const streamNames = streamIds
    .map((id) => nameById.get(id))
    .filter((name) => name != null && String(name).trim());
  return {
    streamIds,
    streamNames,
    streamName: streamNames.length ? streamNames.join(', ') : null,
  };
}

class ScholarshipsController {
  static async getAllAdmin(req, res) {
    try {
      const scholarships = await Scholarship.findAll();
      res.json({ success: true, data: { scholarships } });
    } catch (error) {
      console.error('Error fetching scholarships:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch scholarships' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const scholarshipId = parseInt(id);
      const scholarship = await Scholarship.findById(scholarshipId);
      if (!scholarship) {
        return res.status(404).json({ success: false, message: 'Scholarship not found' });
      }
      const [eligibleCategories, applicableStates, documentsRequired, examIds, collegeIds] = await Promise.all([
        ScholarshipEligibleCategory.findByScholarshipId(scholarshipId),
        ScholarshipApplicableState.findByScholarshipId(scholarshipId),
        ScholarshipDocumentsRequired.findByScholarshipId(scholarshipId),
        ScholarshipExam.getExamIdsByScholarshipId(scholarshipId),
        ScholarshipCollege.getCollegeIdsByScholarshipId(scholarshipId)
      ]);

      let streamName = null;
      let streamNames = [];
      const streamInfo = await loadStreamNamesForScholarship(scholarship);
      streamName = streamInfo.streamName;
      streamNames = streamInfo.streamNames;
      const examNames = [];
      for (const eid of examIds || []) {
        const ex = await Exam.findById(eid);
        if (ex && ex.name) examNames.push(ex.name);
      }
      const collegeNames = [];
      for (const cid of collegeIds || []) {
        const col = await College.findById(cid);
        if (col && col.college_name) collegeNames.push(col.college_name);
      }

      res.json({
        success: true,
        data: {
          scholarship,
          streamName,
          streamNames,
          eligibleCategories: eligibleCategories || [],
          applicableStates: applicableStates || [],
          documentsRequired: documentsRequired || [],
          examIds: examIds || [],
          examNames,
          collegeIds: collegeIds || [],
          collegeNames
        }
      });
    } catch (error) {
      console.error('Error fetching scholarship:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch scholarship' });
    }
  }

  static async create(req, res) {
    try {
      const {
        scholarship_name,
        conducting_authority,
        scholarship_type,
        description,
        stream_id,
        income_limit,
        minimum_marks_required,
        scholarship_amount,
        selection_process,
        application_start_date,
        application_end_date,
        mode,
        official_website,
        official_notification_link,
        application_link,
        active_status,
        academic_year,
        eligible_degree,
        number_of_awards,
        renewal_available,
        renewal_conditions,
        scope,
        value_category,
        education_level,
        eligibleCategories,
        applicableStates,
        documentsRequired
      } = req.body;

      if (!scholarship_name || !scholarship_name.trim()) {
        return res.status(400).json({ success: false, message: 'Scholarship name is required' });
      }

      const existing = await Scholarship.findByName(scholarship_name.trim());
      if (existing) {
        return res.status(400).json({ success: false, message: 'Scholarship with this name already exists' });
      }

      const scholarship = await Scholarship.create({
        scholarship_name: scholarship_name.trim(),
        conducting_authority: conducting_authority ? conducting_authority.trim() : null,
        scholarship_type: scholarship_type ? scholarship_type.trim() : null,
        description: description ? description.trim() : null,
        stream_ids: resolveStreamIdsFromBody(req.body) ?? [],
        income_limit: income_limit != null ? String(income_limit).trim() : null,
        minimum_marks_required: minimum_marks_required != null ? String(minimum_marks_required).trim() : null,
        scholarship_amount: scholarship_amount != null ? String(scholarship_amount).trim() : null,
        selection_process: selection_process ? selection_process.trim() : null,
        application_start_date: application_start_date || null,
        application_end_date: application_end_date || null,
        mode: mode ? mode.trim() : null,
        official_website: official_website ? official_website.trim() : null,
        official_notification_link: official_notification_link ? official_notification_link.trim() : null,
        application_link: application_link ? application_link.trim() : null,
        active_status: active_status ? active_status.trim() : 'active',
        academic_year: academic_year ? academic_year.trim() : null,
        eligible_degree: eligible_degree ? eligible_degree.trim() : null,
        number_of_awards: number_of_awards != null ? String(number_of_awards).trim() : null,
        renewal_available: renewal_available != null ? renewal_available : false,
        renewal_conditions: renewal_conditions ? renewal_conditions.trim() : null,
        scope: scope ? scope.trim() : null,
        value_category: value_category ? value_category.trim() : null,
        education_level: education_level ? education_level.trim() : null
      });

      if (eligibleCategories && Array.isArray(eligibleCategories)) {
        for (const item of eligibleCategories) {
          if (item.category != null && String(item.category).trim()) {
            await ScholarshipEligibleCategory.create({
              scholarship_id: scholarship.id,
              category: String(item.category).trim()
            });
          }
        }
      }
      if (applicableStates && Array.isArray(applicableStates)) {
        for (const item of applicableStates) {
          if (item.state_name != null && String(item.state_name).trim()) {
            await ScholarshipApplicableState.create({
              scholarship_id: scholarship.id,
              state_name: String(item.state_name).trim()
            });
          }
        }
      }
      if (documentsRequired && Array.isArray(documentsRequired)) {
        for (const item of documentsRequired) {
          if (item.document_name != null && String(item.document_name).trim()) {
            await ScholarshipDocumentsRequired.create({
              scholarship_id: scholarship.id,
              document_name: String(item.document_name).trim()
            });
          }
        }
      }

      res.status(201).json({
        success: true,
        data: { scholarship },
        message: 'Scholarship created successfully'
      });
    } catch (error) {
      console.error('Error creating scholarship:', error);
      res.status(500).json({ success: false, message: 'Failed to create scholarship' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const scholarshipId = parseInt(id);
      const existing = await Scholarship.findById(scholarshipId);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Scholarship not found' });
      }

      const {
        scholarship_name,
        conducting_authority,
        scholarship_type,
        description,
        stream_id,
        income_limit,
        minimum_marks_required,
        scholarship_amount,
        selection_process,
        application_start_date,
        application_end_date,
        mode,
        official_website,
        official_notification_link,
        application_link,
        active_status,
        academic_year,
        eligible_degree,
        number_of_awards,
        renewal_available,
        renewal_conditions,
        scope,
        value_category,
        education_level,
        eligibleCategories,
        applicableStates,
        documentsRequired
      } = req.body;

      if (scholarship_name && scholarship_name.trim() !== existing.scholarship_name) {
        const dup = await Scholarship.findByName(scholarship_name.trim());
        if (dup) {
          return res.status(400).json({ success: false, message: 'Scholarship with this name already exists' });
        }
      }

      const resolvedStreamIds = resolveStreamIdsFromBody(req.body);

      await Scholarship.update(scholarshipId, {
        scholarship_name: scholarship_name !== undefined ? scholarship_name.trim() : undefined,
        conducting_authority: conducting_authority !== undefined ? (conducting_authority && conducting_authority.trim()) || null : undefined,
        scholarship_type: scholarship_type !== undefined ? (scholarship_type && scholarship_type.trim()) || null : undefined,
        description: description !== undefined ? (description && description.trim()) || null : undefined,
        stream_ids: resolvedStreamIds !== undefined ? resolvedStreamIds : undefined,
        income_limit: income_limit !== undefined ? (income_limit != null ? String(income_limit).trim() : null) : undefined,
        minimum_marks_required: minimum_marks_required !== undefined ? (minimum_marks_required != null ? String(minimum_marks_required).trim() : null) : undefined,
        scholarship_amount: scholarship_amount !== undefined ? (scholarship_amount != null ? String(scholarship_amount).trim() : null) : undefined,
        selection_process: selection_process !== undefined ? (selection_process && selection_process.trim()) || null : undefined,
        application_start_date: application_start_date !== undefined ? application_start_date || null : undefined,
        application_end_date: application_end_date !== undefined ? application_end_date || null : undefined,
        mode: mode !== undefined ? (mode && mode.trim()) || null : undefined,
        official_website: official_website !== undefined ? (official_website && official_website.trim()) || null : undefined,
        official_notification_link: official_notification_link !== undefined ? (official_notification_link && official_notification_link.trim()) || null : undefined,
        application_link: application_link !== undefined ? (application_link && application_link.trim()) || null : undefined,
        active_status: active_status !== undefined ? (active_status && active_status.trim()) || null : undefined,
        academic_year: academic_year !== undefined ? (academic_year && academic_year.trim()) || null : undefined,
        eligible_degree: eligible_degree !== undefined ? (eligible_degree && eligible_degree.trim()) || null : undefined,
        number_of_awards: number_of_awards !== undefined ? (number_of_awards != null ? String(number_of_awards).trim() : null) : undefined,
        renewal_available: renewal_available !== undefined ? renewal_available : undefined,
        renewal_conditions: renewal_conditions !== undefined ? (renewal_conditions && renewal_conditions.trim()) || null : undefined,
        scope: scope !== undefined ? (scope && scope.trim()) || null : undefined,
        value_category: value_category !== undefined ? (value_category && value_category.trim()) || null : undefined,
        education_level: education_level !== undefined ? (education_level && education_level.trim()) || null : undefined
      });

      await ScholarshipEligibleCategory.deleteByScholarshipId(scholarshipId);
      if (eligibleCategories && Array.isArray(eligibleCategories)) {
        for (const item of eligibleCategories) {
          if (item.category != null && String(item.category).trim()) {
            await ScholarshipEligibleCategory.create({
              scholarship_id: scholarshipId,
              category: String(item.category).trim()
            });
          }
        }
      }

      await ScholarshipApplicableState.deleteByScholarshipId(scholarshipId);
      if (applicableStates && Array.isArray(applicableStates)) {
        for (const item of applicableStates) {
          if (item.state_name != null && String(item.state_name).trim()) {
            await ScholarshipApplicableState.create({
              scholarship_id: scholarshipId,
              state_name: String(item.state_name).trim()
            });
          }
        }
      }

      await ScholarshipDocumentsRequired.deleteByScholarshipId(scholarshipId);
      if (documentsRequired && Array.isArray(documentsRequired)) {
        for (const item of documentsRequired) {
          if (item.document_name != null && String(item.document_name).trim()) {
            await ScholarshipDocumentsRequired.create({
              scholarship_id: scholarshipId,
              document_name: String(item.document_name).trim()
            });
          }
        }
      }

      const scholarship = await Scholarship.findById(scholarshipId);
      res.json({ success: true, data: { scholarship }, message: 'Scholarship updated successfully' });
    } catch (error) {
      console.error('Error updating scholarship:', error);
      res.status(500).json({ success: false, message: 'Failed to update scholarship' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const scholarship = await Scholarship.findById(parseInt(id));
      if (!scholarship) {
        return res.status(404).json({ success: false, message: 'Scholarship not found' });
      }
      await Scholarship.delete(parseInt(id));
      res.json({ success: true, message: 'Scholarship deleted successfully' });
    } catch (error) {
      console.error('Error deleting scholarship:', error);
      res.status(500).json({ success: false, message: 'Failed to delete scholarship' });
    }
  }

  static async deleteAll(req, res) {
    try {
      const all = await Scholarship.findAll();
      for (const s of all) {
        await Scholarship.delete(s.id);
      }
      res.json({
        success: true,
        message: `All ${all.length} scholarships deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting all scholarships:', error);
      res.status(500).json({ success: false, message: 'Failed to delete all scholarships' });
    }
  }

  static async downloadBulkTemplate(req, res) {
    try {
      const headers = [
        'scholarship_name',
        'conducting_authority',
        'scholarship_type',
        'description',
        'stream_name',
        'income_limit',
        'minimum_marks_required',
        'scholarship_amount',
        'selection_process',
        'application_start_date',
        'application_end_date',
        'mode',
        'official_website',
        'official_notification_link',
        'application_link',
        'active_status',
        'academic_year',
        'eligible_degree',
        'number_of_awards',
        'renewal_available',
        'renewal_conditions',
        'scope',
        'value_category',
        'education_level',
        'eligible_categories',
        'applicable_states',
        'documents_required'
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        [
          'National Scholarship Portal',
          'Ministry of Education',
          'Merit-cum-Means',
          'Central sector scheme for college students.',
          'Science (PCM)',
          'Up to 2.5 Lakh',
          '60%',
          'Up to 20000 per annum',
          'Merit and income based.',
          '2025-01-01',
          '2025-03-31',
          'Online',
          'https://scholarships.gov.in',
          'https://scholarships.gov.in/notification',
          'https://scholarships.gov.in/apply',
          'active',
          '2025-26',
          'B.Tech, B.Sc',
          '5000',
          'TRUE',
          'Must maintain 60% in each year',
          'National',
          'High Value',
          'Undergraduate',
          'SC, ST, OBC, General',
          'All India, Delhi, Maharashtra',
          'Aadhar, Marksheet, Income Certificate'
        ],
        [
          'State Merit Scholarship',
          'State Education Board',
          'Merit',
          'State level scholarship for top rankers.',
          'Commerce',
          'Up to 8 Lakh',
          '75%',
          '10000 per annum',
          'Merit based on 12th marks.',
          '2025-02-01',
          '2025-04-30',
          'Online',
          'https://state.gov.in',
          '',
          'https://state.gov.in/apply',
          'active',
          '2025-26',
          'B.Com',
          '100',
          'FALSE',
          '',
          'State',
          'Medium Value',
          'Undergraduate',
          'General, OBC',
          'Maharashtra, Gujarat',
          'Marksheet, Domicile'
        ]
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Scholarships');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=scholarships-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  /** Download all scholarships data as Excel (Super Admin only). Same columns as bulk template. */
  static async downloadAllExcel(req, res) {
    try {
      const scholarships = await Scholarship.findAll();
      const headers = [
        'scholarship_name', 'conducting_authority', 'scholarship_type', 'description', 'stream_name',
        'income_limit', 'minimum_marks_required', 'scholarship_amount', 'selection_process',
        'application_start_date', 'application_end_date', 'mode', 'official_website',
        'official_notification_link', 'application_link', 'active_status', 'academic_year',
        'eligible_degree', 'number_of_awards', 'renewal_available', 'renewal_conditions',
        'scope', 'value_category', 'education_level',
        'eligible_categories', 'applicable_states', 'documents_required'
      ];
      const rows = [headers];
      for (const s of scholarships) {
        const [categories, states, docs] = await Promise.all([
          ScholarshipEligibleCategory.findByScholarshipId(s.id),
          ScholarshipApplicableState.findByScholarshipId(s.id),
          ScholarshipDocumentsRequired.findByScholarshipId(s.id),
        ]);
        const catStr = (categories && categories.length) ? categories.map((c) => c.category || '').filter(Boolean).join(';') : '';
        const stateStr = (states && states.length) ? states.map((st) => st.state_name || '').filter(Boolean).join(';') : '';
        const docsStr = (docs && docs.length) ? docs.map((d) => d.document_name || '').filter(Boolean).join(';') : '';
        const streamInfo = await loadStreamNamesForScholarship(s);
        const streamName = streamInfo.streamName || '';
        rows.push([
          s.scholarship_name || '',
          s.conducting_authority || '',
          s.scholarship_type || '',
          s.description || '',
          streamName,
          s.income_limit || '',
          s.minimum_marks_required || '',
          s.scholarship_amount || '',
          s.selection_process || '',
          s.application_start_date ? String(s.application_start_date).slice(0, 10) : '',
          s.application_end_date ? String(s.application_end_date).slice(0, 10) : '',
          s.mode || '',
          s.official_website || '',
          s.official_notification_link || '',
          s.application_link || '',
          s.active_status || '',
          s.academic_year || '',
          s.eligible_degree || '',
          s.number_of_awards || '',
          s.renewal_available ? 'TRUE' : 'FALSE',
          s.renewal_conditions || '',
          s.scope || '',
          s.value_category || '',
          s.education_level || '',
          catStr,
          stateStr,
          docsStr,
        ]);
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Scholarships');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=scholarships-all-data.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating scholarships export:', error);
      res.status(500).json({ success: false, message: 'Failed to export scholarships data' });
    }
  }

  static async bulkUpload(req, res) {
    console.log('[ScholarshipBulkUpload] Handler entered');
    try {
      const excelFile = req.files?.excel?.[0] || req.file;
      if (!excelFile || !excelFile.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Use field name "excel".'
        });
      }

      console.log('[ScholarshipBulkUpload] File received, size:', excelFile.buffer?.length || 0);
      let workbook;
      try {
        workbook = XLSX.read(excelFile.buffer, { type: 'buffer', raw: true });
      } catch (parseErr) {
        console.error('[ScholarshipBulkUpload] Excel parse error:', parseErr.message);
        return res.status(400).json({ success: false, message: 'Invalid Excel file or format.' });
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      console.log('[ScholarshipBulkUpload] Rows found:', rows.length);
      if (!rows.length) {
        return res.status(400).json({ success: false, message: 'Excel file has no data rows.' });
      }

      const created = [];
      const errors = [];
      const namesInFile = new Set();

      const getVal = (row, ...keys) => {
        for (const k of keys) {
          const v = row[k] ?? row[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())];
          if (v !== undefined && v !== null && v !== '') return String(v).trim();
        }
        return null;
      };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const name = getVal(row, 'scholarship_name', 'scholarship_Name') || '';
        if (!name) {
          errors.push({ row: rowNum, message: 'scholarship_name is required' });
          continue;
        }
        if (namesInFile.has(name.toLowerCase())) {
          errors.push({ row: rowNum, message: `duplicate name "${name}" in this file` });
          continue;
        }
        const existing = await Scholarship.findByName(name);
        if (existing) {
          errors.push({ row: rowNum, message: `scholarship "${name}" already exists` });
          continue;
        }

        const streamNameRaw = getVal(row, 'stream_name', 'stream_Name');
        const streamIdsRaw = getVal(row, 'stream_ids', 'stream_Ids') || getVal(row, 'stream_id', 'stream_Id');
        let stream_ids = [];
        if (streamNameRaw) {
          const resolved = await resolveStreamNamesToIds(streamNameRaw);
          if (resolved.error) {
            errors.push({ row: rowNum, message: resolved.error });
            continue;
          }
          stream_ids = resolved.ids;
        } else if (streamIdsRaw) {
          stream_ids = normalizeStreamIds(splitList(streamIdsRaw));
          if (!stream_ids.length) {
            errors.push({ row: rowNum, message: 'stream_ids must contain valid numbers when provided' });
            continue;
          }
        }

        const application_start_date = parseDate(getVal(row, 'application_start_date'));
        const application_end_date = parseDate(getVal(row, 'application_end_date'));
        const eligibleCategoriesRaw = getVal(row, 'eligible_categories') || '';
        const applicableStatesRaw = getVal(row, 'applicable_states') || '';
        const documentsRequiredRaw = getVal(row, 'documents_required') || '';

        try {
          const renewalRaw = getVal(row, 'renewal_available');
          const renewalBool = renewalRaw ? ['true', '1', 'yes', 'TRUE'].includes(renewalRaw) : false;

          const scholarship = await Scholarship.create({
            scholarship_name: name,
            conducting_authority: getVal(row, 'conducting_authority') || null,
            scholarship_type: getVal(row, 'scholarship_type') || null,
            description: getVal(row, 'description') || null,
            stream_ids,
            income_limit: getVal(row, 'income_limit') || null,
            minimum_marks_required: getVal(row, 'minimum_marks_required') || null,
            scholarship_amount: getVal(row, 'scholarship_amount') || null,
            selection_process: getVal(row, 'selection_process') || null,
            application_start_date: application_start_date || null,
            application_end_date: application_end_date || null,
            mode: getVal(row, 'mode') || null,
            official_website: getVal(row, 'official_website') || null,
            official_notification_link: getVal(row, 'official_notification_link') || null,
            application_link: getVal(row, 'application_link') || null,
            active_status: getVal(row, 'active_status') || 'active',
            academic_year: getVal(row, 'academic_year') || null,
            eligible_degree: getVal(row, 'eligible_degree') || null,
            number_of_awards: getVal(row, 'number_of_awards') || null,
            renewal_available: renewalBool,
            renewal_conditions: getVal(row, 'renewal_conditions') || null,
            scope: getVal(row, 'scope') || null,
            value_category: getVal(row, 'value_category') || null,
            education_level: getVal(row, 'education_level') || null
          });
          if (eligibleCategoriesRaw) {
            const cats = splitList(eligibleCategoriesRaw);
            for (const c of cats) await ScholarshipEligibleCategory.create({ scholarship_id: scholarship.id, category: c });
          }
          if (applicableStatesRaw) {
            const states = splitList(applicableStatesRaw);
            for (const s of states) await ScholarshipApplicableState.create({ scholarship_id: scholarship.id, state_name: s });
          }
          if (documentsRequiredRaw) {
            const docs = splitList(documentsRequiredRaw);
            for (const d of docs) await ScholarshipDocumentsRequired.create({ scholarship_id: scholarship.id, document_name: d });
          }
          created.push({ id: scholarship.id, name: scholarship.scholarship_name });
          namesInFile.add(name.toLowerCase());
        } catch (createErr) {
          errors.push({ row: rowNum, message: createErr.message || 'Failed to create scholarship' });
        }
      }

      res.json({
        success: true,
        data: {
          created: created.length,
          createdScholarships: created,
          errors: errors.length,
          errorDetails: errors
        },
        message: `Created ${created.length} scholarship(s).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`
      });
    } catch (error) {
      console.error('[ScholarshipBulkUpload] FATAL ERROR:', error);
      console.error('[ScholarshipBulkUpload] Stack:', error.stack);
      try {
        res.status(500).json({
          success: false,
          message: error.message || 'Bulk upload failed'
        });
      } catch (resErr) {
        console.error('[ScholarshipBulkUpload] Failed to send error response:', resErr);
      }
    }
  }
}

module.exports = ScholarshipsController;
