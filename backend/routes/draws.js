const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireAdmin, requireActiveSubscription } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');
const { getMonthlyPlanValue } = require('../utils/billing');

const router = express.Router();

const PRIZE_SPLIT = { jackpot: 0.40, fourMatch: 0.35, threeMatch: 0.25 };

function generateRandomNumbers() {
  const nums = new Set();
  while (nums.size < 5) nums.add(Math.floor(Math.random() * 45) + 1);
  return [...nums].sort((a, b) => a - b);
}

function generateAlgorithmicNumbers() {
  // Weight by frequency across all user scores
  const allScores = db.scores.map(s => s.value);
  if (allScores.length < 5) return generateRandomNumbers();
  const freq = {};
  allScores.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  // Mix: 2 most frequent, 2 least frequent, 1 random
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const chosen = new Set();
  [sorted[0], sorted[1]].forEach(([v]) => chosen.add(Number(v)));
  const leastFreq = [...sorted].reverse();
  for (const [v] of leastFreq) { if (chosen.size >= 4) break; chosen.add(Number(v)); }
  while (chosen.size < 5) chosen.add(Math.floor(Math.random() * 45) + 1);
  return [...chosen].sort((a, b) => a - b);
}

function calculateMatches(userScores, drawnNumbers) {
  const userSet = new Set(userScores.map(s => s.value));
  return drawnNumbers.filter(n => userSet.has(n)).length;
}

function getEligibleUserScores(userId) {
  return db.scores.filter((score) => score.userId === userId);
}

function isEligibleForDraw(userId) {
  return getEligibleUserScores(userId).length === 5;
}

function calculatePools() {
  const activeUsers = db.users.filter(u => u.subscriptionStatus === 'active' && u.role !== 'admin');
  const totalRevenue = activeUsers.reduce((sum, u) => sum + getMonthlyPlanValue(u.subscriptionPlan), 0);
  const prizePoolShare = 0.60; // 60% to prize pool, 10%+ to charity, rest operational
  const totalPool = Math.round(totalRevenue * prizePoolShare * 100) / 100;
  const latestDraw = [...db.drawResults].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0];
  const rolledOver = latestDraw?.jackpotRolledOver ? Number(latestDraw.jackpotPool || 0) : 0;
  return {
    totalPool,
    jackpotPool: Math.round((totalPool * PRIZE_SPLIT.jackpot + rolledOver) * 100) / 100,
    fourMatchPool: Math.round(totalPool * PRIZE_SPLIT.fourMatch * 100) / 100,
    threeMatchPool: Math.round(totalPool * PRIZE_SPLIT.threeMatch * 100) / 100,
    activeSubscribers: activeUsers.length
  };
}

// Get all published draws (public)
router.get('/', (req, res) => {
  const published = db.drawResults.filter(d => d.published).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  res.json(published);
});

// Get upcoming draw info
router.get('/upcoming', authenticate, requireActiveSubscription, (req, res) => {
  const pools = calculatePools();
  const userScores = db.scores.filter(s => s.userId === req.user.id).map(s => s.value);
  const userEntries = db.drawEntries
    .filter((entry) => entry.userId === req.user.id && entry.entered)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const nextDrawMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  res.json({
    pools,
    userScores,
    eligible: userScores.length === 5,
    scoresNeeded: Math.max(0, 5 - userScores.length),
    drawsEntered: userEntries.length,
    nextDrawMonth,
    latestEntry: userEntries[0] || null,
  });
});

// Admin — simulate draw
router.post('/simulate', authenticate, requireAdmin, (req, res) => {
  const { drawType } = req.body;
  const drawn = drawType === 'algorithmic' ? generateAlgorithmicNumbers() : generateRandomNumbers();
  const pools = calculatePools();
  
  // Find potential winners
  const activeUsers = db.users.filter(u => u.subscriptionStatus === 'active' && u.role !== 'admin');
  const results = activeUsers.map(user => {
    const scores = getEligibleUserScores(user.id);
    if (scores.length !== 5) return null;
    const matches = calculateMatches(scores, drawn);
    return matches >= 3 ? { userId: user.id, name: user.name, email: user.email, matches, scores: scores.map(s => s.value) } : null;
  }).filter(Boolean);

  const jackpotWinners = results.filter(r => r.matches === 5);
  const fourMatchWinners = results.filter(r => r.matches === 4);
  const threeMatchWinners = results.filter(r => r.matches === 3);

  res.json({ drawnNumbers: drawn, drawType, pools, jackpotWinners, fourMatchWinners, threeMatchWinners, simulation: true });
});

