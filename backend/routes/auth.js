const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { JWT_SECRET, authenticate } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');
const { withSubscriptionMeta } = require('../utils/userSubscriptionState');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, plan, charityId, charityContribution } = req.body;
    const normalizedName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedName || !normalizedEmail || !password) return res.status(400).json({ error: 'Name, email and password required' });
    if (plan && !['monthly', 'yearly'].includes(plan)) return res.status(400).json({ error: 'Plan must be monthly or yearly' });
    if (charityContribution !== undefined && (Number(charityContribution) < 10 || Number(charityContribution) > 100)) {
      return res.status(400).json({ error: 'Charity contribution must be 10-100%' });
    }
    if (db.users.find(u => String(u.email || '').toLowerCase() === normalizedEmail)) return res.status(409).json({ error: 'Email already registered' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (charityId && !db.charities.find((charity) => charity.id === charityId && charity.active)) {
      return res.status(400).json({ error: 'Please choose a valid charity' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      name: normalizedName,
      email: normalizedEmail,
      password: hashed,
      role: 'subscriber',
      subscriptionStatus: 'inactive',
      subscriptionPlan: plan || null,
      subscriptionRenewal: null,
      charityId: charityId || null,
      charityContribution: charityContribution !== undefined ? Number(charityContribution) : 10,
      totalWon: 0,
      avatarInitials: normalizedName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      createdAt: new Date()
    };
    db.users.push(user);
    await db.syncUser(user);

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;

    await sendEmail({
      to: user.email,
      subject: 'Welcome to GolfHeroes',
      text: 'Your account is ready. Complete your Razorpay subscription payment to unlock score entry, draw participation, and member features.',
    });

    res.status(201).json({ token, user: withSubscriptionMeta(safeUser) });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = db.users.find(u => String(u.email || '').toLowerCase() === normalizedEmail);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: withSubscriptionMeta(safeUser) });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Me
router.get('/me', authenticate, (req, res) => {
  const { password: _, ...safeUser } = req.user;
  res.json(withSubscriptionMeta(safeUser));
});

module.exports = router;
