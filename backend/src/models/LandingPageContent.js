const db = require('../config/database');
const { landingPageDefaults } = require('../constants/landingPageDefaults');
const { deepMergeLandingContent } = require('../utils/deepMergeLandingContent');

class LandingPageContent {
  static async getMerged() {
    const result = await db.query(
      'SELECT content_json FROM landing_page_content WHERE id = 1 LIMIT 1'
    );
    const stored =
      result.rows.length && result.rows[0].content_json
        ? result.rows[0].content_json
        : {};
    return deepMergeLandingContent(
      JSON.parse(JSON.stringify(landingPageDefaults)),
      typeof stored === 'object' && stored !== null ? stored : {}
    );
  }

  /**
   * Replace stored JSON (admin typically sends full merged payload from GET).
   */
  static async replaceContent(contentJson) {
    await db.query(
      `INSERT INTO landing_page_content (id, content_json, updated_at)
       VALUES (1, $1::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         content_json = EXCLUDED.content_json,
         updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(contentJson && typeof contentJson === 'object' ? contentJson : {})]
    );
    return LandingPageContent.getMerged();
  }
}

module.exports = LandingPageContent;
