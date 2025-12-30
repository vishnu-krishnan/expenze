const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../expenze.log'); // Log to root log file

function log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, ...meta };
    const logString = JSON.stringify(logEntry) + '\n';

    // Console output
    console.log(`${timestamp} [${level}] ${message}`, Object.keys(meta).length ? meta : '');

    // File output (append)
    fs.appendFile(LOG_FILE, logString, (err) => {
        if (err) console.error('Failed to write to log file:', err);
    });
}

module.exports = {
    info: (msg, meta) => log('INFO', msg, meta),
    error: (msg, meta) => log('ERROR', msg, meta),
    warn: (msg, meta) => log('WARN', msg, meta),
    debug: (msg, meta) => log('DEBUG', msg, meta)
};
