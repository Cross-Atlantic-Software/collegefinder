const db = require('../../../config/database');

class EmailTemplate {
  static async findByType(type) {
    const result = await db.query(
      'SELECT * FROM email_templates WHERE type = $1',
      [type]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM email_templates WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll() {
    const result = await db.query(
      'SELECT id, type, subject, body_html, created_at, updated_at FROM email_templates ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async create(type, subject, bodyHtml) {
    const result = await db.query(
      `INSERT INTO email_templates (type, subject, body_html) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [type, subject, bodyHtml]
    );
    return result.rows[0];
  }

  static async update(id, subject, bodyHtml) {
    const result = await db.query(
      `UPDATE email_templates 
       SET subject = $1, body_html = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [subject, bodyHtml, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM email_templates WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Replace template variables with actual values
   * @param {string} template - HTML template string
   * @param {object} variables - Object with variable values
   * @returns {string} - Template with replaced variables
   */
  static replaceVariables(template, variables = {}) {
    let result = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });
    return result;
  }
}

module.exports = EmailTemplate;

