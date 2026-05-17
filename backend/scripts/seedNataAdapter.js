/**
 * Seed NATA adapter into exam_adapters table.
 * Run: node backend/scripts/seedNataAdapter.js
 */

require('dotenv').config();
const db = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    await db.init();

    const adapterPath = path.join(__dirname, '../../examfill-extension/adapters/nata.json');
    const adapterConfig = JSON.parse(fs.readFileSync(adapterPath, 'utf8'));

    const { exam_id, exam_name, portal_url_pattern, version } = adapterConfig;

    const configWithoutMeta = { sections: adapterConfig.sections };

    await db.query(
      `INSERT INTO exam_adapters (exam_id, exam_name, portal_url_pattern, adapter_config, version, is_active, last_verified_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, TRUE, CURRENT_TIMESTAMP)
       ON CONFLICT (exam_id) DO UPDATE SET
         exam_name = EXCLUDED.exam_name,
         portal_url_pattern = EXCLUDED.portal_url_pattern,
         adapter_config = EXCLUDED.adapter_config,
         version = EXCLUDED.version,
         is_active = TRUE,
         last_verified_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP`,
      [exam_id, exam_name, portal_url_pattern, JSON.stringify(configWithoutMeta), version]
    );

    console.log(`Adapter seeded: ${exam_name} (${exam_id}) v${version}`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
