const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
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
  const allScores = db.scores.map((score) => score.value);
  if (allScores.length < 5) return generateRandomNumbers();

  const frequency = {};
  allScores.forEach((value) => {
    frequency[value] = (frequency[value] || 0) + 1;
  });

  const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
  const chosen = new Set();

  [sorted[0], sorted[1]].forEach((entry) => {
    if (entry) chosen.add(Number(entry[0]));
  });

  const leastFrequent = [...sorted].reverse();
  for (const [value] of leastFrequent) {
    if (chosen.size >= 4) break;
    chosen.add(Number(value));
  }

  while (chosen.size < 5) {
    chosen.add(Math.floor(Math.random() * 45) + 1);
  }

  return [...chosen].sort((a, b) => a - b);
}

function calculateMatches(userScores, drawnNumbers) {
  const userSet = new Set(userScores.map((score) => score.value));
  return drawnNumbers.filter((number) => userSet.has(number)).length;
}

function getActiveSubscribers() {
  return db.users.filter((user) => user.subscriptionStatus === 'active' && user.role !== 'admin');
}

function getEligibleUserScores(userId) {
  return db.scores.filter((score) => score.userId === userId);
}

function calculatePools() {
  const activeUsers = getActiveSubscribers();
  const totalRevenue = activeUsers.reduce((sum, user) => sum + getMonthlyPlanValue(user.subscriptionPlan), 0);
  const totalPool = Math.round(totalRevenue * 0.60 * 100) / 100;
  const latestDraw = [...db.drawResults].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0];
  const rolledOver = latestDraw?.jackpotRolledOver ? Number(latestDraw.jackpotPool || 0) : 0;

  return {
    totalPool,
    jackpotPool: Math.round((totalPool * PRIZE_SPLIT.jackpot + rolledOver) * 100) / 100,
    fourMatchPool: Math.round(totalPool * PRIZE_SPLIT.fourMatch * 100) / 100,
    threeMatchPool: Math.round(totalPool * PRIZE_SPLIT.threeMatch * 100) / 100,
    activeSubscribers: activeUsers.length,
  };
}

