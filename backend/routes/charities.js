const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Public — list all active charities
router.get('/', (req, res) => {
  const { search, category } = req.query;
  let charities = db.charities.filter(c => c.active);
  if (search) charities = charities.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));
  if (category) charities = charities.filter(c => c.category === category);
  res.json(charities);
});

// Public — featured charities
router.get('/featured', (req, res) => {
  res.json(db.charities.filter(c => c.active && c.featured));
});

// Public — single charity
router.get('/:id', (req, res) => {
  const c = db.charities.find(ch => ch.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Charity not found' });
  res.json(c);
});

// Admin — create
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name, description, category, image, featured, upcomingEvents } = req.body;
  if (!name || !description) return res.status(400).json({ error: 'Name and description required' });
  const charity = { id: uuidv4(), name, description, category: category || 'General', image: image || '', featured: !!featured, upcomingEvents: upcomingEvents || [], totalReceived: 0, active: true, createdAt: new Date() };
  db.charities.push(charity);
  await db.syncCharity(charity);
  res.status(201).json(charity);
});

// Admin — update
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const charity = db.charities.find(c => c.id === req.params.id);
  if (!charity) return res.status(404).json({ error: 'Charity not found' });
  Object.assign(charity, req.body);
  await db.syncCharity(charity);
  res.json(charity);
});

// Admin — delete
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const idx = db.charities.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Charity not found' });
  db.charities[idx].active = false;
  await db.syncCharity(db.charities[idx]);
  res.json({ message: 'Charity deactivated' });
});

module.exports = router;
