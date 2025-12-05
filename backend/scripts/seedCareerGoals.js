/**
 * Seed Career Goals Taxonomies
 * This script populates the career_goals_taxonomies table with common career goal options
 */

require('dotenv').config();
const db = require('../config/database');

const CAREER_GOALS = [
  {
    label: 'Technology',
    logo: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'
  },
  {
    label: 'Engineering',
    logo: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'
  },
  {
    label: 'Medicine',
    logo: 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png'
  },
  {
    label: 'Business',
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
  },
  {
    label: 'Design',
    logo: 'https://cdn-icons-png.flaticon.com/512/1055/1055687.png'
  },
  {
    label: 'Arts',
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135807.png'
  },
  {
    label: 'Science',
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135804.png'
  },
  {
    label: 'Law',
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135810.png'
  },
  {
    label: 'Education',
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135789.png'
  },
  {
    label: 'Finance',
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
  },
  {
    label: 'Marketing',
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
  },
  {
    label: 'Healthcare',
    logo: 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png'
  },
  {
    label: 'Architecture',
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135807.png'
  },
  {
    label: 'Agriculture',
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135804.png'
  },
  {
    label: 'Sports',
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135807.png'
  },
  {
    label: 'Media',
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
  },
  {
    label: 'Hospitality',
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135789.png'
  },
  {
    label: 'Social Work',
    logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135807.png'
  }
];

async function seedCareerGoals() {
  try {
    // Initialize database connection
    await db.init();
    console.log('✅ Database connected\n');
    console.log('🌱 Starting to seed career goals...');

    let inserted = 0;
    let skipped = 0;

    for (const goal of CAREER_GOALS) {
      try {
        // Check if career goal already exists
        const checkResult = await db.query(
          'SELECT id FROM career_goals_taxonomies WHERE LOWER(label) = LOWER($1)',
          [goal.label]
        );

        if (checkResult.rows.length > 0) {
          console.log(`⏭️  Skipping "${goal.label}" - already exists`);
          skipped++;
          continue;
        }

        // Insert new career goal
        const result = await db.query(
          'INSERT INTO career_goals_taxonomies (label, logo) VALUES ($1, $2) RETURNING id',
          [goal.label, goal.logo]
        );

        console.log(`✅ Inserted "${goal.label}" with ID: ${result.rows[0].id}`);
        inserted++;
      } catch (error) {
        console.error(`❌ Error inserting "${goal.label}":`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${CAREER_GOALS.length}`);

    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding career goals:', error);
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

seedCareerGoals();

