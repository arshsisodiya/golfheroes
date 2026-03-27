const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const scoreRoutes = require('./routes/scores');
const drawRoutes = require('./routes/draws');
const charityRoutes = require('./routes/charities');
const subscriptionRoutes = require('./routes/subscriptions');
const adminRoutes = require('./routes/admin');
const winnerRoutes = require('./routes/winners');
const donationRoutes = require('./routes/donations');
const db = require('./db');
const logger = require('./utils/logger');

const app = express();
const publicDir = path.join(__dirname, '..', 'public');
let dbInitPromise;

function ensureDbInitialized() {
	if (!dbInitPromise) {
		dbInitPromise = db.init().catch((error) => {
			logger.warn('Database initialization failed.', { message: error.message, stack: error.stack });
			dbInitPromise = null;
			throw error;
		});
	}

	return dbInitPromise;
}

app.use(async (req, res, next) => {
	try {
		await ensureDbInitialized();
		next();
	} catch (error) {
		next(error);
	}
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));

app.post(
  '/api/subscriptions/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionRoutes.handleWebhook
);

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/charities', charityRoutes);
app.use('/api/subscriptions', subscriptionRoutes.router);
app.use('/api/admin', adminRoutes);
app.use('/api/winners', winnerRoutes);
app.use('/api/donations', donationRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const START_PORT = parseInt(process.env.PORT, 10) || 3001;
const MAX_PORT = START_PORT + 50;

function tryListen(port) {
	const server = app.listen(port, () => {
		logger.info(`Server running on port ${port}`);
		ensureDbInitialized().catch(() => {});
	});

	server.on('error', (err) => {
		if (err && err.code === 'EADDRINUSE') {
			logger.warn(`Port ${port} in use, trying ${port + 1}`);
			if (port + 1 <= MAX_PORT) {
				tryListen(port + 1);
			} else {
				logger.error(`No available ports in range ${START_PORT}-${MAX_PORT}. Exiting.`);
				process.exit(1);
			}
		} else {
			logger.error('Server error:', err);
			process.exit(1);
		}
	});

}

app.get(/^\/(?!api(?:\/|$)).*/, (req, res, next) => {
	res.sendFile(path.join(publicDir, 'index.html'), (error) => {
		if (error) {
			next(error);
		}
	});
});

// Start listening only when this file is the main module
if (require.main === module) {
    tryListen(START_PORT);
}

// Express error-handling middleware (log and respond)
app.use((err, req, res, next) => {
    try {
        const meta = {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            body: req.body,
            params: req.params,
            query: req.query,
        };
        logger.error(err.message || 'Unhandled error', { ...meta, stack: err.stack });
    } catch (logErr) {
        logger.error('Failed to log error', { message: logErr.message });
    }

    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

process.on('unhandledRejection', (reason) => {
	logger.error('Unhandled Rejection', { reason });
});

process.on('uncaughtException', (err) => {
	logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
	// allow default behavior after logging
	process.exit(1);
});

module.exports = app;
