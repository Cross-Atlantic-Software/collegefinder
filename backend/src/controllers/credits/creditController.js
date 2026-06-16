const db = require('../../config/database');
const CreditWallet = require('../../models/credits/CreditWallet');
const CreditPack = require('../../models/credits/CreditPack');
const CreditOrder = require('../../models/credits/CreditOrder');
const CreditTransaction = require('../../models/credits/CreditTransaction');
const PaymentSettings = require('../../models/credits/PaymentSettings');
const { withTransaction, applyDelta } = require('../../models/credits/CreditLedger');
const { computeGst } = require('../../services/payments/gstMath');
const razorpay = require('../../services/payments/razorpay');

// Legal fields for the GST receipt are placeholders until the client supplies them.
const RECEIPT_LEGAL_PLACEHOLDERS = {
  legal_entity_name: 'TODO_LEGAL_ENTITY_NAME',
  gstin: 'TODO_GSTIN',
  hsn_sac: 'TODO_HSN_SAC'
};

function invoiceNumberFor(order) {
  const year = new Date().getFullYear();
  return `UTK-${year}-${String(order.id).padStart(6, '0')}`;
}

// Idempotent credit path shared by /orders/verify and the webhook. `order` MUST be a row
// locked FOR UPDATE inside `client`'s transaction. Returns { credited, order }.
async function creditPaidOrder(client, order, { paymentId, signature }) {
  if (order.status === 'paid') {
    return { credited: false, order };
  }
  const updated = await CreditOrder.markPaid(client, {
    id: order.id,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature || null,
    invoice_number: invoiceNumberFor(order)
  });
  await applyDelta(client, {
    userId: order.user_id,
    delta: order.credits,
    type: 'purchase',
    refType: 'credit_order',
    refId: order.id,
    note: `Purchased ${order.credits} credit(s)`
  });
  return { credited: true, order: updated };
}

// GET /api/credits/wallet
async function getWallet(req, res) {
  try {
    const wallet = await CreditWallet.getOrCreate(req.user.id);
    const recent = await CreditTransaction.recentForUser(req.user.id, 10);
    return res.json({ success: true, data: { balance: wallet.balance, recent_transactions: recent } });
  } catch (err) {
    console.error('getWallet error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load wallet' });
  }
}

// GET /api/credits/packs
async function getPacks(req, res) {
  try {
    const settings = await PaymentSettings.get();
    const packs = await CreditPack.listActive();
    const data = packs.map((p) => {
      const g = computeGst(p.price_inr, settings);
      return {
        id: p.id,
        name: p.name,
        credits: p.credits,
        price_inr: Number(p.price_inr),
        base: g.base,
        gst: g.gst,
        total: g.total,
        gst_mode: g.gst_mode,
        gst_percent: g.gst_percent
      };
    });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('getPacks error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load packs' });
  }
}

