/**
 * Seed script for automation_exams table
 * These are the exams that can be auto-filled by the bot
 * Run: node scripts/seedAutomationExams.js
 */
require('dotenv').config();
const { pool } = require('../src/config/database');

const automationExams = [
    {
        name: 'UPSC NDA',
        slug: 'upsc-nda',
        url: 'https://upsconline.nic.in/instruction',
        description: 'Union Public Service Commission - National Defence Academy Examination',
        field_mappings: {
            fullName: 'candidate_name',
            email: 'email',
            phone: 'mobile_number',
            dateOfBirth: 'dob',
            gender: 'gender',
            fatherName: 'father_name',
            motherName: 'mother_name',
            address: 'address',
            city: 'city',
            state: 'state',
            pincode: 'pincode'
        },
        agent_config: {
            maxRetries: 3,
            timeout: 120,
            provider: 'gemini'
        }
    },
    {
        name: 'JEE Main Registration',
        slug: 'jee-main',
        url: 'https://jeemain.nta.nic.in/',
        description: 'Joint Entrance Examination - Main for engineering admissions',
        field_mappings: {
            fullName: 'candidate_name',
            email: 'email',
            phone: 'mobile',
            dateOfBirth: 'dob',
            gender: 'gender',
            fatherName: 'father_name',
            motherName: 'mother_name'
        },
        agent_config: { maxRetries: 3, timeout: 120, provider: 'gemini' }
    },
    {
        name: 'NEET UG Registration',
        slug: 'neet-ug',
        url: 'https://neet.nta.nic.in/',
        description: 'National Eligibility cum Entrance Test for medical admissions',
        field_mappings: {
            fullName: 'applicant_name',
            email: 'email',
            phone: 'mobile',
            dateOfBirth: 'date_of_birth',
            gender: 'gender',
            fatherName: 'father_name',
            motherName: 'mother_name'
        },
        agent_config: { maxRetries: 3, timeout: 120, provider: 'gemini' }
    },
    {
        name: 'CUET UG Registration',
        slug: 'cuet-ug',
        url: 'https://cuet.samarth.ac.in/',
        description: 'Common University Entrance Test for central university admissions',
        field_mappings: {
            fullName: 'name',
            email: 'email',
            phone: 'mobile',
            dateOfBirth: 'dob',
            gender: 'gender'
        },
        agent_config: { maxRetries: 3, timeout: 120, provider: 'gemini' }
    }
];

async function seedAutomationExams() {
    try {
        console.log('🌱 Seeding automation exams...\n');

        for (const exam of automationExams) {
            const result = await pool.query(
                `INSERT INTO automation_exams (name, slug, url, field_mappings, agent_config, is_active) 
                 VALUES ($1, $2, $3, $4, $5, true)
                 ON CONFLICT (slug) DO UPDATE SET
                    name = EXCLUDED.name,
                    url = EXCLUDED.url,
                    field_mappings = EXCLUDED.field_mappings,
                    agent_config = EXCLUDED.agent_config,
                    updated_at = CURRENT_TIMESTAMP
                 RETURNING id`,
                [
                    exam.name,
                    exam.slug,
                    exam.url,
                    JSON.stringify(exam.field_mappings),
                    JSON.stringify(exam.agent_config)
                ]
            );
            console.log(`  ✓ ${exam.name} (ID: ${result.rows[0].id})`);
        }

        console.log('\n✅ Automation exams seeded successfully!');
        console.log('\n📍 To start automation:');
        console.log('   1. Go to Admin Panel → Applications');
        console.log('   2. Click "New Application"');
        console.log('   3. Select a user and an exam');
        console.log('   4. Approve the application');
        console.log('   5. Click "Start Automation"');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

seedAutomationExams();
