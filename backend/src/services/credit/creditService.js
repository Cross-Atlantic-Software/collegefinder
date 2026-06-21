const { pool } = require('../../config/database');
const UserCredit = require('../../models/credits/UserCredit');
const CreditTransaction = require('../../models/credits/CreditTransaction');

const APPLICATION_FEE_QUERY = `
  SELECT
    aa.id,
    aa.user_id,
    aa.exam_id,
    aa.status,
    COALESCE(e.name, et.name) AS exam_name,
    ed.ut_service_fee
  FROM automation_applications aa
  LEFT JOIN automation_exams e ON aa.exam_id = e.id
  LEFT JOIN exams_taxonomies et ON et.id = COALESCE(aa.taxonomy_exam_id, e.taxonomy_exam_id)
  LEFT JOIN exam_dates ed ON ed.exam_id = COALESCE(aa.taxonomy_exam_id, e.taxonomy_exam_id, et.id)
  WHERE aa.id = $1 AND aa.user_id = $2
  LIMIT 1
`;

function normalizeCreditAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * 100) / 100;
}

function insufficientCreditsError(required, available) {
  const error = new Error(
    `Insufficient UT Credits. Required: ${required}, available: ${available}.`
  );
  error.code = 'INSUFFICIENT_CREDITS';
  error.statusCode = 402;
  error.details = { required, available };
  return error;
}

async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getBalance(userId) {
  return UserCredit.getBalance(userId);
}

async function getTransactionHistory(userId, options) {
  return CreditTransaction.listByUserId(userId, options);
}

async function purchaseCredits(userId, rawAmount, metadata = {}) {
  const amount = normalizeCreditAmount(rawAmount);
  if (amount <= 0) {
    const error = new Error('Purchase amount must be greater than zero.');
    error.statusCode = 400;
    throw error;
  }
  if (amount > 100000) {
    const error = new Error('Purchase amount exceeds the allowed limit.');
    error.statusCode = 400;
    throw error;
  }

  return withTransaction(async (client) => {
    const wallet = await UserCredit.ensureRowForUpdate(client, userId);
    const currentBalance = Number(wallet.balance);
    const nextBalance = Math.round((currentBalance + amount) * 100) / 100;

    const transaction = await CreditTransaction.create(client, {
      user_id: userId,
      type: 'purchase',
      amount,
      balance_after: nextBalance,
      reference_type: 'credit_purchase',
      reference_id: null,
      description: `Purchased ${amount} UT Credits`,
      idempotency_key: `purchase:${userId}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`,
      metadata,
    });

    await UserCredit.updateBalance(client, userId, nextBalance);

    return {
      balance: nextBalance,
      transaction,
    };
  });
}

async function deductCreditsForRegistration(userId, applicationId) {
  const appId = Number(applicationId);
  if (!Number.isInteger(appId) || appId <= 0) {
    const error = new Error('Valid application_id is required.');
    error.statusCode = 400;
    throw error;
  }

  return withTransaction(async (client) => {
    const deductKey = `deduct:application:${appId}`;
    const existingDeduction = await CreditTransaction.findByIdempotencyKey(client, deductKey);
    if (existingDeduction) {
      const wallet = await UserCredit.ensureRowForUpdate(client, userId);
      return {
        alreadyDeducted: true,
        amount: existingDeduction.amount,
        balance: Number(wallet.balance),
        transaction: existingDeduction,
      };
    }

    const appResult = await client.query(APPLICATION_FEE_QUERY, [appId, userId]);
    const application = appResult.rows[0];
    if (!application) {
      const error = new Error('Application not found.');
      error.statusCode = 404;
      throw error;
    }

    const fee = normalizeCreditAmount(application.ut_service_fee);
    if (fee <= 0) {
      return {
        alreadyDeducted: false,
        amount: 0,
        balance: Number((await UserCredit.ensureRowForUpdate(client, userId)).balance),
        transaction: null,
        exam_name: application.exam_name,
        skipped: true,
      };
    }

    const wallet = await UserCredit.ensureRowForUpdate(client, userId);
    const currentBalance = Number(wallet.balance);
    if (currentBalance < fee) {
      throw insufficientCreditsError(fee, currentBalance);
    }

    const nextBalance = Math.round((currentBalance - fee) * 100) / 100;
    const transaction = await CreditTransaction.create(client, {
      user_id: userId,
      type: 'deduction',
      amount: fee,
      balance_after: nextBalance,
      reference_type: 'automation_application',
      reference_id: appId,
      description: `Exam registration: ${application.exam_name}`,
      idempotency_key: deductKey,
      metadata: {
        exam_id: application.exam_id,
        exam_name: application.exam_name,
      },
    });

    await UserCredit.updateBalance(client, userId, nextBalance);

    return {
      alreadyDeducted: false,
      amount: fee,
      balance: nextBalance,
      transaction,
      exam_name: application.exam_name,
      skipped: false,
    };
  });
}

async function refundCreditsForRegistration(userId, applicationId, reason = 'Registration failed') {
  const appId = Number(applicationId);
  if (!Number.isInteger(appId) || appId <= 0) {
    const error = new Error('Valid application_id is required.');
    error.statusCode = 400;
    throw error;
  }

  return withTransaction(async (client) => {
    const refundKey = `refund:application:${appId}`;
    const existingRefund = await CreditTransaction.findByIdempotencyKey(client, refundKey);
    if (existingRefund) {
      const wallet = await UserCredit.ensureRowForUpdate(client, userId);
      return {
        alreadyRefunded: true,
        amount: existingRefund.amount,
        balance: Number(wallet.balance),
        transaction: existingRefund,
      };
    }

    const deduction = await CreditTransaction.findDeductionForApplication(client, appId);
    if (!deduction) {
      return {
        alreadyRefunded: false,
        amount: 0,
        balance: Number((await UserCredit.ensureRowForUpdate(client, userId)).balance),
        transaction: null,
        skipped: true,
      };
    }

    if (deduction.user_id !== userId) {
      const error = new Error('Application not found.');
      error.statusCode = 404;
      throw error;
    }

    const wallet = await UserCredit.ensureRowForUpdate(client, userId);
    const currentBalance = Number(wallet.balance);
    const refundAmount = Number(deduction.amount);
    const nextBalance = Math.round((currentBalance + refundAmount) * 100) / 100;

    const transaction = await CreditTransaction.create(client, {
      user_id: userId,
      type: 'refund',
      amount: refundAmount,
      balance_after: nextBalance,
      reference_type: 'automation_application',
      reference_id: appId,
      description: `${reason}: ${deduction.metadata?.exam_name || 'Exam registration'}`,
      idempotency_key: refundKey,
      metadata: {
        deduction_transaction_id: deduction.id,
        reason,
      },
    });

    await UserCredit.updateBalance(client, userId, nextBalance);

    return {
      alreadyRefunded: false,
      amount: refundAmount,
      balance: nextBalance,
      transaction,
      skipped: false,
    };
  });
}

async function listAllTransactionsForAdmin(options = {}) {
  return CreditTransaction.listAllAdmin(options);
}

module.exports = {
  getBalance,
  getTransactionHistory,
  listAllTransactionsForAdmin,
  purchaseCredits,
  deductCreditsForRegistration,
  refundCreditsForRegistration,
};
