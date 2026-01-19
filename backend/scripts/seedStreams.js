/**
 * Seed script for streams table
 * Run: node scripts/seedStreams.js
 */
require('dotenv').config();
const { pool } = require('../src/config/database');

const streams = [
    'Science (PCM)',
    'Science (PCB)',
    'Commerce',
    'Arts/Humanities',
    'Computer Science',
    'Agriculture',
    'Vocational'
];

async function seedStreams() {
    try {
        console.log('🌱 Seeding streams...');

        for (const streamName of streams) {
            await pool.query(
                `INSERT INTO streams (name, status) 
                 VALUES ($1, true) 
                 ON CONFLICT (name) DO NOTHING`,
                [streamName]
            );
            console.log(`  ✓ Added: ${streamName}`);
        }

        console.log('\n✅ Streams seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding streams:', error.message);
        process.exit(1);
    }
}

seedStreams();
