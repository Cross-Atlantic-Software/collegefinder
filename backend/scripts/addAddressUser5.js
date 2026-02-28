/**
 * Add/update address in user_address for user id 5.
 * Usage: node scripts/addAddressUser5.js
 */

require('dotenv').config();
const db = require('../src/config/database');

const USER_ID = 5;
const ADDRESS = {
  correspondence_address_line1: '42, Green Park Colony',
  correspondence_address_line2: 'Near City Mall',
  city_town_village: 'Jaipur',
  district: 'Jaipur',
  state: 'Rajasthan',
  country: 'India',
  pincode: '302015',
  permanent_address_same_as_correspondence: true,
  permanent_address: null,
};

async function main() {
  try {
    const result = await db.query(
      `INSERT INTO user_address 
       (user_id, correspondence_address_line1, correspondence_address_line2, city_town_village, 
        district, state, country, pincode, permanent_address_same_as_correspondence, permanent_address, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         correspondence_address_line1 = EXCLUDED.correspondence_address_line1,
         correspondence_address_line2 = EXCLUDED.correspondence_address_line2,
         city_town_village = EXCLUDED.city_town_village,
         district = EXCLUDED.district,
         state = EXCLUDED.state,
         country = EXCLUDED.country,
         pincode = EXCLUDED.pincode,
         permanent_address_same_as_correspondence = EXCLUDED.permanent_address_same_as_correspondence,
         permanent_address = EXCLUDED.permanent_address,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        USER_ID,
        ADDRESS.correspondence_address_line1,
        ADDRESS.correspondence_address_line2,
        ADDRESS.city_town_village,
        ADDRESS.district,
        ADDRESS.state,
        ADDRESS.country,
        ADDRESS.pincode,
        ADDRESS.permanent_address_same_as_correspondence,
        ADDRESS.permanent_address,
      ]
    );

    const row = result.rows[0];
    console.log('Address saved for user id', row.user_id);
    console.log('  Line 1:', row.correspondence_address_line1);
    console.log('  Line 2:', row.correspondence_address_line2);
    console.log('  City:', row.city_town_village);
    console.log('  District:', row.district);
    console.log('  State:', row.state);
    console.log('  Pincode:', row.pincode);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