// Admin — publish draw
router.post('/publish', authenticate, requireAdmin, async (req, res) => {
  const { drawType, month } = req.body;
  const targetMonth = month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const existing = db.drawResults.find(d => d.published && d.month === targetMonth);
  if (existing) return res.status(409).json({ error: `Draw for ${targetMonth} already published` });

  const drawn = drawType === 'algorithmic' ? generateAlgorithmicNumbers() : generateRandomNumbers();
  const pools = calculatePools();
  
  const activeUsers = db.users.filter(u => u.subscriptionStatus === 'active' && u.role !== 'admin');
  const results = activeUsers.map(user => {
    const scores = getEligibleUserScores(user.id);
    if (scores.length !== 5) return null;
    const matches = calculateMatches(scores, drawn);
    return matches >= 3 ? { userId: user.id, name: user.name, matches } : null;
  }).filter(Boolean);

  const jackpotWinners = results.filter(r => r.matches === 5).map(r => r.userId);
  const fourMatchWinners = results.filter(r => r.matches === 4).map(r => r.userId);
  const threeMatchWinners = results.filter(r => r.matches === 3).map(r => r.userId);

  // Award winnings
  if (fourMatchWinners.length > 0) {
    const share = pools.fourMatchPool / fourMatchWinners.length;
    fourMatchWinners.forEach(uid => { const u = db.users.find(x => x.id === uid); if (u) u.totalWon = (u.totalWon || 0) + share; });
  }
  if (threeMatchWinners.length > 0) {
    const share = pools.threeMatchPool / threeMatchWinners.length;
    threeMatchWinners.forEach(uid => { const u = db.users.find(x => x.id === uid); if (u) u.totalWon = (u.totalWon || 0) + share; });
  }
  if (jackpotWinners.length > 0) {
    const share = pools.jackpotPool / jackpotWinners.length;
    jackpotWinners.forEach(uid => { const u = db.users.find(x => x.id === uid); if (u) u.totalWon = (u.totalWon || 0) + share; });
  }

  // Add winners to db
  const createdWinners = [
    ...jackpotWinners.map(uid => ({ id: uuidv4(), userId: uid, matchType: '5-match', amount: jackpotWinners.length > 0 ? pools.jackpotPool / jackpotWinners.length : 0, status: 'pending', proofUrl: null, createdAt: new Date() })),
    ...fourMatchWinners.map(uid => ({ id: uuidv4(), userId: uid, matchType: '4-match', amount: fourMatchWinners.length > 0 ? pools.fourMatchPool / fourMatchWinners.length : 0, status: 'pending', proofUrl: null, createdAt: new Date() })),
    ...threeMatchWinners.map(uid => ({ id: uuidv4(), userId: uid, matchType: '3-match', amount: threeMatchWinners.length > 0 ? pools.threeMatchPool / threeMatchWinners.length : 0, status: 'pending', proofUrl: null, createdAt: new Date() }))
  ];
  createdWinners.forEach(w => db.winners.push(w));

  const drawResultId = uuidv4();
  const drawEntries = activeUsers.map((user) => {
    const scores = getEligibleUserScores(user.id);
    const entered = scores.length === 5;
    return {
      id: uuidv4(),
      drawResultId,
      userId: user.id,
      month: targetMonth,
      entered,
      matches: entered ? calculateMatches(scores, drawn) : 0,
      scoreSnapshot: scores.map((score) => score.value),
      drawnNumbers: drawn,
      createdAt: new Date(),
    };
  });
  drawEntries.forEach((entry) => db.drawEntries.push(entry));

  const drawResult = {
    id: drawResultId,
    month: targetMonth,
    drawnNumbers: drawn,
    drawType,
    ...pools,
    jackpotWinners,
    fourMatchWinners,
    threeMatchWinners,
    jackpotRolledOver: jackpotWinners.length === 0,
    published: true,
    publishedAt: new Date(),
    createdAt: new Date()
  };
  db.drawResults.push(drawResult);

  await db.syncUsers(activeUsers);
  await db.syncDrawEntries(drawEntries);
  await db.syncWinners(createdWinners);
  await db.syncDrawResult(drawResult);

  // Email updates: monthly draw result update + winner alert.
  await Promise.all(activeUsers.filter(u => !!u.email).map((u) => sendEmail({
    to: u.email,
    subject: `Draw Results Published - ${targetMonth}`,
    text: `The ${targetMonth} draw has been published. Winning numbers: ${drawn.join(', ')}. Check your dashboard for results.`,
  })));

  await Promise.all(createdWinners.map((w) => {
    const winnerUser = db.users.find(u => u.id === w.userId);
    if (!winnerUser?.email) return Promise.resolve();
    return sendEmail({
      to: winnerUser.email,
      subject: 'Winner Alert - GolfHeroes',
      text: `Congratulations! You won INR ${Number(w.amount || 0).toFixed(2)} in the ${targetMonth} draw (${w.matchType}). Please submit proof in your dashboard.`,
    });
  }));

  res.status(201).json(drawResult);
});

module.exports = router;
