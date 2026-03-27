const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  const { name } = req.body;
  if (name) { user.name = name; user.avatarInitials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }
  await db.syncUser(user);
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

module.exports = router;
