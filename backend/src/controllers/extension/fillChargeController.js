const db = require('../../config/database');
const CreditWallet = require('../../models/credits/CreditWallet');
const FillCharge = require('../../models/credits/FillCharge');
const { withTransaction, applyDelta, InsufficientCreditsError } = require('../../models/credits/CreditLedger');

// Where the extension deep-links a student to buy credits (web app only).
function walletUrl() {
  const base = process.env.FRONTEND_URL || 'http://localhost:3000';
  return process.env.CREDITS_WALLET_URL || `${base}/user-profile?tab=credits`;
}

// Read an active adapter's per-exam money fields. Defaults credit_cost to 1.
async function getAdapterMoney(examId) {
  const result = await db.query(
    `SELECT credit_cost, exam_fee FROM exam_adapters WHERE exam_id = $1 AND is_active = TRUE`,
    [examId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    credit_cost: row.credit_cost == null ? 1 : row.credit_cost,
    exam_fee: row.exam_fee == null ? null : Number(row.exam_fee)
  };
}

// GET /api/extension/credit-status?exam_id=
async function getCreditStatus(req, res) {
  try {
    const examId = req.query.exam_id;
    if (!examId) return res.status(400).json({ success: false, message: 'exam_id is required' });

    const money = await getAdapterMoney(examId);
    if (!money) return res.status(404).json({ success: false, message: 'Adapter not found' });

    const balance = await CreditWallet.getBalance(req.user.id);
    const active = await FillCharge.findActive(req.user.id, examId);

    return res.json({
      success: true,
      data: {
        balance,
        credit_cost: money.credit_cost,
        exam_fee: money.exam_fee,
        sufficient: active ? true : balance >= money.credit_cost,
        has_active_charge: !!active
      }
    });
  } catch (err) {
    console.error('getCreditStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load credit status' });
  }
}

// POST /api/extension/fill-charge  { exam_id }
// Charge once per application. If an active charge already exists, return it (no re-charge).
async function createFillCharge(req, res) {
  try {
    const examId = req.body.exam_id;
    if (!examId) return res.status(400).json({ success: false, message: 'exam_id is required' });

    const money = await getAdapterMoney(examId);
    if (!money) return res.status(404).json({ success: false, message: 'Adapter not found' });
    const creditCost = money.credit_cost;

    const result = await withTransaction(async (client) => {
      // Already charged for this application? Return it untouched (no re-charge).
      const existing = await FillCharge.findActiveForUpdate(client, req.user.id, examId);
      if (existing) return { charge: existing, reused: true, balance_after: null };

      // applyDelta locks the wallet row and throws InsufficientCreditsError if the debit
      // would drive the balance negative — this is the atomic balance check.
      const ledger = await applyDelta(client, {
        userId: req.user.id,
        delta: -creditCost,
        type: 'fill_debit',
        refType: 'fill_charge',
        refId: null,
        note: `Auto-fill charge for ${examId}`
      });

      // The partial unique index makes a concurrent second active charge impossible;
      // if that race fires this INSERT throws 23505 and the whole txn (incl. debit) rolls back.
      const charge = await FillCharge.createActive(client, {
        userId: req.user.id,
        examId,
        creditsCharged: creditCost,
        debitTxnId: ledger.transaction.id
      });
      return { charge, reused: false, balance_after: ledger.balance_after };
    });

    const balance = result.balance_after != null
      ? result.balance_after
      : await CreditWallet.getBalance(req.user.id);

    return res.json({
      success: true,
      message: result.reused ? 'Application already charged' : 'Charged',
      data: {
        charge_id: result.charge.id,
        exam_id: examId,
        credits_charged: result.charge.credits_charged,
        status: result.charge.status,
        balance
      }
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: 'You do not have enough credits',
        shortfall: err.shortfall,
        wallet_url: walletUrl()
      });
    }
    // Concurrent double-charge lost the race on the partial unique index — treat as
    // already charged by returning the now-existing active charge.
    if (err.code === '23505') {
      try {
        const existing = await FillCharge.findActive(req.user.id, req.body.exam_id);
        if (existing) {
          const balance = await CreditWallet.getBalance(req.user.id);
          return res.json({
            success: true,
            message: 'Application already charged',
            data: {
              charge_id: existing.id,
              exam_id: existing.exam_id,
              credits_charged: existing.credits_charged,
              status: existing.status,
              balance
            }
          });
        }
      } catch (_) { /* fall through to 500 */ }
    }
    console.error('createFillCharge error:', err);
    return res.status(500).json({ success: false, message: 'Failed to start fill charge' });
  }
}

// POST /api/extension/fill-charge/complete  { exam_id }
async function completeFillCharge(req, res) {
  try {
    const examId = req.body.exam_id;
    if (!examId) return res.status(400).json({ success: false, message: 'exam_id is required' });

    const updated = await withTransaction(async (client) => {
      const active = await FillCharge.findActiveForUpdate(client, req.user.id, examId);
      if (!active) return null;
      return FillCharge.markCompleted(client, active.id);
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'No active application to complete' });
    }
    return res.json({ success: true, data: { charge_id: updated.id, status: updated.status } });
  } catch (err) {
    console.error('completeFillCharge error:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete application' });
  }
}

// POST /api/extension/fill-charge/refund  { exam_id }
// Student cancels an ACTIVE application -> credits returned to the wallet.
async function refundFillCharge(req, res) {
  try {
    const examId = req.body.exam_id;
    if (!examId) return res.status(400).json({ success: false, message: 'exam_id is required' });

    const result = await withTransaction(async (client) => {
      const active = await FillCharge.findActiveForUpdate(client, req.user.id, examId);
      if (!active) return null;

      const ledger = await applyDelta(client, {
        userId: req.user.id,
        delta: active.credits_charged,
        type: 'refund',
        refType: 'fill_charge',
        refId: active.id,
        note: `Refund for cancelled application ${examId}`
      });
      const updated = await FillCharge.markRefunded(client, active.id, ledger.transaction.id);
      return { charge: updated, balance_after: ledger.balance_after };
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'No active application to refund' });
    }
    return res.json({
      success: true,
      message: 'Credits refunded',
      data: { charge_id: result.charge.id, status: result.charge.status, balance: result.balance_after }
    });
  } catch (err) {
    console.error('refundFillCharge error:', err);
    return res.status(500).json({ success: false, message: 'Failed to refund application' });
  }
}

module.exports = {
  getCreditStatus,
  createFillCharge,
  completeFillCharge,
  refundFillCharge
};
