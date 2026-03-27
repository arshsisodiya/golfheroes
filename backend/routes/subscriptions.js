const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');
const { recordSubscriptionCharityContribution } = require('../utils/subscriptionCharity');
const { APP_CURRENCY, PLAN_CONFIG, getNextRenewalDate } = require('../utils/billing');
const { getLatestSubscriptionRecord, withSubscriptionMeta } = require('../utils/userSubscriptionState');
const {
  createOrder,
  getFrontendRazorpayKey,
  isRazorpayConfigured,
  verifyPaymentSignature,
  verifyWebhookSignature,
} = require('../utils/razorpay');

const router = express.Router();

function getSafeUser(user) {
  const { password: _, ...safeUser } = user;
  return withSubscriptionMeta(safeUser);
}

function getSubscriptionByOrderId(orderId) {
  return db.subscriptions.find((entry) => entry.razorpayOrderId === orderId);
}

async function finalizeSuccessfulPayment(subscriptionRecord, paymentDetails = {}) {
  if (!subscriptionRecord || subscriptionRecord.status === 'paid') {
    return subscriptionRecord;
  }

  const user = db.users.find((entry) => entry.id === subscriptionRecord.userId);
  if (!user) throw new Error('User not found for subscription');

  const baseDate =
    user.subscriptionStatus === 'active' &&
    user.subscriptionRenewal &&
    new Date(user.subscriptionRenewal).getTime() > Date.now()
      ? new Date(user.subscriptionRenewal)
      : new Date();

  user.subscriptionStatus = 'active';
  user.subscriptionPlan = subscriptionRecord.plan;
  user.subscriptionRenewal = getNextRenewalDate(subscriptionRecord.plan, baseDate);
  await db.syncUser(user);

  subscriptionRecord.status = 'paid';
  subscriptionRecord.razorpayPaymentId = paymentDetails.paymentId || subscriptionRecord.razorpayPaymentId || null;
  subscriptionRecord.paymentSignature = paymentDetails.signature || subscriptionRecord.paymentSignature || null;
  subscriptionRecord.updatedAt = new Date();
  await db.syncSubscription(subscriptionRecord);

  let contributionSummary = null;
  if (user.charityId) {
    const contribution = await recordSubscriptionCharityContribution({
      user,
      plan: subscriptionRecord.plan,
      charityId: user.charityId,
      charityContribution: user.charityContribution,
      sourceLabel: 'Subscription payment',
    });

    if (contribution) {
      const donation = {
        id: uuidv4(),
        charityId: contribution.charity.id,
        amount: contribution.amount,
        donorName: `${user.name} (subscription)`,
        donorEmail: user.email,
        note: contribution.note,
        createdAt: new Date(),
      };
      db.donations.push(donation);
      await db.syncDonation(donation);

      contributionSummary = {
        charityName: contribution.charity.name,
        amount: contribution.amount,
        percent: contribution.contributionPercent,
      };
    }
  }

  await sendEmail({
    to: user.email,
    subject: 'Subscription Activated - GolfHeroes',
    text: `Your ${PLAN_CONFIG[subscriptionRecord.plan].label} subscription is active. Renewal date: ${new Date(user.subscriptionRenewal).toLocaleDateString('en-GB')}.`,
  });

  return { subscriptionRecord, user, contributionSummary };
}

router.get('/config', authenticate, (req, res) => {
  res.json({
    razorpayKeyId: getFrontendRazorpayKey(),
    configured: isRazorpayConfigured(),
    plans: PLAN_CONFIG,
  });
});

router.get('/my', authenticate, (req, res) => {
  const user = getSafeUser(req.user);
  const plan = PLAN_CONFIG[user.subscriptionPlan] || null;
  const latestPayment = getLatestSubscriptionRecord(req.user.id);

  res.json({
    ...user,
    plan,
    latestPayment: latestPayment || null,
  });
});