function buildWinnerResponse() {
  return db.winners
    .map((winner) => {
      const user = db.users.find((candidate) => candidate.id === winner.userId);
      return { ...winner, userName: user?.name, userEmail: user?.email };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Dashboard stats
router.get('/stats', authenticate, requireAdmin, (req, res) => {
  const users = db.users.filter(u => u.role !== 'admin');
  const activeUsers = users.filter(u => u.subscriptionStatus === 'active');
  const totalCharityContributed = db.donations
    .filter((donation) => String(donation.note || '').toLowerCase().includes('subscription'))
    .reduce((sum, donation) => sum + Number(donation.amount || 0), 0);
  const monthlyRevenue = activeUsers.reduce((sum, user) => sum + getMonthlyPlanValue(user.subscriptionPlan), 0);
  const totalPrizePool = monthlyRevenue * 0.60;
  const pendingWinners = db.winners.filter(w => w.status === 'pending' || w.status === 'under_review').length;
  const independentDonations = db.donations
    .filter((donation) => !String(donation.note || '').toLowerCase().includes('subscription'))
    .reduce((sum, donation) => sum + Number(donation.amount || 0), 0);
  const publishedDraws = db.drawResults.filter((draw) => draw.published);
  const eligibleEntries = db.drawEntries.filter((entry) => entry.entered);
  const totalWinners = db.winners.length;
  const totalPayoutsMarkedPaid = db.winners
    .filter((winner) => winner.status === 'paid')
    .reduce((sum, winner) => sum + Number(winner.amount || 0), 0);
  const averageEligibleEntries = publishedDraws.length ? eligibleEntries.length / publishedDraws.length : 0;
  const jackpotRollovers = publishedDraws.filter((draw) => draw.jackpotRolledOver).length;
  const algorithmicDraws = publishedDraws.filter((draw) => draw.drawType === 'algorithmic').length;
  const randomDraws = publishedDraws.filter((draw) => draw.drawType !== 'algorithmic').length;
  
  res.json({
    totalUsers: users.length,
    activeSubscribers: activeUsers.length,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    totalCharityContributed: Math.round(totalCharityContributed * 100) / 100,
    independentDonations: Math.round(independentDonations * 100) / 100,
    totalPrizePool: Math.round(totalPrizePool * 100) / 100,
    pendingWinners,
    totalDraws: db.drawResults.length,
    totalCharities: db.charities.filter(c => c.active).length,
    drawStats: {
      totalEntries: eligibleEntries.length,
      averageEligibleEntries: Number(averageEligibleEntries.toFixed(1)),
      jackpotRollovers,
      algorithmicDraws,
      randomDraws,
      totalWinners,
      totalPayoutsMarkedPaid: Math.round(totalPayoutsMarkedPaid * 100) / 100,
    },
  });
});

// Admin draws
router.get('/draws', authenticate, requireAdmin, (req, res) => {
  const draws = [...db.drawResults].sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
  res.json(draws);
});

router.post('/draws/simulate', authenticate, requireAdmin, (req, res) => {
  const { drawType } = req.body;
  const drawnNumbers = drawType === 'algorithmic' ? generateAlgorithmicNumbers() : generateRandomNumbers();
  const pools = calculatePools();

  const results = getActiveSubscribers()
    .map((user) => {
      const scores = getEligibleUserScores(user.id);
      if (scores.length !== 5) return null;

      const matches = calculateMatches(scores, drawnNumbers);
      if (matches < 3) return null;

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        matches,
        scores: scores.map((score) => score.value),
      };
    })
    .filter(Boolean);

  res.json({
    drawnNumbers,
    drawType,
    pools,
    jackpotWinners: results.filter((winner) => winner.matches === 5),
    fourMatchWinners: results.filter((winner) => winner.matches === 4),
    threeMatchWinners: results.filter((winner) => winner.matches === 3),
    simulation: true,
  });
});

router.post('/draws/publish', authenticate, requireAdmin, async (req, res) => {
  const { drawType, month } = req.body;
  const targetMonth = month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const existingDraw = db.drawResults.find((draw) => draw.published && draw.month === targetMonth);

  if (existingDraw) {
    return res.status(409).json({ error: `Draw for ${targetMonth} already published` });
  }

  const drawnNumbers = drawType === 'algorithmic' ? generateAlgorithmicNumbers() : generateRandomNumbers();
  const pools = calculatePools();
  const activeUsers = getActiveSubscribers();

  const results = activeUsers
    .map((user) => {
      const scores = getEligibleUserScores(user.id);
      if (scores.length !== 5) return null;

      const matches = calculateMatches(scores, drawnNumbers);
      return matches >= 3 ? { userId: user.id, name: user.name, matches } : null;
    })
    .filter(Boolean);

  const jackpotWinners = results.filter((winner) => winner.matches === 5).map((winner) => winner.userId);
  const fourMatchWinners = results.filter((winner) => winner.matches === 4).map((winner) => winner.userId);
  const threeMatchWinners = results.filter((winner) => winner.matches === 3).map((winner) => winner.userId);

  if (fourMatchWinners.length > 0) {
    const share = pools.fourMatchPool / fourMatchWinners.length;
    fourMatchWinners.forEach((userId) => {
      const user = db.users.find((candidate) => candidate.id === userId);
      if (user) user.totalWon = (user.totalWon || 0) + share;
    });
  }

  if (threeMatchWinners.length > 0) {
    const share = pools.threeMatchPool / threeMatchWinners.length;
    threeMatchWinners.forEach((userId) => {
      const user = db.users.find((candidate) => candidate.id === userId);
      if (user) user.totalWon = (user.totalWon || 0) + share;
    });
  }

  if (jackpotWinners.length > 0) {
    const share = pools.jackpotPool / jackpotWinners.length;
    jackpotWinners.forEach((userId) => {
      const user = db.users.find((candidate) => candidate.id === userId);
      if (user) user.totalWon = (user.totalWon || 0) + share;
    });
  }

  const createdWinners = [
    ...jackpotWinners.map((userId) => ({ id: uuidv4(), userId, matchType: '5-match', amount: jackpotWinners.length > 0 ? pools.jackpotPool / jackpotWinners.length : 0, status: 'pending', proofUrl: null, createdAt: new Date() })),
    ...fourMatchWinners.map((userId) => ({ id: uuidv4(), userId, matchType: '4-match', amount: fourMatchWinners.length > 0 ? pools.fourMatchPool / fourMatchWinners.length : 0, status: 'pending', proofUrl: null, createdAt: new Date() })),
    ...threeMatchWinners.map((userId) => ({ id: uuidv4(), userId, matchType: '3-match', amount: threeMatchWinners.length > 0 ? pools.threeMatchPool / threeMatchWinners.length : 0, status: 'pending', proofUrl: null, createdAt: new Date() })),
  ];
  createdWinners.forEach((winner) => db.winners.push(winner));

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
      matches: entered ? calculateMatches(scores, drawnNumbers) : 0,
      scoreSnapshot: scores.map((score) => score.value),
      drawnNumbers,
      createdAt: new Date(),
    };
  });
  drawEntries.forEach((entry) => db.drawEntries.push(entry));

  const drawResult = {
    id: drawResultId,
    month: targetMonth,
    drawnNumbers,
    drawType,
    ...pools,
    jackpotWinners,
    fourMatchWinners,
    threeMatchWinners,
    jackpotRolledOver: jackpotWinners.length === 0,
    published: true,
    publishedAt: new Date(),
    createdAt: new Date(),
  };
  db.drawResults.push(drawResult);

  await db.syncUsers(activeUsers);
  await db.syncDrawEntries(drawEntries);
  await db.syncWinners(createdWinners);
  await db.syncDrawResult(drawResult);

  await Promise.all(
    activeUsers
      .filter((user) => !!user.email)
      .map((user) => sendEmail({
        to: user.email,
        subject: `Draw Results Published - ${targetMonth}`,
        text: `The ${targetMonth} draw has been published. Winning numbers: ${drawnNumbers.join(', ')}. Check your dashboard for results.`,
      }))
  );

  await Promise.all(
    createdWinners.map((winner) => {
      const winnerUser = db.users.find((user) => user.id === winner.userId);
      if (!winnerUser?.email) return Promise.resolve();

      return sendEmail({
        to: winnerUser.email,
        subject: 'Winner Alert - GolfHeroes',
        text: `Congratulations! You won INR ${Number(winner.amount || 0).toFixed(2)} in the ${targetMonth} draw (${winner.matchType}). Please submit proof in your dashboard.`,
      });
    })
  );

  res.status(201).json(drawResult);
});

