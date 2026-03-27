const crypto = require('crypto');
const { APP_CURRENCY, PLAN_CONFIG } = require('./billing');

function getRazorpayConfig() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  };
}

function isRazorpayConfigured() {
  const { keyId, keySecret } = getRazorpayConfig();
  return Boolean(keyId && keySecret);
}

function getFrontendRazorpayKey() {
  return process.env.RAZORPAY_KEY_ID || '';
}

function amountToPaise(amount) {
  return Math.round(Number(amount) * 100);
}

async function razorpayRequest(path, options = {}) {
  const { keyId, keySecret } = getRazorpayConfig();
  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured');
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.description || data.error?.reason || `Razorpay request failed: ${response.status}`);
  }

  return data;
}

async function createOrder({ amount, receipt, notes }) {
  return razorpayRequest('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: amountToPaise(amount),
      currency: APP_CURRENCY,
      receipt,
      notes,
    }),
  });
}

function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const { keySecret } = getRazorpayConfig();
  if (!keySecret) return false;

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expected === signature;
}

function verifyWebhookSignature(rawBody, signature) {
  const { webhookSecret } = getRazorpayConfig();
  if (!webhookSecret || !signature) return false;

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expected === signature;
}

module.exports = {
  PLAN_CONFIG,
  amountToPaise,
  createOrder,
  getFrontendRazorpayKey,
  getRazorpayConfig,
  isRazorpayConfigured,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
