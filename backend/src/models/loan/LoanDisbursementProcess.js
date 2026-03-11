const db = require('../../config/database');

class LoanDisbursementProcess {
  static async findByLoanProviderId(loanProviderId) {
    const result = await db.query(
      'SELECT * FROM loan_disbursement_process WHERE loan_provider_id = $1 ORDER BY step_number ASC, id ASC',
      [loanProviderId]
    );
    return result.rows;
  }

  static async create(data) {
    const { loan_provider_id, step_number, description } = data;
    const result = await db.query(
      'INSERT INTO loan_disbursement_process (loan_provider_id, step_number, description) VALUES ($1, $2, $3) RETURNING *',
      [loan_provider_id, step_number ?? null, description || null]
    );
    return result.rows[0];
  }

  static async deleteByLoanProviderId(loanProviderId) {
    await db.query('DELETE FROM loan_disbursement_process WHERE loan_provider_id = $1', [loanProviderId]);
  }
}

module.exports = LoanDisbursementProcess;
