const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const token = jwt.sign({ id: 1 }, secret, { expiresIn: '1h' });

async function main() {
  try {
    // 1. Get all exams
    const examsRes = await fetch('http://localhost:5001/api/auth/profile/dashboard-exams', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const examsData = await examsRes.json();
    console.log('Exams Data:', examsData);
    
    // We need at least one exam ID
    // Let's assume examsData.data.exams exists or something
    
    // Actually, there's PUT /api/auth/profile/shortlisted-exams
    // Body: { "exam_id": <id>, "shortlisted": true }

    // Let's just pick exam_ids 1, 2, 3 and college_ids 1, 2, 3 and try.
    const examIds = [1, 2, 3];
    for (const eid of examIds) {
      const res = await fetch('http://localhost:5001/api/auth/profile/shortlisted-exams', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ exam_id: eid, shortlisted: true })
      });
      console.log(`Exam ${eid}:`, await res.json());
    }

    const collegeIds = [1, 2, 3];
    for (const cid of collegeIds) {
      const res = await fetch('http://localhost:5001/api/auth/profile/shortlisted-colleges', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ college_id: cid, shortlisted: true })
      });
      console.log(`College ${cid}:`, await res.json());
    }

  } catch(e) {
    console.error(e);
  }
}

main();
