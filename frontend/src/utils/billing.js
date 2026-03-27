export const APP_CURRENCY = 'INR';

export const PLAN_OPTIONS = [
  { id: 'monthly', label: 'Monthly', amount: 9.99, period: '/month', note: 'Cancel anytime' },
  { id: 'yearly', label: 'Yearly', amount: 99.99, period: '/year', note: 'Save more with the annual plan', popular: true },
];

export function getPlanOption(planId) {
  return PLAN_OPTIONS.find((plan) => plan.id === planId) || PLAN_OPTIONS[0];
}

export function formatCurrency(value, digits = 2) {
  return `${APP_CURRENCY} ${Number(value || 0).toFixed(digits)}`;
}

export function formatCurrencyCompact(value) {
  return `${APP_CURRENCY} ${Number(value || 0).toLocaleString()}`;
}
