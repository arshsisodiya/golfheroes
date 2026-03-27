const express = require('express');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();
const ALLOWED_ADMIN_STATUSES = new Set(['approved', 'rejected', 'paid']);

// My winnings
router.get('/my', authenticate, (req, res) => {
  // Primary source: explicit winner records
  const explicit = db.winners.filter(w => w.userId === req.user.id);

  // Supplemental: infer winners from published drawResults when explicit records are missing
  const inferred = [];
  for (const dr of db.drawResults.filter(d => d.published)) {
    const addIf = (list, matchTypeKey, matchLabel, poolKey) => {
      if (!Array.isArray(dr[list])) return;
      if (dr[list].includes(req.user.id)) {
        const count = dr[list].length || 1;
        const amount = dr[poolKey] && count ? Number((dr[poolKey] / count).toFixed(2)) : 0;
        inferred.push({
          id: `${dr.id}:${matchTypeKey}`,
          userId: req.user.id,
          matchType: matchLabel,
          amount,
          status: 'pending',
          proofUrl: null,
          createdAt: dr.publishedAt || dr.createdAt || new Date()
        });
      }
    };

    addIf('jackpotWinners', 'jackpot', '5-match', 'jackpotPool');
    addIf('fourMatchWinners', 'four', '4-match', 'fourMatchPool');
    addIf('threeMatchWinners', 'three', '3-match', 'threeMatchPool');
  }

  // Merge explicit records first, then inferred ones that aren't already covered by explicit ids
  const explicitIds = new Set(explicit.map(e => e.id));
  const combined = [...explicit, ...inferred.filter(i => !explicitIds.has(i.id))]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(combined);
});

// Upload proof
router.post('/:id/proof', authenticate, async (req, res) => {
  const winner = db.winners.find(w => w.id === req.params.id && w.userId === req.user.id);
  if (!winner) return res.status(404).json({ error: 'Winner record not found' });
  if (winner.status !== 'pending' && winner.status !== 'rejected') {
    return res.status(400).json({ error: 'Proof can only be submitted for pending or rejected winnings' });
  }
  const { proofUrl, proofDataUrl } = req.body;
  const normalizedProof = proofDataUrl || proofUrl;
  const isImageUpload = typeof normalizedProof === 'string' && normalizedProof.startsWith('data:image/');

  if (!isImageUpload) {
    return res.status(400).json({ error: 'Submit a screenshot image for verification' });
  }

  winner.proofUrl = normalizedProof;
  winner.status = 'under_review';
  await db.syncWinner(winner);
  res.json(winner);
});

// Admin — all winners
router.get('/', authenticate, requireAdmin, (req, res) => {
  const winners = db.winners.map(w => {
    const user = db.users.find(u => u.id === w.userId);
    return { ...w, userName: user?.name, userEmail: user?.email };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(winners);
});

// Admin — verify / update status
router.put('/:id/verify', authenticate, requireAdmin, async (req, res) => {
  const winner = db.winners.find(w => w.id === req.params.id);
  if (!winner) return res.status(404).json({ error: 'Winner not found' });
  const { status } = req.body; // approved, rejected, paid
  if (!ALLOWED_ADMIN_STATUSES.has(status)) {
    return res.status(400).json({ error: 'Invalid winner status' });
  }
  if ((winner.status === 'pending' || winner.status === 'under_review') && status === 'paid') {
    return res.status(400).json({ error: 'Approve a winner before marking as paid' });
  }
  if (winner.status === 'approved' && status === 'under_review') {
    return res.status(400).json({ error: 'Winner cannot move back to under review from approved' });
  }
  winner.status = status;
  winner.reviewedAt = new Date();
  await db.syncWinner(winner);

  const user = db.users.find(u => u.id === winner.userId);
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

  res.json(winner);
});

module.exports = router;
