const db = require('../../config/database');

class LoanEligibleCountry {
  static async findByLoanProviderId(loanProviderId) {
    const result = await db.query(
      'SELECT * FROM loan_eligible_countries WHERE loan_provider_id = $1 ORDER BY id',
      [loanProviderId]
    );
    return result.rows;
  }

  static async create(data) {
    const { loan_provider_id, country_name } = data;
    const result = await db.query(
      'INSERT INTO loan_eligible_countries (loan_provider_id, country_name) VALUES ($1, $2) RETURNING *',
      [loan_provider_id, country_name || null]
    );
    return result.rows[0];
  }

  static async deleteByLoanProviderId(loanProviderId) {
    await db.query('DELETE FROM loan_eligible_countries WHERE loan_provider_id = $1', [loanProviderId]);
  }
}

module.exports = LoanEligibleCountry;
