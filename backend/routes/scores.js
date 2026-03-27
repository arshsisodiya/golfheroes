const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireActiveSubscription } = require('../middleware/auth');

const router = express.Router();

function parseScoreInput(value, date) {
  const scoreValue = Number(value);
  const playedAt = new Date(date);

  if (!Number.isInteger(scoreValue) || scoreValue < 1 || scoreValue > 45) {
    return { error: 'Score must be a whole number between 1 and 45 (Stableford)' };
  }

  if (!date || Number.isNaN(playedAt.getTime())) {
    return { error: 'A valid played date is required' };
  }

  if (playedAt.getTime() > Date.now()) {
    return { error: 'Score date cannot be in the future' };
  }

  return { scoreValue, playedAt };
}

// Get my scores
router.get('/', authenticate, requireActiveSubscription, (req, res) => {
  const scores = db.scores
    .filter(s => s.userId === req.user.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(scores);
});

// Add score — rolling 5-score logic
router.post('/', authenticate, requireActiveSubscription, async (req, res) => {
  const { value, date } = req.body;
  const parsed = parseScoreInput(value, date);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  // Get current scores sorted oldest first
  const userScores = db.scores
    .filter(s => s.userId === req.user.id)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Remove oldest if already 5
  if (userScores.length >= 5) {
    const oldest = userScores[0];
    const idx = db.scores.findIndex(s => s.id === oldest.id);
    if (idx !== -1) {
      db.scores.splice(idx, 1);
      await db.deleteScore(oldest.id);
    }
  }

  const newScore = { id: uuidv4(), userId: req.user.id, value: parsed.scoreValue, date: parsed.playedAt, createdAt: new Date() };
  db.scores.push(newScore);
  await db.syncScore(newScore);

  const allScores = db.scores
    .filter(s => s.userId === req.user.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.status(201).json({ score: newScore, allScores });
});

// Update a score
router.put('/:id', authenticate, requireActiveSubscription, async (req, res) => {
  const score = db.scores.find(s => s.id === req.params.id && s.userId === req.user.id);
  if (!score) return res.status(404).json({ error: 'Score not found' });
  const { value, date } = req.body;
  const parsed = parseScoreInput(value ?? score.value, date ?? score.date);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  score.value = parsed.scoreValue;
  score.date = parsed.playedAt;
  await db.syncScore(score);
  res.json(score);
});

// Delete a score
router.delete('/:id', authenticate, requireActiveSubscription, async (req, res) => {
  const idx = db.scores.findIndex(s => s.id === req.params.id && s.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Score not found' });
  const removed = db.scores[idx];
  db.scores.splice(idx, 1);
  await db.deleteScore(removed.id);
  res.json({ message: 'Score deleted' });
});

module.exports = router;
