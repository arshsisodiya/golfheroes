const jwt = require('jsonwebtoken');
const db = require('../db');
const logger = require('../utils/logger');
const { getLatestSubscriptionRecord } = require('../utils/userSubscriptionState');

const JWT_SECRET = process.env.JWT_SECRET || 'golf_heroes_secret_2026';

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.users.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Real-time lifecycle enforcement: active subscriptions become lapsed after renewal date.
    if (
      user.role !== 'admin' &&
      user.subscriptionStatus === 'active' &&
      user.subscriptionRenewal &&
      new Date(user.subscriptionRenewal).getTime() < Date.now()
    ) {
      const latestSubscription = getLatestSubscriptionRecord(user.id);
      user.subscriptionStatus = latestSubscription?.status === 'cancelled' ? 'cancelled' : 'lapsed';
      await db.syncUser(user);
    }

    req.user = user;
    next();
  } catch (err) {
    logger.warn('Authentication error', { message: err.message, stack: err.stack });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

const requireActiveSubscription = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  if (req.user?.subscriptionStatus !== 'active') {
    return res.status(403).json({ error: 'Active subscription required', code: 'SUBSCRIPTION_REQUIRED' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireActiveSubscription, JWT_SECRET };