router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLAN_CONFIG[plan]) {
      return res.status(400).json({ error: 'Invalid plan. Choose monthly or yearly.' });
    }
    if (!isRazorpayConfigured()) {
      return res.status(500).json({ error: 'Razorpay is not configured on the server.' });
    }

    const user = db.users.find((entry) => entry.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const receipt = `golf_${user.id.slice(0, 8)}_${Date.now()}`;
    const planMeta = PLAN_CONFIG[plan];
    const order = await createOrder({
      amount: planMeta.amount,
      receipt,
      notes: {
        userId: user.id,
        plan,
        charityId: user.charityId || '',
      },
    });

    const subscriptionRecord = {
      id: uuidv4(),
      userId: user.id,
      plan,
      amount: planMeta.amount,
      currency: order.currency || APP_CURRENCY,
      provider: 'razorpay',
      status: 'pending',
      razorpayOrderId: order.id,
      razorpayPaymentId: null,
      paymentSignature: null,
      notes: {
        receipt,
        charityId: user.charityId || null,
        charityContribution: user.charityContribution || 10,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.subscriptions.push(subscriptionRecord);
    await db.syncSubscription(subscriptionRecord);

    res.status(201).json({
      order,
      subscription: subscriptionRecord,
      razorpayKeyId: getFrontendRazorpayKey(),
      user: {
        name: user.name,
        email: user.email,
      },
      plan: planMeta,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create payment order' });
  }
});

router.post('/verify-payment', authenticate, async (req, res) => {
  try {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing Razorpay verification fields' });
    }

    const subscriptionRecord = getSubscriptionByOrderId(orderId);
    if (!subscriptionRecord || subscriptionRecord.userId !== req.user.id) {
      return res.status(404).json({ error: 'Subscription payment not found' });
    }

    const isValid = verifyPaymentSignature({ orderId, paymentId, signature });
    if (!isValid) {
      subscriptionRecord.status = 'failed';
      subscriptionRecord.updatedAt = new Date();
      await db.syncSubscription(subscriptionRecord);
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const result = await finalizeSuccessfulPayment(subscriptionRecord, { paymentId, signature });

    res.json({
      message: 'Subscription activated',
      user: getSafeUser(result.user),
      plan: PLAN_CONFIG[subscriptionRecord.plan],
      charityContribution: result.contributionSummary,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to verify payment' });
  }
});

router.post('/cancel', authenticate, async (req, res) => {
  const user = db.users.find((entry) => entry.id === req.user.id);
  const hasActiveAccess = user.subscriptionRenewal && new Date(user.subscriptionRenewal).getTime() > Date.now();
  user.subscriptionStatus = hasActiveAccess ? 'active' : 'cancelled';
  if (!hasActiveAccess) {
    user.subscriptionRenewal = null;
  }
  await db.syncUser(user);

  const latestPaid = getLatestSubscriptionRecord(user.id);

  if (latestPaid && latestPaid.status === 'paid') {
    latestPaid.status = 'cancelled';
    latestPaid.updatedAt = new Date();
    await db.syncSubscription(latestPaid);
  }

  await sendEmail({
    to: user.email,
    subject: 'Subscription Cancelled - GolfHeroes',
    text: hasActiveAccess
      ? `Your subscription will cancel at the end of the current billing period on ${new Date(user.subscriptionRenewal).toLocaleDateString('en-GB')}. You will keep access until then.`
      : 'Your subscription has been cancelled. You can reactivate anytime from your account settings.',
  });

  res.json({
    message: hasActiveAccess
      ? 'Subscription scheduled to cancel at period end'
      : 'Subscription cancelled',
    user: getSafeUser(user),
  });
});

router.put('/charity', authenticate, async (req, res) => {
  const { charityId, charityContribution } = req.body;
  const user = db.users.find((u) => u.id === req.user.id);
  if (charityId) {
    const c = db.charities.find((ch) => ch.id === charityId);
    if (!c) return res.status(404).json({ error: 'Charity not found' });
    user.charityId = charityId;
  }
  if (charityContribution !== undefined) {
    if (charityContribution < 10 || charityContribution > 100) {
      return res.status(400).json({ error: 'Contribution must be 10-100%' });
    }
    user.charityContribution = charityContribution;
  }
  await db.syncUser(user);
  res.json(getSafeUser(user));
});

async function handleWebhook(req, res) {
  try {
    const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const signature = req.headers['x-razorpay-signature'];

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    const payload = event.payload?.payment?.entity;
    const orderId = payload?.order_id;

    if (!orderId) {
      return res.json({ received: true });
    }

    const subscriptionRecord = getSubscriptionByOrderId(orderId);
    if (!subscriptionRecord) {
      return res.json({ received: true });
    }

    if (event.event === 'payment.captured') {
      await finalizeSuccessfulPayment(subscriptionRecord, {
        paymentId: payload.id,
        signature: signature || null,
      });
    }

    if (event.event === 'payment.failed') {
      subscriptionRecord.status = 'failed';
      subscriptionRecord.razorpayPaymentId = payload.id || null;
      subscriptionRecord.updatedAt = new Date();
      await db.syncSubscription(subscriptionRecord);
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Webhook handling failed' });
  }
}

module.exports = {
  router,
  handleWebhook,
};
