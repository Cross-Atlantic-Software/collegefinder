const db = require('../../config/database');

class LoanProvider {
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM loan_providers ORDER BY provider_name ASC'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM loan_providers WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM loan_providers WHERE LOWER(provider_name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const {
      provider_name,
      provider_type,
      interest_rate_min,
      interest_rate_max,
      processing_fee,
      max_loan_amount,
      moratorium_period_months,
      repayment_duration_years,
      collateral_required,
      coapplicant_required,
      tax_benefit_available,
      official_website_link,
      contact_email,
      contact_phone,
      description,
      logo
    } = data;
    const result = await db.query(
      `INSERT INTO loan_providers (
        provider_name, provider_type, interest_rate_min, interest_rate_max,
        processing_fee, max_loan_amount, moratorium_period_months, repayment_duration_years,
        collateral_required, coapplicant_required, tax_benefit_available,
        official_website_link, contact_email, contact_phone, description, logo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        provider_name || null,
        provider_type || null,
        interest_rate_min ?? null,
        interest_rate_max ?? null,
        processing_fee || null,
        max_loan_amount || null,
        moratorium_period_months ?? null,
        repayment_duration_years ?? null,
        !!collateral_required,
        !!coapplicant_required,
        !!tax_benefit_available,
        official_website_link || null,
        contact_email || null,
        contact_phone || null,
        description || null,
        logo || null
      ]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [
      'provider_name', 'provider_type', 'interest_rate_min', 'interest_rate_max',
      'processing_fee', 'max_loan_amount', 'moratorium_period_months', 'repayment_duration_years',
      'collateral_required', 'coapplicant_required', 'tax_benefit_available',
      'official_website_link', 'contact_email', 'contact_phone', 'description', 'logo'
    ];
    const updates = [];
    const values = [];
    let paramCount = 1;
    for (const key of fields) {
      if (data[key] !== undefined) {
        updates.push(`${key} = $${paramCount++}`);
        if (key === 'collateral_required' || key === 'coapplicant_required' || key === 'tax_benefit_available') {
          values.push(!!data[key]);
        } else {
          values.push(data[key] === '' ? null : data[key]);
        }
      }
    }
    if (updates.length === 0) return await this.findById(id);
    values.push(id);
    const result = await db.query(
      `UPDATE loan_providers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM loan_providers WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = LoanProvider;
