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

const EMAIL = 'sharmaharsh634@gmail.com';

const PROFILE = {
  // Basic info (users table)
  name: 'Harsh Sharma',
  first_name: 'Harsh',
  last_name: 'Sharma',
  date_of_birth: '2005-06-15',
  gender: 'Male',
  phone_number: '+91 6374589527',
  state: 'Delhi',
  district: 'Central Delhi',
  nationality: 'Indian',
  // Academics
  matric_school_name: 'Delhi Public School',
  matric_passing_year: 2021,
  postmatric_school_name: 'Delhi Public School',
  postmatric_passing_year: 2023,
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
        nationality = $9, onboarding_completed = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10`,
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
        userId,
      ]
    );
    console.log('Updated users (basic info)');

    // 2. Stream ID for academics
    let streamId = null;
    const stream = await Stream.findByName(PROFILE.stream_name);
    if (stream) streamId = stream.id;

    await UserAcademics.upsert(userId, {
      matric_school_name: PROFILE.matric_school_name,
      matric_passing_year: PROFILE.matric_passing_year,
      postmatric_school_name: PROFILE.postmatric_school_name,
      postmatric_passing_year: PROFILE.postmatric_passing_year,
      is_pursuing_12th: PROFILE.is_pursuing_12th,
      stream: PROFILE.stream_name,
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

    console.log('\nProfile fill complete for', EMAIL);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
