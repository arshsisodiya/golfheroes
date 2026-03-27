const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'server.log');

function ensureLogDir() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

function format(level, message, meta) {
  const timestamp = new Date().toISOString();
  let line = `${timestamp} [${level.toUpperCase()}] ${message}`;
  if (meta !== undefined) {
    try {
      const metaStr = typeof meta === 'string' ? meta : JSON.stringify(meta);
      line += ` | ${metaStr}`;
    } catch (e) {
      line += ` | (unserializable meta)`;
    }
  }
  return line + '\n';
}

function write(level, message, meta) {
  ensureLogDir();
  const line = format(level, message, meta);
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (e) {
    // if file write fails, still print to console
    // eslint-disable-next-line no-console
    console.error('Failed to write log file:', e);
  }
  // eslint-disable-next-line no-console
  if (level === 'error') console.error(line.trim());
  else if (level === 'warn') console.warn(line.trim());
  else console.log(line.trim());
}

module.exports = {
  info: (msg, meta) => write('info', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  error: (msg, meta) => write('error', msg, meta),
};