// POST /api/credits/orders  { pack_id }
async function createOrder(req, res) {
  try {
    if (!razorpay.isConfigured()) {
      return res.status(503).json({ success: false, message: 'Payment gateway not configured' });
    }
    const packId = parseInt(req.body.pack_id, 10);
    if (!packId) {
      return res.status(400).json({ success: false, message: 'pack_id is required' });
    }
    const pack = await CreditPack.findById(packId);
    if (!pack || !pack.is_active) {
      return res.status(404).json({ success: false, message: 'Pack not found' });
    }

    const settings = await PaymentSettings.get();
    const g = computeGst(pack.price_inr, settings);

    const rzpOrder = await razorpay.createOrder({
      amount_paise: g.amount_paise,
      currency: settings.currency || 'INR',
      receipt: `pack_${pack.id}_user_${req.user.id}`
    });

    const order = await CreditOrder.create({
      user_id: req.user.id,
      pack_id: pack.id,
      credits: pack.credits,
      gst_mode: g.gst_mode,
      gst_percent: g.gst_percent,
      base_amount: g.base,
      gst_amount: g.gst,
      total_amount: g.total,
      amount_paise: g.amount_paise,
      currency: settings.currency || 'INR',
      razorpay_order_id: rzpOrder.id
    });

    return res.json({
      success: true,
      data: {
        order_id: order.id,
        razorpay_order_id: rzpOrder.id,
        amount_paise: g.amount_paise,
        currency: order.currency,
        key_id: razorpay.getPublicKeyId(),
        pack: { id: pack.id, name: pack.name, credits: pack.credits }
      }
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create order' });
  }
}

// POST /api/credits/orders/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
async function verifyOrder(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing verification fields' });
  }

  // Reject a tampered/invalid signature BEFORE touching the wallet.
  const valid = razorpay.verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) {
    const existing = await CreditOrder.findByRazorpayOrderId(razorpay_order_id);
    if (existing && existing.status === 'created') {
      await CreditOrder.markFailed(existing.id);
    }
    return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
  }

  try {
    const result = await withTransaction(async (client) => {
      const order = await CreditOrder.findByRazorpayOrderIdForUpdate(client, razorpay_order_id);
      if (!order) {
        const e = new Error('Order not found');
        e.httpStatus = 404;
        throw e;
      }
      if (order.user_id !== req.user.id) {
        const e = new Error('Order does not belong to this user');
        e.httpStatus = 403;
        throw e;
      }
      return creditPaidOrder(client, order, {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature
      });
    });

    const wallet = await CreditWallet.getOrCreate(req.user.id);
    return res.json({
      success: true,
      message: result.credited ? 'Payment verified' : 'Payment already processed',
      data: {
        order_id: result.order.id,
        invoice_number: result.order.invoice_number,
        credits: result.order.credits,
        balance: wallet.balance
      }
    });
  } catch (err) {
    if (err.httpStatus) {
      return res.status(err.httpStatus).json({ success: false, message: err.message });
    }
    console.error('verifyOrder error:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
}

// POST /api/credits/webhook  (raw body; mounted before the JSON body parser in server.js)
async function webhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body; // Buffer, via express.raw
    if (!razorpay.verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    if (payload.event !== 'payment.captured') {
      // Acknowledge other events so Razorpay stops retrying.
      return res.json({ success: true, message: 'Ignored event' });
    }

    const entity = payload.payload?.payment?.entity || {};
    const razorpayOrderId = entity.order_id;
    const razorpayPaymentId = entity.id;
    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.json({ success: true, message: 'No order reference' });
    }

    await withTransaction(async (client) => {
      const order = await CreditOrder.findByRazorpayOrderIdForUpdate(client, razorpayOrderId);
      if (!order) return; // unknown order — nothing to credit
      await creditPaidOrder(client, order, { paymentId: razorpayPaymentId, signature: null });
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('webhook error:', err);
    return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
}

// GET /api/credits/transactions?limit=&offset=
async function getTransactions(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;
    const rows = await CreditTransaction.listForUser(req.user.id, {
      type: req.query.type,
      limit,
      offset
    });
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getTransactions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load transactions' });
  }
}

// GET /api/credits/orders/:id/receipt
async function getReceipt(req, res) {
  try {
    const order = await CreditOrder.findById(parseInt(req.params.id, 10));
    if (!order || order.user_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    if (order.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Order not paid' });
    }
    const pack = order.pack_id ? await CreditPack.findById(order.pack_id) : null;
    return res.json({
      success: true,
      data: {
        invoice_number: order.invoice_number,
        order_id: order.id,
        paid_at: order.paid_at,
        credits: order.credits,
        pack_name: pack ? pack.name : `${order.credits} credit(s)`,
        gst_mode: order.gst_mode,
        gst_percent: Number(order.gst_percent),
        base_amount: Number(order.base_amount),
        gst_amount: Number(order.gst_amount),
        total_amount: Number(order.total_amount),
        currency: order.currency,
        legal: RECEIPT_LEGAL_PLACEHOLDERS
      }
    });
  } catch (err) {
    console.error('getReceipt error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load receipt' });
  }
}

module.exports = {
  getWallet,
  getPacks,
  createOrder,
  verifyOrder,
  webhook,
  getTransactions,
  getReceipt,
  // exported for reuse by the extension fill-gate and admin controllers
  creditPaidOrder
};
