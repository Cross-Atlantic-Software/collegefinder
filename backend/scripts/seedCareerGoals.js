/**
 * Seed Career Goals Taxonomies (Interests)
 * Populates the career_goals_taxonomies table with interest categories
 * Run: node scripts/seedCareerGoals.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { pool } = require('../src/config/database');

// Icons from Flaticon (free icons with attribution) - using consistent CDN
const ICON_BASE = 'https://cdn-icons-png.flaticon.com/512';
const INTERESTS = [
  { label: 'Solving Problems & Logical Thinking', description: 'Analytical thinking, puzzles, and logical reasoning', logo: `${ICON_BASE}/3135/3135715.png` },
  { label: 'Building Apps & Software', description: 'Software development, programming, and app creation', logo: `${ICON_BASE}/2103/2103633.png` },
  { label: 'AI & Smart Technology', description: 'Artificial intelligence, machine learning, and smart systems', logo: `${ICON_BASE}/2936/2936738.png` },
  { label: 'Working with Data & Numbers', description: 'Data analysis, statistics, and quantitative work', logo: `${ICON_BASE}/3135/3135715.png` },
  { label: 'Cyber Safety & Ethical Hacking', description: 'Cybersecurity, ethical hacking, and digital security', logo: `${ICON_BASE}/5996/5996832.png` },
  { label: 'Designing Machines & Robots', description: 'Robotics, mechanical design, and automation', logo: `${ICON_BASE}/3135/3135804.png` },
  { label: 'Medicine & Healthcare', description: 'Clinical medicine, patient care, and healthcare delivery', logo: `${ICON_BASE}/2965/2965879.png` },
  { label: 'Biology & Lab Research', description: 'Biological sciences, laboratory work, and research', logo: `${ICON_BASE}/3135/3135804.png` },
  { label: 'Understanding Mind & Behaviour', description: 'Psychology, neuroscience, and behavioural sciences', logo: `${ICON_BASE}/3135/3135789.png` },
  { label: 'Fitness, Nutrition & Wellness', description: 'Health, fitness, nutrition, and wellness coaching', logo: `${ICON_BASE}/3135/3135807.png` },
  { label: 'Environment & Climate Careers', description: 'Environmental science, sustainability, and climate action', logo: `${ICON_BASE}/3135/3135804.png` },
  { label: 'Scientific Discovery & Innovation', description: 'Research, experimentation, and scientific innovation', logo: `${ICON_BASE}/3135/3135804.png` },
  { label: 'Starting Your Own Business', description: 'Entrepreneurship, startups, and business creation', logo: `${ICON_BASE}/3135/3135715.png` },
  { label: 'Money, Finance & Stock Market', description: 'Finance, investing, and stock market analysis', logo: `${ICON_BASE}/3135/3135715.png` },
  { label: 'Business & Management', description: 'Business operations, management, and leadership', logo: `${ICON_BASE}/3135/3135715.png` },
  { label: 'Government & Civil Services', description: 'Public administration, policy, and civil services', logo: `${ICON_BASE}/3135/3135810.png` },
  { label: 'Digital Finance & FinTech', description: 'Digital payments, fintech, and financial technology', logo: `${ICON_BASE}/3135/3135715.png` },
  { label: 'Marketing & Brand Building', description: 'Marketing, advertising, and brand strategy', logo: `${ICON_BASE}/3135/3135715.png` },
  { label: 'Creative Arts & Content', description: 'Creative writing, arts, and content creation', logo: `${ICON_BASE}/3135/3135807.png` },
  { label: 'Design, Graphics & UI/UX', description: 'Graphic design, user interface, and user experience', logo: `${ICON_BASE}/1055/1055687.png` },
  { label: 'Law & Legal Careers', description: 'Legal practice, advocacy, and legal advisory', logo: `${ICON_BASE}/3135/3135810.png` },
  { label: 'Media & Journalism', description: 'Journalism, media production, and news reporting', logo: `${ICON_BASE}/3135/3135715.png` },
  { label: 'Leadership & Team Management', description: 'Team leadership, people management, and organizational development', logo: `${ICON_BASE}/3135/3135789.png` },
  { label: 'Social Impact & Community Work', description: 'NGOs, community development, and social work', logo: `${ICON_BASE}/3135/3135807.png` },
];

async function seedCareerGoals() {
  try {
    console.log('🌱 Seeding interests (career goals)...');
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timeout')), 5000))
    ]);

    let inserted = 0;
    let skipped = 0;

    for (const item of INTERESTS) {
      const check = await pool.query(
        'SELECT id, logo FROM career_goals_taxonomies WHERE LOWER(label) = LOWER($1)',
        [item.label]
      );

      if (check.rows.length > 0) {
        const existing = check.rows[0];
        if (!existing.logo) {
          await pool.query(
            'UPDATE career_goals_taxonomies SET logo = $1, description = COALESCE(description, $2) WHERE id = $3',
            [item.logo, item.description || null, existing.id]
          );
          console.log(`  ✓ Updated logo: ${item.label}`);
          inserted++;
        } else {
          console.log(`  ⏭️  Skipping "${item.label}" - already exists with logo`);
          skipped++;
        }
        continue;
      }

      await pool.query(
        `INSERT INTO career_goals_taxonomies (label, logo, description, status)
         VALUES ($1, $2, $3, true)`,
        [item.label, item.logo, item.description || null]
      );

      console.log(`  ✓ Added: ${item.label}`);
      inserted++;
    }

    console.log('\n✅ Interests seeded successfully!');
    console.log(`   Inserted: ${inserted}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding interests:', error.message);
    process.exit(1);
  }
}

seedCareerGoals();
