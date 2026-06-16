/**
 * Fill EVERY data field of a user's profile (default: sharmaharsh634@gmail.com)
 * so the ExamFill extension has complete data to auto-fill exam forms.
 *
 * - Random values for exam marks/percentages/subjects.
 * - Covers: users, user_address, user_academics, user_other_info,
 *   other_personal_details, category_and_reservation, government_identification.
 * - Documents (user_document_vault) are real file uploads (S3 URLs), NOT text —
 *   they must be uploaded via the profile UI, so they're intentionally skipped.
 * - PAN is not stored (no column exists in government_identification).
 *
 * Run from backend:  node scripts/fillProfileComplete.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const db = require('../src/config/database');
const User = require('../src/models/user/User');
const UserAcademics = require('../src/models/user/UserAcademics');
const UserAddress = require('../src/models/user/UserAddress');
const UserOtherInfo = require('../src/models/user/UserOtherInfo');
const OtherPersonalDetails = require('../src/models/user/OtherPersonalDetails');
const CategoryAndReservation = require('../src/models/user/CategoryAndReservation');
const GovernmentIdentification = require('../src/models/user/GovernmentIdentification');
const Stream = require('../src/models/taxonomy/Stream');

const EMAIL = process.argv[2] || 'sharmaharsh634@gmail.com';

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Build a subject list with random per-subject marks (out of 100).
function makeSubjects(names) {
  return names.map((name) => {
    const obtainedMarks = randInt(72, 98);
    return { name, percent: obtainedMarks, obtainedMarks, totalMarks: 100 };
  });
}

async function main() {
  const user = await User.findByEmail(EMAIL);
  if (!user) {
    console.error('User not found:', EMAIL);
    process.exit(1);
  }
  const userId = user.id;
  console.log(`Filling complete profile for ${EMAIL} (id=${userId})\n`);

  // Random exam marks (total 500)
  const matricObtained = randInt(400, 480);
  const postObtained = randInt(410, 488);
  const matricPct = +(matricObtained / 5).toFixed(2);
  const postPct = +(postObtained / 5).toFixed(2);

  // ── 1. users (basic personal info) ──────────────────────────────
  await db.query(
    `UPDATE users SET
        name = $1, first_name = $2, last_name = $3, date_of_birth = $4::DATE,
        gender = $5, phone_number = $6, alternate_mobile_number = $7,
        state = $8, district = $9, nationality = $10, marital_status = $11,
        father_full_name = $12, mother_full_name = $13, guardian_name = $14,
        onboarding_completed = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $15`,
    [
      'Harsh Sharma', 'Harsh', 'Sharma', '2004-08-07',
      'Male', '+91 6374589527', '+91 9123456780',
      'Delhi', 'Central Delhi', 'Indian', 'Unmarried',
      'Rajesh Sharma', 'Sunita Sharma', 'Rajesh Sharma',
      userId
    ]
  );
  console.log('✓ users (name, parents, guardian, dob, gender, mobiles, marital, nationality)');

  // ── 2. user_address ─────────────────────────────────────────────
  await UserAddress.upsert(userId, {
    correspondence_address_line1: '123, Sample Lane, Connaught Place',
    correspondence_address_line2: 'Near Central Park',
    city_town_village: 'New Delhi',
    district: 'Central Delhi',
    state: 'Delhi',
    country: 'India',
    pincode: '110001',
    permanent_address_same_as_correspondence: true
  });
  console.log('✓ user_address (line1, line2, city, district, state, pincode, country)');

  // ── 3. user_academics (random marks + subjects) ─────────────────
  let streamId = null;
  try { const s = await Stream.findByName('Science (PCM)'); if (s) streamId = s.id; } catch (_) {}

  await UserAcademics.upsert(userId, {
    // 10th
    matric_board: 'CBSE',
    matric_school_name: 'Delhi Public School, New Delhi',
    matric_school_pincode: '110022',
    matric_passing_year: 2020,
    matric_roll_number: String(randInt(1000000, 9999999)),
    matric_total_marks: 500,
    matric_obtained_marks: matricObtained,
    matric_percentage: matricPct,
    matric_marks_type: 'Percentage',
    matric_result_status: 'passed',
    matric_state: 'Delhi',
    matric_city: 'New Delhi',
    matric_cgpa: +(matricPct / 9.5).toFixed(1),
    matric_subjects: makeSubjects(['English', 'Mathematics', 'Science', 'Social Science', 'Hindi']),
    // 12th
    postmatric_board: 'CBSE',
    postmatric_school_name: 'Delhi Public School, New Delhi',
    postmatric_school_pincode: '110022',
    postmatric_passing_year: 2022,
    postmatric_roll_number: String(randInt(1000000, 9999999)),
    postmatric_total_marks: 500,
    postmatric_obtained_marks: postObtained,
    postmatric_percentage: postPct,
    postmatric_marks_type: 'Percentage',
    postmatric_result_status: 'passed',
    postmatric_state: 'Delhi',
    postmatric_city: 'New Delhi',
    postmatric_cgpa: +(postPct / 9.5).toFixed(1),
    subjects: makeSubjects(['Physics', 'Chemistry', 'Mathematics', 'English', 'Computer Science']),
    is_pursuing_12th: false,
    stream: 'Science (PCM)',
    stream_id: streamId
  });
  // School pincodes aren't handled by UserAcademics.upsert — set them directly.
  await db.query(
    `UPDATE user_academics SET matric_school_pincode = $1, postmatric_school_pincode = $2,
        updated_at = CURRENT_TIMESTAMP WHERE user_id = $3`,
    ['110022', '110022', userId]
  );
  console.log(`✓ user_academics (10th: ${matricObtained}/500=${matricPct}%, 12th: ${postObtained}/500=${postPct}%, subjects, PCM, school pincodes)`);

  // ── 4. user_other_info ──────────────────────────────────────────
  await UserOtherInfo.upsert(userId, { medium: 'English', language: 'English' });
  console.log('✓ user_other_info (medium, language)');

  // ── 5. other_personal_details ───────────────────────────────────
  await OtherPersonalDetails.upsert(userId, {
    religion: 'Hindu',
    mother_tongue: 'Hindi',
    annual_family_income: '800000',
    occupation_of_father: 'Business',
    occupation_of_mother: 'Homemaker'
  });
  console.log('✓ other_personal_details (religion, mother_tongue, income, occupations)');

  // ── 6. category_and_reservation (ST + PwBD, fills the most fields) ─
  await CategoryAndReservation.upsert(userId, {
    category_id: 4,            // 4 = ST
    ews_status: false,
    pwbd_status: true,
    type_of_disability: 'Locomotor Disability',
    disability_percentage: 45,
    udid_number: 'UDID' + randInt(100000000, 999999999),
    state_domicile: 'Delhi',
    home_state_for_quota: 'Delhi'
  });
  console.log('✓ category_and_reservation (category=ST, pwbd=Yes, disability details, domicile)');

  // ── 7. government_identification (Aadhaar + APAAR; no PAN column) ─
  await GovernmentIdentification.upsert(userId, {
    aadhar_number: '1234 5678 9012',
    apaar_id: String(randInt(100000000000, 999999999999))
  });
  console.log('✓ government_identification (aadhaar, apaar_id)');

  console.log('\n✅ Complete. Documents (photo/signature/marksheets/certificates) must be uploaded via the Document Vault — they are real files, not text.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error('❌ Failed:', err); process.exit(1); });
