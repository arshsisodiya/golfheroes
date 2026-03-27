const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const from = process.env.MAIL_FROM || 'no-reply@golfheroes.local';
  const tx = getTransporter();

  if (!tx) {
    console.log(`[MAIL:disabled] to=${to} subject=${subject}`);
    return { queued: false, disabled: true };
  }

  try {
    await tx.sendMail({ from, to, subject, text, html: html || text });
    return { queued: true };
  } catch (error) {
    console.warn(`Email send failed to ${to}:`, error.message);
    return { queued: false, error: error.message };
  }
}

module.exports = { sendEmail };