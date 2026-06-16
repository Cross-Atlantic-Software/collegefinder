// Shared GST math for credit packs. Used by both order-create and receipt rendering so
// the numbers always agree. Pure function — no DB, no side effects.
//
//   inclusive (default): the displayed price already contains GST; back it out.
//     base  = round(price / (1 + g/100), 2)
//     gst   = round(price - base, 2)
//     total = price
//   exclusive: the displayed price is pre-tax; add GST on top.
//     base  = price
//     gst   = round(price * g/100, 2)
//     total = round(price + gst, 2)
//
// amount_paise is the integer paise the gateway charges (Razorpay needs integer paise).
//
// Sanity: ₹49 inclusive @18% -> base 41.53, gst 7.47, total 49.00 -> 4900 paise.

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * @param {number} price  the pack's all-in displayed price (price_inr)
 * @param {{ gst_mode: 'inclusive'|'exclusive', gst_percent: number }} settings
 * @returns {{ base: number, gst: number, total: number, amount_paise: number, gst_mode: string, gst_percent: number }}
 */
function computeGst(price, settings) {
  const gstPercent = Number(settings.gst_percent);
  const gstMode = settings.gst_mode === 'exclusive' ? 'exclusive' : 'inclusive';
  const p = Number(price);

  let base;
  let gst;
  let total;

  if (gstMode === 'exclusive') {
    base = round2(p);
    gst = round2(p * (gstPercent / 100));
    total = round2(base + gst);
  } else {
    base = round2(p / (1 + gstPercent / 100));
    gst = round2(p - base);
    total = round2(p);
  }

  return {
    base,
    gst,
    total,
    amount_paise: Math.round(total * 100),
    gst_mode: gstMode,
    gst_percent: gstPercent
  };
}

module.exports = { computeGst, round2 };
