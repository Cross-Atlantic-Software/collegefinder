const db = require('../config/database');
const { mergeLegalDocument } = require('../utils/mergeLegalDocument');

function isMissingLegalTableError(err) {
  const code = err && err.code;
  const msg = err && err.message ? String(err.message) : '';
  return (
    code === '42P01' ||
    /relation ["']?legal_page_content["']? does not exist/i.test(msg) ||
    /legal_page_content/i.test(msg) && /does not exist/i.test(msg)
  );
}

class LegalPageContent {
  static async getMerged() {
    try {
      const result = await db.query(
        'SELECT content_json FROM legal_page_content WHERE id = 1 LIMIT 1'
      );
      let stored =
        result.rows.length && result.rows[0].content_json
          ? result.rows[0].content_json
          : {};
      if (typeof stored === 'string') {
        try {
          stored = JSON.parse(stored);
        } catch {
          stored = {};
        }
      }
      return mergeLegalDocument(typeof stored === 'object' && stored !== null ? stored : {});
    } catch (err) {
      if (isMissingLegalTableError(err)) {
        console.warn(
          '[LegalPageContent] Table legal_page_content is missing — returning defaults. Run migration: backend/src/database/migrations/add_legal_page_content.sql'
        );
        return mergeLegalDocument({});
      }
      throw err;
    }
  }

  static async replaceContent(contentJson) {
    const raw = contentJson && typeof contentJson === 'object' ? { ...contentJson } : {};
    try {
      await db.query(
        `INSERT INTO legal_page_content (id, content_json, updated_at)
         VALUES (1, $1::jsonb, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           content_json = EXCLUDED.content_json,
           updated_at = CURRENT_TIMESTAMP`,
        [JSON.stringify(raw)]
      );
    } catch (err) {
      if (isMissingLegalTableError(err)) {
        const e = new Error(
          'Database table legal_page_content is missing. Run migration backend/src/database/migrations/add_legal_page_content.sql then restart the API.'
        );
        e.code = err.code;
        throw e;
      }
      throw err;
    }
    return LegalPageContent.getMerged();
  }
}

module.exports = LegalPageContent;