// All users
router.get('/users', authenticate, requireAdmin, (req, res) => {
  const users = db.users.map(u => {
    const { password: _, ...safe } = u;
    const scoreCount = db.scores.filter(s => s.userId === u.id).length;
    return { ...safe, scoreCount };
  });
  res.json(users);
});

// Edit user
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { name, subscriptionStatus, subscriptionPlan, charityId, charityContribution } = req.body;
  if (name) user.name = name;
  if (subscriptionStatus) user.subscriptionStatus = subscriptionStatus;
  if (subscriptionPlan) user.subscriptionPlan = subscriptionPlan;
  if (charityId) user.charityId = charityId;
  if (charityContribution !== undefined) user.charityContribution = charityContribution;
  await db.syncUser(user);
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// Admin winners
router.get('/winners', authenticate, requireAdmin, (req, res) => {
  res.json(buildWinnerResponse());
});

router.put('/winners/:id/verify', authenticate, requireAdmin, async (req, res) => {
  const winner = db.winners.find((candidate) => candidate.id === req.params.id);
  if (!winner) return res.status(404).json({ error: 'Winner not found' });

  const { status } = req.body;
  winner.status = status;
  winner.reviewedAt = new Date();
  await db.syncWinner(winner);

  const user = db.users.find((candidate) => candidate.id === winner.userId);
  if (user?.email) {
    const statusText = {
      approved: 'Your winning submission has been approved. Payout is being processed.',
      rejected: 'Your winning submission was rejected. Please contact support if needed.',
      paid: `Your payout of INR ${Number(winner.amount || 0).toFixed(2)} has been marked as paid.`,
    };

    await sendEmail({
      to: user.email,
      subject: `Winner Status Update - ${status}`,
      text: statusText[status] || `Your winner status is now: ${status}.`,
    });
  }

  res.json({ ...winner, userName: user?.name, userEmail: user?.email });
});

// Admin charities
router.get('/charities', authenticate, requireAdmin, (req, res) => {
  const charities = [...db.charities].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(charities);
});

router.post('/charities', authenticate, requireAdmin, async (req, res) => {
  const { name, description, category, image, featured, upcomingEvents } = req.body;
  if (!name || !description) return res.status(400).json({ error: 'Name and description required' });

  const charity = {
    id: uuidv4(),
    name,
    description,
    category: category || 'General',
    image: image || '',
    featured: !!featured,
    upcomingEvents: upcomingEvents || [],
    totalReceived: 0,
    active: true,
    createdAt: new Date(),
  };

  db.charities.push(charity);
  await db.syncCharity(charity);
  res.status(201).json(charity);
});

router.put('/charities/:id', authenticate, requireAdmin, async (req, res) => {
  const charity = db.charities.find((candidate) => candidate.id === req.params.id);
  if (!charity) return res.status(404).json({ error: 'Charity not found' });

  Object.assign(charity, req.body);
  await db.syncCharity(charity);
  res.json(charity);
});

router.delete('/charities/:id', authenticate, requireAdmin, async (req, res) => {
  const charity = db.charities.find((candidate) => candidate.id === req.params.id);
  if (!charity) return res.status(404).json({ error: 'Charity not found' });

  charity.active = false;
  await db.syncCharity(charity);
  res.json({ message: 'Charity deactivated' });
});

// Admin edit user scores
router.get('/users/:id/scores', authenticate, requireAdmin, (req, res) => {
  const scores = db.scores.filter(s => s.userId === req.params.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(scores);
});

router.put('/users/:id/scores/:scoreId', authenticate, requireAdmin, async (req, res) => {
  const score = db.scores.find(s => s.id === req.params.scoreId && s.userId === req.params.id);
  if (!score) return res.status(404).json({ error: 'Score not found' });
  const { value, date } = req.body;
  if (value !== undefined && (Number(value) < 1 || Number(value) > 45)) {
    return res.status(400).json({ error: 'Score must be 1-45' });
  }
  if (value !== undefined) score.value = Number(value);
  if (date) score.date = new Date(date);
  await db.syncScore(score);
  res.json(score);
});

router.delete('/users/:id/scores/:scoreId', authenticate, requireAdmin, async (req, res) => {
  const idx = db.scores.findIndex(s => s.id === req.params.scoreId && s.userId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Score not found' });
  const removed = db.scores[idx];
  db.scores.splice(idx, 1);
  await db.deleteScore(removed.id);
  res.json({ message: 'Score deleted' });
});

module.exports = router;
