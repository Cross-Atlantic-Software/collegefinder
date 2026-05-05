/**
 * Profile schema — single source of truth for the dotted `source` paths
 * that an adapter field can reference.
 *
 * Mirrors the JSON returned by `GET /api/extension/fill-profile`
 * (see backend/src/controllers/extension/fillProfileController.js).
 *
 * Used by:
 *   - AdapterBuilderService (whitelist for Gemini output)
 *   - The /build endpoint validator (drops invalid sources)
 *   - The CMS adapter editor (`source` autocomplete dropdown)
 */

const PROFILE_PATHS = [
  // ── student.* ─────────────────────────────────────────────
  { path: 'student.full_name',             type: 'text',     label: 'Full Name' },
  { path: 'student.first_name',            type: 'text',     label: 'First Name' },
  { path: 'student.last_name',             type: 'text',     label: 'Last Name' },
  { path: 'student.name',                  type: 'text',     label: 'Display Name' },
  { path: 'student.father_name',           type: 'text',     label: "Father's Name" },
  { path: 'student.mother_name',           type: 'text',     label: "Mother's Name" },
  { path: 'student.guardian_name',         type: 'text',     label: 'Guardian Name' },
  { path: 'student.dob',                   type: 'date',     label: 'Date of Birth' },
  { path: 'student.gender',                type: 'select',   label: 'Gender' },
  { path: 'student.category',              type: 'select',   label: 'Category (General/OBC/SC/ST/EWS)' },
  { path: 'student.sub_category',          type: 'text',     label: 'Sub Category' },
  { path: 'student.disability',            type: 'radio',    label: 'PwD / Disability (Yes/No)' },
  { path: 'student.nationality',           type: 'text',     label: 'Nationality' },
  { path: 'student.religion',              type: 'text',     label: 'Religion' },
  { path: 'student.marital_status',        type: 'select',   label: 'Marital Status' },
  { path: 'student.mother_tongue',         type: 'text',     label: 'Mother Tongue' },
  { path: 'student.annual_family_income',  type: 'text',     label: 'Annual Family Income' },
  { path: 'student.occupation_of_father',  type: 'text',     label: "Father's Occupation" },
  { path: 'student.occupation_of_mother',  type: 'text',     label: "Mother's Occupation" },
  { path: 'student.aadhar_no',             type: 'text',     label: 'Aadhaar Number' },
  { path: 'student.id_document_type',      type: 'select',   label: 'ID Document Type' },
  { path: 'student.pan_no',                type: 'text',     label: 'PAN Number' },
  { path: 'student.apaar_id',              type: 'text',     label: 'APAAR ID' },
  { path: 'student.mobile',                type: 'text',     label: 'Mobile Number' },
  { path: 'student.alternate_mobile',      type: 'text',     label: 'Alternate Mobile' },
  { path: 'student.email',                 type: 'text',     label: 'Email' },
  { path: 'student.landline',              type: 'text',     label: 'Landline' },

  // ── address.* ─────────────────────────────────────────────
  { path: 'address.line1',                 type: 'text',     label: 'Address Line 1' },
  { path: 'address.line2',                 type: 'text',     label: 'Address Line 2' },
  { path: 'address.city',                  type: 'text',     label: 'City / Town' },
  { path: 'address.district',              type: 'text',     label: 'District' },
  { path: 'address.state',                 type: 'select',   label: 'State' },
  { path: 'address.pincode',               type: 'text',     label: 'Pincode' },
  { path: 'address.country',               type: 'select',   label: 'Country' },

  // ── education.class_10.* ──────────────────────────────────
  { path: 'education.class_10.board',           type: 'select', label: '10th Board' },
  { path: 'education.class_10.school',          type: 'text',   label: '10th School / Institute Name' },
  { path: 'education.class_10.passing_year',    type: 'text',   label: '10th Passing Year' },
  { path: 'education.class_10.roll_no',         type: 'text',   label: '10th Roll Number' },
  { path: 'education.class_10.total_marks',     type: 'text',   label: '10th Total Marks' },
  { path: 'education.class_10.obtained_marks',  type: 'text',   label: '10th Marks Obtained' },
  { path: 'education.class_10.percentage',      type: 'text',   label: '10th Percentage' },
  { path: 'education.class_10.state',           type: 'text',   label: '10th School State' },
  { path: 'education.class_10.city',            type: 'text',   label: '10th School City' },
  { path: 'education.class_10.school_pincode',  type: 'text',   label: '10th School Pincode' },
  { path: 'education.class_10.marks_type',      type: 'select', label: '10th Marks Type (CGPA/Percentage)' },
  { path: 'education.class_10.result_status',   type: 'select', label: '10th Result Status' },

  // ── education.class_12.* ──────────────────────────────────
  { path: 'education.class_12.board',           type: 'select', label: '12th Board' },
  { path: 'education.class_12.school',          type: 'text',   label: '12th School / Institute Name' },
  { path: 'education.class_12.passing_year',    type: 'text',   label: '12th Passing Year' },
  { path: 'education.class_12.roll_no',         type: 'text',   label: '12th Roll Number' },
  { path: 'education.class_12.total_marks',     type: 'text',   label: '12th Total Marks' },
  { path: 'education.class_12.obtained_marks',  type: 'text',   label: '12th Marks Obtained' },
  { path: 'education.class_12.percentage',      type: 'text',   label: '12th Percentage' },
  { path: 'education.class_12.state',           type: 'text',   label: '12th School State' },
  { path: 'education.class_12.city',            type: 'text',   label: '12th School City' },
  { path: 'education.class_12.school_pincode',  type: 'text',   label: '12th School Pincode' },
  { path: 'education.class_12.stream',          type: 'select', label: '12th Stream (PCM/PCB/etc)' },
  { path: 'education.class_12.is_appearing',    type: 'radio',  label: '12th Currently Appearing?' },
  { path: 'education.class_12.marks_type',      type: 'select', label: '12th Marks Type (CGPA/Percentage)' },
  { path: 'education.class_12.cgpa',            type: 'text',   label: '12th CGPA' },
  { path: 'education.class_12.result_status',   type: 'select', label: '12th Result Status' },
  { path: 'education.class_12.pass_status',     type: 'select', label: '12th Pass Status (Pass/Appeared)' },
  { path: 'education.class_12.education_type',  type: 'select', label: '12th Education Type' },

  // ── documents.* (S3 URLs) ─────────────────────────────────
  { path: 'documents.photo',                type: 'file', label: 'Passport-size Photograph' },
  { path: 'documents.signature',            type: 'file', label: 'Signature Image' },
  { path: 'documents.id_proof',             type: 'file', label: 'Photo ID Proof' },
  { path: 'documents.aadhar_card',          type: 'file', label: 'Aadhaar Card Upload' },
  { path: 'documents.matric_marksheet',     type: 'file', label: '10th Marksheet Upload' },
  { path: 'documents.postmatric_marksheet', type: 'file', label: '12th Marksheet Upload' },
  { path: 'documents.sc_certificate',       type: 'file', label: 'SC Certificate Upload' },
  { path: 'documents.st_certificate',       type: 'file', label: 'ST Certificate Upload' },
  { path: 'documents.obc_certificate',      type: 'file', label: 'OBC Certificate Upload' },
  { path: 'documents.ews_certificate',      type: 'file', label: 'EWS Certificate Upload' },
  { path: 'documents.pwbd_certificate',     type: 'file', label: 'PwBD Certificate Upload' },
  { path: 'documents.category_certificate', type: 'file', label: 'Category Certificate (auto-resolves)' },

  // ── other.* ───────────────────────────────────────────────
  { path: 'other.medium',   type: 'select', label: 'Medium of Instruction' },
  { path: 'other.language', type: 'select', label: 'Preferred Language' }
];

const PROFILE_PATH_SET = new Set(PROFILE_PATHS.map((p) => p.path));

/**
 * Returns true if `source` is a known profile path the resolver can fill.
 */
function isValidSource(source) {
  if (!source || typeof source !== 'string') return false;
  return PROFILE_PATH_SET.has(source.trim());
}

/**
 * Returns the schema entry for a given path, or null.
 */
function getProfilePath(source) {
  if (!isValidSource(source)) return null;
  return PROFILE_PATHS.find((p) => p.path === source) || null;
}

/**
 * Compact list passed to the Gemini prompt. Cheap to send (~3KB).
 */
function getPromptSchema() {
  return PROFILE_PATHS.map(({ path, type, label }) => ({ path, type, label }));
}

module.exports = {
  PROFILE_PATHS,
  PROFILE_PATH_SET,
  isValidSource,
  getProfilePath,
  getPromptSchema
};
