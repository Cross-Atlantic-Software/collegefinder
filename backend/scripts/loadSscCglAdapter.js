/**
 * Load a complete, hand-authored SSC CGL (One Time Registration → Personal
 * Details) adapter into exam_adapters, and PUBLISH it.
 *
 * SSC's OTR is an Angular app: inputs have no id/name/<label for>, dropdowns are
 * custom <div class="select-type"> components, dates are mat-datepicker inputs.
 * So every field is targeted by its visible question text (by_text), which the
 * extension's detector resolves via label-proximity. "Verify X" duplicates are
 * separate fields with the same source.
 *
 * Run from backend:  node scripts/loadSscCglAdapter.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/database');

const GENDER_MAP = {
  Male: ['Male', 'MALE', 'male', 'M'],
  Female: ['Female', 'FEMALE', 'female', 'F'],
  Transgender: ['Transgender', 'Other', 'Others', 'Third Gender', 'TG']
};

const BOARD_MAP = {
  CBSE: ['CBSE', 'Central Board of Secondary Education', 'CBSE Board', 'CENTRAL BOARD OF SECONDARY EDUCATION'],
  ICSE: ['ICSE', 'CISCE', 'Council for the Indian School Certificate Examinations'],
  'State Board': ['State Board', 'State', 'Other']
};

const CATEGORY_MAP = {
  General: ['General', 'GEN', 'UR', 'Unreserved', 'General (UR)'],
  'OBC-NCL': ['OBC', 'OBC-NCL', 'Other Backward Class', 'OBC (NCL)', 'OBC - Non Creamy Layer'],
  SC: ['SC', 'Scheduled Caste', 'SC - Scheduled Caste'],
  ST: ['ST', 'Scheduled Tribe', 'Scheduled Tribes', 'ST - Scheduled Tribe'],
  EWS: ['EWS', 'Economically Weaker Section']
};

const NATIONALITY_MAP = {
  Indian: ['Indian', 'INDIAN', 'India', 'Indian Citizen']
};

const DISABILITY_MAP = {
  Yes: ['Yes', 'YES', 'Y', '1', 'true'],
  No: ['No', 'NO', 'N', '0', 'false']
};

const STATE_MAP = {
  Delhi: ['Delhi', 'NCT of Delhi', 'Delhi (NCT)', 'NCT OF DELHI', 'National Capital Territory of Delhi', 'Delhi NCT']
};

const DISTRICT_MAP = {
  'Central Delhi': ['Central Delhi', 'CENTRAL DELHI', 'Central']
};

// Helper: a text field targeted purely by its question label (proximity).
const textField = (id, label, source, extra = {}) => ({
  field_id: id, label, source, type: 'text', required: true,
  selectors: { by_text: [label] }, ...extra
});

// Helper: a custom dropdown field.
const selectField = (id, label, source, value_map, extra = {}) => ({
  field_id: id, label, source, type: 'select', required: true,
  selectors: { by_text: [label] }, value_map, ...extra
});

const SECTION = {
  section_id: 'personal_details',
  section_name: 'Personal Details',
  page_indicator: { type: 'url_contains', value: 'personal-details' },
  fields: [
    // Aadhaar (+ verify) — 12-digit UID. Portal masks the value to "****" once
    // typed, so it can't be read back — mark masked so the verifier trusts it.
    textField('aadhaar_number', 'Enter Your Aadhaar Details (UID / VID)', 'student.aadhar_no', { format: 'digits_only', masked: true }),
    textField('aadhaar_verify', 'Verify Aadhaar Details (UID / VID)', 'student.aadhar_no', { format: 'digits_only', masked: true }),

    // Candidate name (+ verify)
    textField('candidate_name', 'Candidate Name (As per Matriculation Certificate)', 'student.full_name'),
    textField('candidate_name_verify', 'Verify Candidate Name (As per Matriculation Certificate)', 'student.full_name'),

    // Gender (+ verify) — custom dropdown
    selectField('gender', 'Gender', 'student.gender', GENDER_MAP),
    selectField('gender_verify', 'Verify Gender', 'student.gender', GENDER_MAP),

    // Date of Birth (+ verify) — Angular Material datepicker (stable ids mat-input-0/1)
    {
      field_id: 'dob', label: 'Date Of Birth (DD-MM-YYYY)', source: 'student.dob', type: 'date', required: true,
      selectors: { by_id: ['mat-input-0'], by_text: ['Date Of Birth (DD-MM-YYYY)'] },
      date_config: { variant: 'text', format: 'DD-MM-YYYY' }
    },
    {
      field_id: 'dob_verify', label: 'Verify Date of Birth (DD-MM-YYYY)', source: 'student.dob', type: 'date', required: true,
      selectors: { by_id: ['mat-input-1'], by_text: ['Verify Date of Birth (DD-MM-YYYY)'] },
      date_config: { variant: 'text', format: 'DD-MM-YYYY' }
    },

    // Father / Mother (+ verify)
    textField('father_name', "Father's Name", 'student.father_name'),
    textField('father_name_verify', "Verify Father's Name", 'student.father_name'),
    textField('mother_name', "Mother's Name", 'student.mother_name'),
    textField('mother_name_verify', "Verify Mother's Name", 'student.mother_name'),

    // 10th board (+ verify) — custom dropdown
    selectField('matric_board', 'Matriculation (10th class) Education Board', 'education.class_10.board', BOARD_MAP),
    selectField('matric_board_verify', 'Verify Matriculation (10th class) Education Board', 'education.class_10.board', BOARD_MAP),

    // Roll number (+ verify)
    textField('roll_number', 'Roll Number', 'education.class_10.roll_no'),
    textField('roll_number_verify', 'Verify Roll Number', 'education.class_10.roll_no'),

    // Year of passing (+ verify) — custom dropdown, option text === the year
    selectField('year_of_passing', 'Year of Passing', 'education.class_10.passing_year', {}),
    selectField('year_of_passing_verify', 'Verify Year of Passing', 'education.class_10.passing_year', {}),

    // Mobile / Email (already work; mapped by label for completeness)
    textField('mobile_number', "Candidate's Mobile Number", 'student.mobile', { format: 'PHONE' }),
    textField('email_id', "Candidate's Email ID", 'student.email')
  ]
};

// ── Page 2: Additional Details ──────────────────────────────────────────────
// Most fields here are auto-filled by SSC from Aadhaar e-KYC (disabled) or have
// no profile source, so only the genuinely fillable ones are mapped.
const ADDITIONAL_DETAILS = {
  section_id: 'additional_details',
  section_name: 'Additional Details',
  page_indicator: { type: 'page_text_contains', value: 'Additional Details' },
  fields: [
    selectField('category', 'Category', 'student.category', CATEGORY_MAP),
    selectField('category_verify', 'Verify Category', 'student.category', CATEGORY_MAP),
    selectField('nationality', 'Nationality', 'student.nationality', NATIONALITY_MAP),
    {
      field_id: 'pwbd', label: 'Are you Person With Benchmark Disability (PwBD)?',
      source: 'student.disability', type: 'radio', required: true,
      selectors: { by_name: ['disability'], by_text: ['Are you Person With Benchmark Disability (PwBD)?'] },
      value_map: DISABILITY_MAP
    },

    // ── Permanent Address (occurrence 0 of the repeated address labels) ──
    { field_id: 'perm_address', label: 'Permanent Address', source: 'address.line1', type: 'text', required: false,
      selectors: { by_text: ['Address'], by_index: 0 } },
    { field_id: 'perm_state', label: 'Permanent State/UT', source: 'address.state', type: 'select', required: false,
      selectors: { by_text: ['State/UT'], by_index: 0 }, value_map: STATE_MAP },
    { field_id: 'perm_district', label: 'Permanent District', source: 'address.district', type: 'select', required: false,
      selectors: { by_text: ['District'], by_index: 0 }, value_map: DISTRICT_MAP,
      cascade_dependency: 'perm_state', cascade_wait_ms: 1500 },
    { field_id: 'perm_pincode', label: 'Permanent Pin Code', source: 'address.pincode', type: 'text', required: false,
      selectors: { by_id: ['forPermanentPinNumber'], by_text: ['Pin Code'], by_index: 0 } },

    // ── Present Address (occurrence 1 of the repeated address labels) ──
    { field_id: 'pres_address', label: 'Present Address', source: 'address.line1', type: 'text', required: false,
      selectors: { by_text: ['Address'], by_index: 1 } },
    { field_id: 'pres_state', label: 'Present State/UT', source: 'address.state', type: 'select', required: false,
      selectors: { by_text: ['State/UT'], by_index: 1 }, value_map: STATE_MAP },
    { field_id: 'pres_district', label: 'Present District', source: 'address.district', type: 'select', required: false,
      selectors: { by_text: ['District'], by_index: 1 }, value_map: DISTRICT_MAP,
      cascade_dependency: 'pres_state', cascade_wait_ms: 1500 },
    { field_id: 'pres_pincode', label: 'Present Pin Code', source: 'address.pincode', type: 'text', required: false,
      selectors: { by_id: ['forPresentPinNumber'], by_text: ['Pin Code'], by_index: 1 } }
  ]
};

async function main() {
  const config = { sections: [SECTION, ADDITIONAL_DETAILS] };
  const res = await db.query(
    `UPDATE exam_adapters
        SET adapter_config = $1::jsonb,
            version = COALESCE(version, 0) + 1,
            status = 'published',
            is_active = TRUE,
            is_ai_generated = FALSE,
            updated_by = 'manual:loadSscCglAdapter',
            last_verified_at = CURRENT_TIMESTAMP,
            last_verified_by = 'manual',
            updated_at = CURRENT_TIMESTAMP
      WHERE exam_id = 'ssc_cgl'
      RETURNING version, status, is_active`,
    [JSON.stringify(config)]
  );
  if (!res.rows[0]) {
    console.error('No ssc_cgl adapter row found — run seedSscCgl.js first.');
    process.exit(1);
  }
  console.log(`✅ SSC CGL adapter loaded & published. version=${res.rows[0].version}, status=${res.rows[0].status}, is_active=${res.rows[0].is_active}, sections=2 (Personal Details: ${SECTION.fields.length}, Additional Details: ${ADDITIONAL_DETAILS.fields.length})`);
}

main().then(() => process.exit(0)).catch((e) => { console.error('❌', e); process.exit(1); });
