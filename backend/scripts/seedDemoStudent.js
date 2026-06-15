/**
 * Seed a DUMMY demo student for client demos.
 * Replaces showing the real Harsh Sharma email/phone in audit/fill records.
 * Idempotent. Run from repo root: node backend/scripts/seedDemoStudent.js
 * Extension login after running:  email demo.student@example.com  /  OTP 000000
 */
require('dotenv').config();
const db = require('../src/config/database');
const User = require('../src/models/user/User');
const UserAcademics = require('../src/models/user/UserAcademics');
const UserAddress = require('../src/models/user/UserAddress');
const UserCareerGoals = require('../src/models/user/UserCareerGoals');
const UserOtherInfo = require('../src/models/user/UserOtherInfo');
const Stream = require('../src/models/taxonomy/Stream');
const CategoryAndReservation = require('../src/models/user/CategoryAndReservation');
const GovernmentIdentification = require('../src/models/user/GovernmentIdentification');

const EMAIL = 'demo.student@example.com';
const DEMO_OTP = '000000';

const PROFILE = {
  name: 'Demo Student', first_name: 'Demo', last_name: 'Student',
  date_of_birth: '2005-01-01', gender: 'Male', phone_number: '+91 90000 00000',
  state: 'Delhi', district: 'Central Delhi', nationality: 'Indian',
  father_full_name: 'Sample Father', mother_full_name: 'Sample Mother',
  matric_board: 'CBSE', matric_school_name: 'Demo Public School',
  matric_school_pincode: '110001', matric_passing_year: 2021,
  matric_roll_number: '0000001', matric_total_marks: 500,
  matric_obtained_marks: 450, matric_percentage: 90.0,
  matric_marks_type: 'Percentage', matric_result_status: 'passed',
  postmatric_board: 'CBSE', postmatric_school_name: 'Demo Public School',
  postmatric_school_pincode: '110001', postmatric_passing_year: 2023,
  postmatric_roll_number: '0000002', postmatric_total_marks: 500,
  postmatric_obtained_marks: 465, postmatric_percentage: 93.0,
  postmatric_marks_type: 'Percentage', postmatric_result_status: 'passed',
  is_pursuing_12th: false, stream_name: 'Science (PCM)',
  correspondence_address_line1: '1 Demo Street', city_town_village: 'New Delhi',
  pincode: '110001', country: 'India',
  permanent_address_same_as_correspondence: true,
  medium: 'English', language: 'English',
  category_id: 4, pwbd_status: false, aadhar_number: '0000 0000 0000',
};

async function main() {
  try {
    let user = await User.findByEmail(EMAIL);
    if (!user) { user = await User.create(EMAIL); console.log('Created demo user:', user.id, user.email); }
    else { console.log('Demo user already exists:', user.id, user.email); }
    const userId = user.id;

    await db.query(
      `UPDATE users SET
        name=$1, first_name=$2, last_name=$3, date_of_birth=$4::DATE,
        gender=$5, phone_number=$6, state=$7, district=$8, nationality=$9,
        father_full_name=$10, mother_full_name=$11,
        email_verified=TRUE, onboarding_completed=TRUE, updated_at=CURRENT_TIMESTAMP
       WHERE id=$12`,
      [PROFILE.name, PROFILE.first_name, PROFILE.last_name, PROFILE.date_of_birth,
       PROFILE.gender, PROFILE.phone_number, PROFILE.state, PROFILE.district,
       PROFILE.nationality, PROFILE.father_full_name, PROFILE.mother_full_name, userId]
    );
    console.log('Updated users (basic info)');

    let streamId = null;
    const stream = await Stream.findByName(PROFILE.stream_name);
    if (stream) streamId = stream.id;

    await UserAcademics.upsert(userId, {
      matric_board: PROFILE.matric_board, matric_school_name: PROFILE.matric_school_name,
      matric_school_pincode: PROFILE.matric_school_pincode, matric_passing_year: PROFILE.matric_passing_year,
      matric_roll_number: PROFILE.matric_roll_number, matric_total_marks: PROFILE.matric_total_marks,
      matric_obtained_marks: PROFILE.matric_obtained_marks, matric_percentage: PROFILE.matric_percentage,
      matric_marks_type: PROFILE.matric_marks_type, matric_result_status: PROFILE.matric_result_status,
      postmatric_board: PROFILE.postmatric_board, postmatric_school_name: PROFILE.postmatric_school_name,
      postmatric_school_pincode: PROFILE.postmatric_school_pincode, postmatric_passing_year: PROFILE.postmatric_passing_year,
      postmatric_roll_number: PROFILE.postmatric_roll_number, postmatric_total_marks: PROFILE.postmatric_total_marks,
      postmatric_obtained_marks: PROFILE.postmatric_obtained_marks, postmatric_percentage: PROFILE.postmatric_percentage,
      postmatric_marks_type: PROFILE.postmatric_marks_type, postmatric_result_status: PROFILE.postmatric_result_status,
      is_pursuing_12th: PROFILE.is_pursuing_12th, stream: PROFILE.stream_name, stream_id: streamId,
    });
    console.log('Upserted user_academics');

    await UserAddress.upsert(userId, {
      correspondence_address_line1: PROFILE.correspondence_address_line1,
      city_town_village: PROFILE.city_town_village, district: PROFILE.district,
      state: PROFILE.state, country: PROFILE.country, pincode: PROFILE.pincode,
      permanent_address_same_as_correspondence: PROFILE.permanent_address_same_as_correspondence,
    });
    console.log('Upserted user_address');

    await UserOtherInfo.upsert(userId, { medium: PROFILE.medium, language: PROFILE.language });
    console.log('Upserted user_other_info');
    await UserCareerGoals.upsert(userId, { interests: [] });
    console.log('Upserted user_career_goals');
    await CategoryAndReservation.upsert(userId, { category_id: PROFILE.category_id, pwbd_status: PROFILE.pwbd_status, ews_status: false });
    console.log('Upserted category_and_reservation');
    await GovernmentIdentification.upsert(userId, { aadhar_number: PROFILE.aadhar_number });
    console.log('Upserted government_identification');

    await db.query('DELETE FROM otps WHERE email=$1', [EMAIL]);
    await db.query(
      `INSERT INTO otps (user_id, email, code, expires_at, used)
       VALUES ($1,$2,$3, TIMESTAMP '2099-12-31 23:59:59', FALSE)`,
      [userId, EMAIL, DEMO_OTP]
    );
    console.log('Seeded reusable login OTP (' + DEMO_OTP + ')');
    console.log('\nDemo student ready.  email:', EMAIL, ' OTP:', DEMO_OTP);
  } catch (err) { console.error('Error:', err.message); process.exit(1); }
  finally { process.exit(0); }
}
main();
