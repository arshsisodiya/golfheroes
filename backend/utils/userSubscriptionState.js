const db = require('../db');

function getLatestSubscriptionRecord(userId) {
  return [...db.subscriptions]
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))[0] || null;
}

function withSubscriptionMeta(user) {
  if (!user) return user;

  const latestSubscription = getLatestSubscriptionRecord(user.id);
  const subscriptionWillCancel = latestSubscription?.status === 'cancelled' && user.subscriptionStatus === 'active';

  return {
    ...user,
    subscriptionWillCancel,
    subscriptionAccessEndsAt: subscriptionWillCancel ? user.subscriptionRenewal || null : null,
  };
}

module.exports = {
  getLatestSubscriptionRecord,
  withSubscriptionMeta,
};
