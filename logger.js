const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'app.log');

// Log levels
const LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG'
};

function formatTimestamp() {
    return new Date().toISOString();
}

function log(level, message, data = null) {
    const timestamp = formatTimestamp();
    const logEntry = {
        timestamp,
        level,
        message,
        ...(data && { data })
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    // Write to file
    fs.appendFile(LOG_FILE, logLine, (err) => {
        if (err) console.error('Failed to write to log file:', err);
    });

    // Also log to console
    const consoleMsg = `[${timestamp}] ${level}: ${message}`;
    if (level === LEVELS.ERROR) {
        console.error(consoleMsg, data || '');
    } else if (level === LEVELS.WARN) {
        console.warn(consoleMsg, data || '');
    } else {
        console.log(consoleMsg, data || '');
    }
}

module.exports = {
    info: (message, data) => log(LEVELS.INFO, message, data),
    warn: (message, data) => log(LEVELS.WARN, message, data),
    error: (message, data) => log(LEVELS.ERROR, message, data),
    debug: (message, data) => log(LEVELS.DEBUG, message, data)
};
