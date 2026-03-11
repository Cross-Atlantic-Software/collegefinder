/**
 * Seed script for streams table
 * Run from backend/: node scripts/seedStreams.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
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
        // Verify DB connection with timeout
        await Promise.race([
            pool.query('SELECT 1'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timeout (is PostgreSQL running?)')), 5000))
        ]);

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
        if (error.message && error.message.includes('does not exist') && error.message.includes('role')) {
            console.error('\n💡 Fix: PostgreSQL has no role "' + (process.env.DB_USER || 'postgres') + '".');
            console.error('   In backend/.env set DB_USER to your actual PostgreSQL username.');
            console.error('   On macOS (Homebrew) this is often your system username.');
            console.error('   If using Docker: run the script with the same DB_USER as in docker-compose (e.g. postgres).');
        }
        process.exit(1);
    }
}

seedStreams();
