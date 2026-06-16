// Razorpay gateway wrapper — key-gated. Reads credentials from env; if keys (or the SDK)
// are missing, isConfigured() returns false and callers should return HTTP 503 rather
// than crash. Signature verification uses Node's built-in crypto, so it works even before
// the `razorpay` SDK is installed (the SDK is only needed to CREATE orders).
//
// Required env (set in backend/.env, never committed):
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET

const crypto = require('crypto');

const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

let sdkClient = null;
let sdkLoadFailed = false;

// Lazily construct the SDK client so a missing package / missing keys never crashes boot.
function getClient() {
  if (sdkClient || sdkLoadFailed) return sdkClient;
  try {
    const Razorpay = require('razorpay');
    sdkClient = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  } catch (err) {
    sdkLoadFailed = true;
    console.warn('⚠️  Razorpay SDK not available:', err.message);
  }
  return sdkClient;
}

// True only when we can actually create AND verify orders: keys present and SDK loadable.
function isConfigured() {
  if (!KEY_ID || !KEY_SECRET) return false;
  return !!getClient();
}

// The public key id is safe to hand to the browser checkout.
function getPublicKeyId() {
  return KEY_ID;
}

// Create a Razorpay order server-side. amount is in paise.
async function createOrder({ amount_paise, currency = 'INR', receipt }) {
  const client = getClient();
  if (!client) throw new Error('Payment gateway not configured');
  return client.orders.create({
    amount: amount_paise,
    currency,
    receipt,
    payment_capture: 1
  });
}

// HMAC_SHA256(order_id + '|' + payment_id, KEY_SECRET) === signature
function verifyPaymentSignature(orderId, paymentId, signature) {
  if (!KEY_SECRET || !orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return timingSafeEqualHex(expected, signature);
}

// Verify a webhook payload against RAZORPAY_WEBHOOK_SECRET. rawBody must be the exact
// bytes Razorpay sent (use express.raw on the webhook route).
function verifyWebhookSignature(rawBody, signature) {
  if (!WEBHOOK_SECRET || !rawBody || !signature) return false;
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return timingSafeEqualHex(expected, signature);
}

// Constant-time hex compare; returns false on length mismatch instead of throwing.
function timingSafeEqualHex(a, b) {
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = {
  isConfigured,
  getPublicKeyId,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature
};
