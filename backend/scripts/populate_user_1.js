require('dotenv').config();
const db = require('../src/config/database');

async function main() {
  try {
    const userRes = await db.query('SELECT * FROM users WHERE id = 1');
    if (userRes.rows.length === 0) {
      console.log('User 1 does not exist. Creating it...');
      await db.query(`INSERT INTO users (id, email, name, first_name, last_name, is_active) VALUES (1, 'test@example.com', 'Test User', 'Test', 'User', true)`);
    }

    const examRes = await db.query('SELECT id FROM exams_taxonomies LIMIT 5');
    const examIds = examRes.rows.map(r => r.id);

    const collegeRes = await db.query('SELECT id FROM colleges LIMIT 5');
    const collegeIds = collegeRes.rows.map(r => r.id);
    
    if (examIds.length === 0) {
      console.log('Warning: No exams in database. Inserting one dummy exam.');
      const res = await db.query(`INSERT INTO exams_taxonomies (name, code, exam_type, conducting_authority, number_of_papers) VALUES ('Test Exam', 'TEST', 'National', 'NTA', 1) RETURNING id`);
      examIds.push(res.rows[0].id);
    }
    
    if (collegeIds.length === 0) {
      console.log('Warning: No colleges in database. Inserting one dummy college.');
      const res = await db.query(`INSERT INTO colleges (name, slug) VALUES ('Test College', 'test-college') RETURNING id`);
      collegeIds.push(res.rows[0].id);
    }

    const checkAcademics = await db.query('SELECT * FROM user_academics WHERE user_id = 1');
    if (checkAcademics.rows.length === 0) {
        console.log('Inserting into user_academics...');
        await db.query(`
            INSERT INTO user_academics (user_id, user_shortlisted_exams, user_shortlisted_colleges)
            VALUES ($1, $2, $3)
        `, [1, examIds, collegeIds]);
    } else {
        console.log('Updating user_academics...');
        await db.query(`
            UPDATE user_academics 
            SET user_shortlisted_exams = $2, user_shortlisted_colleges = $3
            WHERE user_id = $1
        `, [1, examIds, collegeIds]);
    }

    console.log('Successfully populated user 1 with exams:', examIds, 'and colleges:', collegeIds);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (db.pool) {
      await db.pool.end();
    }
  }
}

main();
