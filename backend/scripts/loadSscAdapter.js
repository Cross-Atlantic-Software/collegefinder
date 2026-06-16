/**
 * Load the complete, hand-authored SSC CGL "Personal Details" adapter and PUBLISH it.
 *
 * SSC's OTR is an Angular app: inputs have no id/name/<label>, dropdowns are
 * custom <div class="select-type"> triggers, DOB is a Material datepicker.
 * So every field is targeted by `by_text` (the visible question text), which the
 * extension's proximity detector resolves. "Verify X" duplicates are mapped too.
 *
 * Run from backend:  node scripts/loadSscAdapter.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/database');

const t = (...labels) => ({ by_text: labels });

const section = {
  section_id: 'personal_details',
  section_name: 'Personal Details',
  page_indicator: { type: 'url_contains', value: 'personal-details' },
  fields: [
    // ── Aadhaar (entry + verify) ──
    { field_id: 'aadhaar_number',        label: 'Enter Your Aadhaar Details (UID / VID)', source: 'student.aadhar_no', type: 'text', format: 'digits_only', required: true,  selectors: t('Enter Your Aadhaar Details (UID / VID)') },
    { field_id: 'aadhaar_number_verify', label: 'Verify Aadhaar Details (UID / VID)',      source: 'student.aadhar_no', type: 'text', format: 'digits_only', required: true,  selectors: t('Verify Aadhaar Details (UID / VID)') },

    // ── Candidate name (+ verify) ──
    { field_id: 'candidate_name',        label: 'Candidate Name (As per Matriculation Certificate)',        source: 'student.full_name', type: 'text', format: 'UPPERCASE', required: true, selectors: t('Candidate Name (As per Matriculation Certificate)') },
    { field_id: 'candidate_name_verify', label: 'Verify Candidate Name (As per Matriculation Certificate)', source: 'student.full_name', type: 'text', format: 'UPPERCASE', required: true, selectors: t('Verify Candidate Name (As per Matriculation Certificate)') },

    // ── Gender (custom dropdown) (+ verify) ──
    { field_id: 'gender',        label: 'Gender',        source: 'student.gender', type: 'select', required: true, selectors: t('Gender'),
      value_map: { Male: ['Male', 'MALE', 'M'], Female: ['Female', 'FEMALE', 'F'], Other: ['Other', 'Others', 'Transgender', 'O'] } },
    { field_id: 'gender_verify', label: 'Verify Gender', source: 'student.gender', type: 'select', required: true, selectors: t('Verify Gender'),
      value_map: { Male: ['Male', 'MALE', 'M'], Female: ['Female', 'FEMALE', 'F'], Other: ['Other', 'Others', 'Transgender', 'O'] } },

    // ── Date of Birth (Material datepicker) (+ verify) ──
    { field_id: 'dob',        label: 'Date Of Birth (DD-MM-YYYY)',        source: 'student.dob', type: 'date', required: true, date_config: { variant: 'text', format: 'DD-MM-YYYY' }, selectors: t('Date Of Birth (DD-MM-YYYY)') },
    { field_id: 'dob_verify', label: 'Verify Date of Birth (DD-MM-YYYY)', source: 'student.dob', type: 'date', required: true, date_config: { variant: 'text', format: 'DD-MM-YYYY' }, selectors: t('Verify Date of Birth (DD-MM-YYYY)') },

    // ── Father / Mother (+ verify) ──
    { field_id: 'father_name',        label: "Father's Name",        source: 'student.father_name', type: 'text', required: true, selectors: t("Father's Name") },
    { field_id: 'father_name_verify', label: "Verify Father's Name", source: 'student.father_name', type: 'text', required: true, selectors: t("Verify Father's Name") },
    { field_id: 'mother_name',        label: "Mother's Name",        source: 'student.mother_name', type: 'text', required: true, selectors: t("Mother's Name") },
    { field_id: 'mother_name_verify', label: "Verify Mother's Name", source: 'student.mother_name', type: 'text', required: true, selectors: t("Verify Mother's Name") },

    // ── 10th Board (custom dropdown) (+ verify) ──
    { field_id: 'matric_board',        label: 'Matriculation (10th class) Education Board',        source: 'education.class_10.board', type: 'select', required: true, selectors: t('Matriculation (10th class) Education Board'),
      value_map: { CBSE: ['CBSE', 'Central Board of Secondary Education', 'CENTRAL BOARD OF SECONDARY EDUCATION'], ICSE: ['ICSE', 'CISCE'], 'State Board': ['State Board', 'State'] } },
    { field_id: 'matric_board_verify', label: 'Verify Matriculation (10th class) Education Board', source: 'education.class_10.board', type: 'select', required: true, selectors: t('Verify Matriculation (10th class) Education Board'),
      value_map: { CBSE: ['CBSE', 'Central Board of Secondary Education', 'CENTRAL BOARD OF SECONDARY EDUCATION'], ICSE: ['ICSE', 'CISCE'], 'State Board': ['State Board', 'State'] } },

    // ── Roll Number (+ verify) ──
    { field_id: 'roll_number',        label: 'Roll Number',        source: 'education.class_10.roll_no', type: 'text', required: true, selectors: t('Roll Number') },
    { field_id: 'roll_number_verify', label: 'Verify Roll Number', source: 'education.class_10.roll_no', type: 'text', required: true, selectors: t('Verify Roll Number') },

    // ── Year of Passing (custom dropdown) (+ verify) ──
    { field_id: 'year_of_passing',        label: 'Year of Passing',        source: 'education.class_10.passing_year', type: 'select', required: true, selectors: t('Year of Passing') },
    { field_id: 'year_of_passing_verify', label: 'Verify Year of Passing', source: 'education.class_10.passing_year', type: 'select', required: true, selectors: t('Verify Year of Passing') },

    // ── Contact (already worked; kept for completeness) ──
    { field_id: 'mobile_number', label: "Candidate's Mobile Number", source: 'student.mobile', type: 'text', format: 'PHONE', required: true, selectors: t("Candidate's Mobile Number") },
    { field_id: 'email_id',      label: "Candidate's Email ID",      source: 'student.email', type: 'text', required: true, selectors: t("Candidate's Email ID") }
  ]
};

const adapterConfig = { sections: [section] };

async function main() {
  const res = await db.query(
    `UPDATE exam_adapters
        SET adapter_config = $1::jsonb,
            version = COALESCE(version,0) + 1,
            status = 'published',
            is_active = TRUE,
            is_ai_generated = FALSE,
            last_verified_at = CURRENT_TIMESTAMP,
            last_verified_by = 'sharmaharsh634@gmail.com',
            updated_by = 'sharmaharsh634@gmail.com',
            updated_at = CURRENT_TIMESTAMP
      WHERE exam_id = 'ssc_cgl'
      RETURNING version, status, jsonb_array_length(adapter_config->'sections') AS sections,
                (SELECT count(*) FROM jsonb_array_elements(adapter_config->'sections'->0->'fields')) AS fields`,
    [JSON.stringify(adapterConfig)]
  );
  if (!res.rows[0]) {
    console.error('ssc_cgl adapter row not found — run seedSscCgl.js first.');
    process.exit(1);
  }
  const r = res.rows[0];
  console.log(`✅ SSC CGL adapter published — version ${r.version}, ${r.sections} section(s), ${r.fields} fields.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error('❌', e); process.exit(1); });
