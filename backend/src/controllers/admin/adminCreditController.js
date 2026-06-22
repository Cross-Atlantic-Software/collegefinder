const CreditPack = require('../../models/credits/CreditPack');
const CreditOrder = require('../../models/credits/CreditOrder');
const CreditTransaction = require('../../models/credits/CreditTransaction');
const PaymentSettings = require('../../models/credits/PaymentSettings');
const FillCharge = require('../../models/credits/FillCharge');
const { withTransaction, applyDelta, InsufficientCreditsError } = require('../../models/credits/CreditLedger');
const creditService = require('../../services/credit/creditService');

// ---- Credit packs CRUD ----

async function listPacks(req, res) {
  try {
    const packs = await CreditPack.listAll();
    return res.json({ success: true, data: packs });
  } catch (err) {
    console.error('listPacks error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load packs' });
  }
}

async function createPack(req, res) {
  try {
    const { name, credits, price_inr, is_active, sort_order } = req.body || {};
    if (!name || credits == null || price_inr == null) {
      return res.status(400).json({ success: false, message: 'name, credits and price_inr are required' });
    }
    const pack = await CreditPack.create({
      name: String(name).slice(0, 100),
      credits: parseInt(credits, 10),
      price_inr: Number(price_inr),
      is_active: is_active === undefined ? true : !!is_active,
      sort_order: sort_order == null ? 0 : parseInt(sort_order, 10)
    });
    return res.status(201).json({ success: true, data: pack });
  } catch (err) {
    console.error('createPack error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create pack' });
  }
}

async function updatePack(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const fields = {};
    const { name, credits, price_inr, is_active, sort_order } = req.body || {};
    if (name !== undefined) fields.name = String(name).slice(0, 100);
    if (credits !== undefined) fields.credits = parseInt(credits, 10);
    if (price_inr !== undefined) fields.price_inr = Number(price_inr);
    if (is_active !== undefined) fields.is_active = !!is_active;
    if (sort_order !== undefined) fields.sort_order = parseInt(sort_order, 10);
    const pack = await CreditPack.update(id, fields);
    if (!pack) return res.status(404).json({ success: false, message: 'Pack not found' });
    return res.json({ success: true, data: pack });
  } catch (err) {
    console.error('updatePack error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update pack' });
  }
}

async function deletePack(req, res) {
  try {
    const ok = await CreditPack.remove(parseInt(req.params.id, 10));
    if (!ok) return res.status(404).json({ success: false, message: 'Pack not found' });
    return res.json({ success: true, message: 'Pack deleted' });
  } catch (err) {
    console.error('deletePack error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete pack' });
  }
}

// ---- Global payment settings (GST toggle) ----

async function getSettings(req, res) {
  try {
    const settings = await PaymentSettings.get();
    return res.json({ success: true, data: settings });
  } catch (err) {
    console.error('getSettings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
}

async function updateSettings(req, res) {
  try {
    const { gst_mode, gst_percent } = req.body || {};
    if (gst_mode !== undefined && gst_mode !== 'inclusive' && gst_mode !== 'exclusive') {
      return res.status(400).json({ success: false, message: "gst_mode must be 'inclusive' or 'exclusive'" });
    }
    const updated = await PaymentSettings.update({
      gst_mode,
      gst_percent: gst_percent === undefined ? undefined : Number(gst_percent)
    });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateSettings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
}

// ---- Reconciliation views ----

async function listOrders(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;
    const rows = await CreditOrder.listForAdmin({
      user_id: req.query.user_id ? parseInt(req.query.user_id, 10) : null,
      status: req.query.status || null,
      limit,
      offset
    });
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('listOrders error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load orders' });
  }
}

async function listTransactions(req, res) {
  try {
    // main's model exposes listAllAdmin({ userId, page, limit }) → { transactions, pagination }.
    // The admin page consumes res.data as a flat CreditTransactionAdmin[] (and sends only limit),
    // so return the rows under `data` and surface pagination alongside. No `type` filter is sent
    // by the page (it filters client-side), so it is intentionally not passed to the model.
    const userId = req.query.user_id ? parseInt(req.query.user_id, 10) : null;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const result = await CreditTransaction.listAllAdmin({ userId, page, limit });
    return res.json({ success: true, data: result.transactions, pagination: result.pagination });
  } catch (err) {
    console.error('listTransactions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load transactions' });
  }
}

// ---- Admin credit ledger (all users' transactions) ----

async function getLedger(req, res) {
  try {
    const page = req.query.page;
    const limit = req.query.limit ?? 10;
    const userId = req.query.user_id ?? req.query.userId ?? null;

    const result = await creditService.listAllTransactionsForAdmin({
      userId,
      page,
      limit,
    });

    res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching credit ledger:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credit ledger',
    });
  }
}

// ---- Manual wallet adjustment (super-admin) ----

async function adjustWallet(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    const delta = parseInt(req.body.delta, 10);
    const note = req.body.note ? String(req.body.note) : null;
    if (!userId || !delta || Number.isNaN(delta)) {
      return res.status(400).json({ success: false, message: 'userId and a non-zero integer delta are required' });
    }

    const result = await withTransaction(async (client) =>
      applyDelta(client, {
        userId,
        delta,
        type: 'admin_adjust',
        refType: 'admin',
        refId: req.admin?.id || null,
        note: note || `Admin adjustment by ${req.admin?.email || 'admin'}`
      })
    );

    return res.json({
      success: true,
      data: { user_id: userId, delta, balance: result.balance_after }
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return res.status(400).json({ success: false, message: 'Adjustment would make the balance negative' });
    }
    console.error('adjustWallet error:', err);
    return res.status(500).json({ success: false, message: 'Failed to adjust wallet' });
  }
}

// ---- Admin-initiated refund of an active fill charge ----

async function refundFillCharge(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await withTransaction(async (client) => {
      const charge = await FillCharge.findByIdForUpdate(client, id);
      if (!charge) return { notFound: true };
      if (charge.status !== 'active') return { notActive: true };

      const ledger = await applyDelta(client, {
        userId: charge.user_id,
        delta: charge.credits_charged,
        type: 'refund',
        refType: 'fill_charge',
        refId: charge.id,
        note: `Admin refund of application ${charge.exam_id} by ${req.admin?.email || 'admin'}`
      });
      const updated = await FillCharge.markRefunded(client, charge.id, ledger.transaction.id);
      return { charge: updated };
    });

    if (result.notFound) return res.status(404).json({ success: false, message: 'Charge not found' });
    if (result.notActive) return res.status(400).json({ success: false, message: 'Only active charges can be refunded' });
    return res.json({ success: true, message: 'Refunded', data: { charge_id: result.charge.id, status: result.charge.status } });
  } catch (err) {
    console.error('admin refundFillCharge error:', err);
    return res.status(500).json({ success: false, message: 'Failed to refund charge' });
  }
}

module.exports = {
  listPacks,
  createPack,
  updatePack,
  deletePack,
  getSettings,
  updateSettings,
  listOrders,
  listTransactions,
  adjustWallet,
  refundFillCharge,
  getLedger
};
