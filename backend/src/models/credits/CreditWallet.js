const db = require('../../config/database');

// CreditWallet — read access + lazy creation of a user's wallet row.
// All balance MUTATIONS go through CreditLedger.applyDelta, never here.
class CreditWallet {
  // Ensure a zero-balance wallet exists and return it.
  static async getOrCreate(userId) {
    await db.query(
      'INSERT INTO credit_wallets (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING',
      [userId]
    );
    const result = await db.query('SELECT * FROM credit_wallets WHERE user_id = $1', [userId]);
    return result.rows[0];
  }

  static async getBalance(userId) {
    const wallet = await this.getOrCreate(userId);
    return wallet.balance;
  }
}

module.exports = CreditWallet;
