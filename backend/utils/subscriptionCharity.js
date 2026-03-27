const db = require('../db');
const { getPlanAmount } = require('./billing');

async function recordSubscriptionCharityContribution({
  user,
  plan,
  charityId,
  charityContribution,
  sourceLabel = 'Subscription activation',
}) {
  const planAmount = getPlanAmount(plan);
  if (!user || !charityId || !planAmount) return null;

  const charity = db.charities.find((entry) => entry.id === charityId && entry.active);
  if (!charity) return null;

  const contributionPercent = Number(charityContribution || 10);
  const amount = Number(((planAmount * contributionPercent) / 100).toFixed(2));

  charity.totalReceived = Number((Number(charity.totalReceived || 0) + amount).toFixed(2));
  await db.syncCharity(charity);

  return {
    charity,
    amount,
    contributionPercent,
    note: `${sourceLabel} (${plan}, ${contributionPercent}%)`,
  };
}

module.exports = {
  recordSubscriptionCharityContribution,
};
