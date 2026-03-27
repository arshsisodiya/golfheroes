const APP_CURRENCY = 'INR';

const PLAN_CONFIG = {
  monthly: { amount: 9.99, label: 'Monthly', billingCycleDays: 30 },
  yearly: { amount: 99.99, label: 'Yearly', billingCycleDays: 365 },
};

function getPlanAmount(plan) {
  return Number(PLAN_CONFIG[plan]?.amount || 0);
}

function getMonthlyPlanValue(plan) {
  if (plan === 'yearly') {
    return Number((PLAN_CONFIG.yearly.amount / 12).toFixed(2));
  }

  return getPlanAmount(plan || 'monthly');
}

function getNextRenewalDate(plan, fromDate = new Date()) {
  const cycleDays = Number(PLAN_CONFIG[plan]?.billingCycleDays || 0);
  return new Date(new Date(fromDate).getTime() + cycleDays * 24 * 60 * 60 * 1000);
}

module.exports = {
  APP_CURRENCY,
  PLAN_CONFIG,
  getMonthlyPlanValue,
  getNextRenewalDate,
  getPlanAmount,
};
