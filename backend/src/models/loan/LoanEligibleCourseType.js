const db = require('../../config/database');

class LoanEligibleCourseType {
  static async findByLoanProviderId(loanProviderId) {
    const result = await db.query(
      'SELECT * FROM loan_eligible_course_types WHERE loan_provider_id = $1 ORDER BY id',
      [loanProviderId]
    );
    return result.rows;
  }

  static async create(data) {
    const { loan_provider_id, course_type } = data;
    const result = await db.query(
      'INSERT INTO loan_eligible_course_types (loan_provider_id, course_type) VALUES ($1, $2) RETURNING *',
      [loan_provider_id, course_type || null]
    );
    return result.rows[0];
  }

  static async deleteByLoanProviderId(loanProviderId) {
    await db.query('DELETE FROM loan_eligible_course_types WHERE loan_provider_id = $1', [loanProviderId]);
  }
}

module.exports = LoanEligibleCourseType;
