const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'collegefinder_db',
    user: 'shahidmollick', // try mac user
  });

  try {
    await client.connect();
    console.log('Connected to DB as shahidmollick');
    
    // get exams and colleges
    const examRes = await client.query('SELECT id FROM exams_taxonomies LIMIT 5');
    const examIds = examRes.rows.map(r => r.id);

    const collegeRes = await client.query('SELECT id FROM colleges LIMIT 5');
    const collegeIds = collegeRes.rows.map(r => r.id);

    console.log('Exams:', examIds, 'Colleges:', collegeIds);
    if(examIds.length > 0 || collegeIds.length > 0) {
        const checkAcademics = await client.query('SELECT * FROM user_academics WHERE user_id = 1');
        if (checkAcademics.rows.length === 0) {
            await client.query(`
                INSERT INTO user_academics (user_id, user_shortlisted_exams, user_shortlisted_colleges)
                VALUES ($1, $2, $3)
            `, [1, examIds, collegeIds]);
        } else {
            await client.query(`
                UPDATE user_academics 
                SET user_shortlisted_exams = $2, user_shortlisted_colleges = $3
                WHERE user_id = $1
            `, [1, examIds, collegeIds]);
        }
        console.log('Updated user_academics');
    }
    
  } catch (err) {
    console.error('Error with shahidmollick:', err.message);
  } finally {
    await client.end();
  }
}

main();
