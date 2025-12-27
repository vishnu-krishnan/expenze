const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to (or create) the SQLite database
const dbPath = path.resolve(__dirname, 'expenze.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Initialize Schema
db.serialize(() => {
    // Categories
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sortOrder INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1
    )`);

    // Payment Templates
    db.run(`CREATE TABLE IF NOT EXISTS payment_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        categoryId INTEGER,
        defaultPlannedAmount REAL DEFAULT 0,
        notes TEXT,
        startMonth TEXT, -- YYYY-MM
        endMonth TEXT,   -- YYYY-MM or NULL
        frequency TEXT DEFAULT 'MONTHLY',
        isActive INTEGER DEFAULT 1,
        FOREIGN KEY(categoryId) REFERENCES categories(id)
    )`);

    // Month Plans
    db.run(`CREATE TABLE IF NOT EXISTS month_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        monthKey TEXT UNIQUE NOT NULL, -- YYYY-MM
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Salaries
    db.run(`CREATE TABLE IF NOT EXISTS salaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        monthKey TEXT UNIQUE NOT NULL, -- YYYY-MM
        amount REAL NOT NULL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Payment Items
    db.run(`CREATE TABLE IF NOT EXISTS payment_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        monthPlanId INTEGER NOT NULL,
        categoryId INTEGER NOT NULL,
        name TEXT NOT NULL,
        plannedAmount REAL DEFAULT 0,
        actualAmount REAL DEFAULT 0,
        isPaid INTEGER DEFAULT 0, -- 0 or 1
        notes TEXT,
        FOREIGN KEY(monthPlanId) REFERENCES month_plans(id),
        FOREIGN KEY(categoryId) REFERENCES categories(id)
    )`);
});

// Helper to run queries as Promises
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = { db, run, get, all };
