/**
 * Seeds the hardcoded core PROFILE_PATHS into profile_field_registry as
 * status='approved' rows. Reuses the array (single source of truth) to avoid
 * drift and SQL-escaping pitfalls. Idempotent: ON CONFLICT (field_path) DO NOTHING,
 * so it is safe to run on every boot and never fights the hardcoded array.
 */
const { pool } = require('../../config/database');
const { PROFILE_PATHS } = require('../../services/adapterBuilderService/profileSchema');

async function seedCoreProfileFields() {
  if (!Array.isArray(PROFILE_PATHS) || PROFILE_PATHS.length === 0) return;

  // Build one parameterized multi-row INSERT.
  const values = [];
  const params = [];
  let i = 1;
  for (const { path, type, label } of PROFILE_PATHS) {
    values.push(`($${i++}, $${i++}, $${i++}, 'approved')`);
    params.push(path, type || 'text', label || path);
  }

  try {
    await pool.query(
      `INSERT INTO profile_field_registry (field_path, type, label, status)
       VALUES ${values.join(', ')}
       ON CONFLICT (field_path) DO NOTHING`,
      params
    );
    console.log(`✅ Seeded core profile fields into registry (${PROFILE_PATHS.length} paths)`);
  } catch (err) {
    console.warn(`⚠️  seedCoreProfileFields failed (non-fatal): ${err.message}`);
  }
}

module.exports = { seedCoreProfileFields };
