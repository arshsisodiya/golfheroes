const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();

// Public independent donation
router.post('/', async (req, res) => {
  const { charityId, amount, donorName, donorEmail, note } = req.body;
  if (!charityId) return res.status(400).json({ error: 'Charity is required' });
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Amount must be greater than 0' });

  const charity = db.charities.find(c => c.id === charityId && c.active);
  if (!charity) return res.status(404).json({ error: 'Charity not found' });

  const donation = {
    id: uuidv4(),
    charityId,
    amount: Number(amount),
    donorName: donorName || 'Anonymous',
    donorEmail: donorEmail || null,
    note: note || '',
    createdAt: new Date(),
  };

  db.donations.push(donation);
  charity.totalReceived = Number(charity.totalReceived || 0) + donation.amount;

  await db.syncDonation(donation);
  await db.syncCharity(charity);

  if (donorEmail) {
    await sendEmail({
      to: donorEmail,
      subject: 'Donation Confirmation - GolfHeroes',
      text: `Thank you for donating INR ${donation.amount.toFixed(2)} to ${charity.name}.`,
    });
  }

  res.status(201).json({ message: 'Donation recorded', donation, charityTotal: charity.totalReceived });
});

// Admin donations listing
router.get('/', authenticate, requireAdmin, (req, res) => {
  const donations = db.donations
    .map(d => ({ ...d, charityName: db.charities.find(c => c.id === d.charityId)?.name || 'Unknown charity' }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(donations);
});

module.exports = router;
