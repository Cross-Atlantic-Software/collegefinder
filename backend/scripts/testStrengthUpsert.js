require('dotenv').config();
const db = require('../src/config/database');
const StrengthResult = require('../src/models/strength/StrengthResult');

(async () => {
  try {
    const cols = await db.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='strength_results' ORDER BY ordinal_position"
    );
    console.log('columns:', cols.rows);

    const admin = await db.query("SELECT id, type FROM admin_users LIMIT 3");
    console.log('admins:', admin.rows);

    const expert = await db.query('SELECT id, name, created_by FROM admission_experts WHERE id = 1');
    console.log('expert 1:', expert.rows[0]);

    const r = await StrengthResult.upsert({
      user_id: 41,
      counsellor_admin_id: admin.rows[0]?.id || 1,
      strengths: ['communication'],
      career_recommendations: [{ career: 'SDE', details: 'test' }],
      report_url: null,
      assigned_expert_ids: [1],
    });
    console.log('upsert ok id=', r.id);
  } catch (e) {
    console.error('FAIL', e.message, e.code, e.detail);
  }
  process.exit(0);
})();
