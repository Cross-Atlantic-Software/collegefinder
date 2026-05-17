/**
 * Fill all profile details for user Harsh Sharma (sharmaharsh634@gmail.com).
 * Run from repo root: node backend/scripts/fillProfileHarshSharma.js
 * Or from backend: node scripts/fillProfileHarshSharma.js
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

const EMAIL = 'sharmaharsh634@gmail.com';

const PROFILE = {
  // Basic info (users table)
  name: 'Harsh Sharma',
  first_name: 'Harsh',
  last_name: 'Sharma',
  date_of_birth: '2004-08-07',
  gender: 'Male',
  phone_number: '+91 6374589527',
  state: 'Delhi',
  district: 'Central Delhi',
  nationality: 'Indian',
  father_full_name: 'Rajesh Sharma',
  mother_full_name: 'Sunita Sharma',
  // Academics — 10th
  matric_board: 'CBSE',
  matric_school_name: 'Delhi Public School, New Delhi',
  matric_school_pincode: '110022',
  matric_passing_year: 2021,
  matric_roll_number: '1234567',
  matric_total_marks: 500,
  matric_obtained_marks: 450,
  matric_percentage: 90.0,
  matric_marks_type: 'Percentage',
  matric_result_status: 'passed',
  // Academics — 12th
  postmatric_board: 'CBSE',
  postmatric_school_name: 'Delhi Public School, New Delhi',
  postmatric_school_pincode: '110022',
  postmatric_passing_year: 2023,
  postmatric_roll_number: '7654321',
  postmatric_total_marks: 500,
  postmatric_obtained_marks: 465,
  postmatric_percentage: 93.0,
  postmatric_marks_type: 'Percentage',
  postmatric_result_status: 'passed',
  is_pursuing_12th: false,
  stream_name: 'Science (PCM)',
  // Address
  correspondence_address_line1: '123 Sample Lane',
  city_town_village: 'New Delhi',
  pincode: '110001',
  country: 'India',
  permanent_address_same_as_correspondence: true,
  // Other
  medium: 'English',
  language: 'English',
  // Category & reservation (category_id 4 = ST)
  category_id: 4,
  pwbd_status: true,
  // Government ID
  aadhar_number: '1234 5678 9012',
};

async function main() {
  try {
    const user = await User.findByEmail(EMAIL);
    if (!user) {
      console.error('User not found with email:', EMAIL);
      process.exit(1);
    }

    const userId = user.id;
    console.log('Found user:', user.id, user.email);

    // 1. Update users table (basic info)
    await db.query(
      `UPDATE users SET
        name = $1, first_name = $2, last_name = $3, date_of_birth = $4::DATE,
        gender = $5, phone_number = $6, state = $7, district = $8,
        nationality = $9, father_full_name = $10, mother_full_name = $11,
        onboarding_completed = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12`,
      [
        PROFILE.name,
        PROFILE.first_name,
        PROFILE.last_name,
        PROFILE.date_of_birth,
        PROFILE.gender,
        PROFILE.phone_number,
        PROFILE.state,
        PROFILE.district,
        PROFILE.nationality,
        PROFILE.father_full_name,
        PROFILE.mother_full_name,
        userId,
      ]
    );
    console.log('Updated users (basic info)');

    // 2. Stream ID for academics
    let streamId = null;
    const stream = await Stream.findByName(PROFILE.stream_name);
    if (stream) streamId = stream.id;

    await UserAcademics.upsert(userId, {
      // 10th
      matric_board:          PROFILE.matric_board,
      matric_school_name:    PROFILE.matric_school_name,
      matric_school_pincode: PROFILE.matric_school_pincode,
      matric_passing_year:   PROFILE.matric_passing_year,
      matric_roll_number:    PROFILE.matric_roll_number,
      matric_total_marks:    PROFILE.matric_total_marks,
      matric_obtained_marks: PROFILE.matric_obtained_marks,
      matric_percentage:     PROFILE.matric_percentage,
      matric_marks_type:     PROFILE.matric_marks_type,
      matric_result_status:  PROFILE.matric_result_status,
      // 12th
      postmatric_board:          PROFILE.postmatric_board,
      postmatric_school_name:    PROFILE.postmatric_school_name,
      postmatric_school_pincode: PROFILE.postmatric_school_pincode,
      postmatric_passing_year:   PROFILE.postmatric_passing_year,
      postmatric_roll_number:    PROFILE.postmatric_roll_number,
      postmatric_total_marks:    PROFILE.postmatric_total_marks,
      postmatric_obtained_marks: PROFILE.postmatric_obtained_marks,
      postmatric_percentage:     PROFILE.postmatric_percentage,
      postmatric_marks_type:     PROFILE.postmatric_marks_type,
      postmatric_result_status:  PROFILE.postmatric_result_status,
      is_pursuing_12th: PROFILE.is_pursuing_12th,
      stream:    PROFILE.stream_name,
      stream_id: streamId,
    });
    console.log('Upserted user_academics');

    // 3. Address
    await UserAddress.upsert(userId, {
      correspondence_address_line1: PROFILE.correspondence_address_line1,
      city_town_village: PROFILE.city_town_village,
      district: PROFILE.district,
      state: PROFILE.state,
      country: PROFILE.country,
      pincode: PROFILE.pincode,
      permanent_address_same_as_correspondence: PROFILE.permanent_address_same_as_correspondence,
    });
    console.log('Upserted user_address');

    // 4. Other info (medium, language)
    await UserOtherInfo.upsert(userId, {
      medium: PROFILE.medium,
      language: PROFILE.language,
    });
    console.log('Upserted user_other_info');

    // 5. Career goals - ensure record exists (empty interests is valid)
    await UserCareerGoals.upsert(userId, { interests: [] });
    console.log('Upserted user_career_goals');

    // 6. Category & reservation
    await CategoryAndReservation.upsert(userId, {
      category_id: PROFILE.category_id,
      pwbd_status: PROFILE.pwbd_status,
      ews_status: false,
    });
    console.log('Upserted category_and_reservation');

    // 7. Government identification (Aadhar)
    await GovernmentIdentification.upsert(userId, {
      aadhar_number: PROFILE.aadhar_number,
    });
    console.log('Upserted government_identification');

    console.log('\nProfile fill complete for', EMAIL);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
