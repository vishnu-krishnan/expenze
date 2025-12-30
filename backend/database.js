const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

// Connect to Postgres
// Railway provides DATABASE_URL, local dev uses individual PG* variables
const pool = new Pool(
    process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
            user: process.env.PGUSER,
            host: process.env.PGHOST,
            database: process.env.PGDATABASE,
            password: process.env.PGPASSWORD,
            port: process.env.PGPORT,
        }
);

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

console.log('Connected to PostgreSQL database.');

// Helper to convert SQLite '?' to Postgres '$n'
function adaptSql(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => '$' + ++i);
}

// Initialize Schema
async function initSchema() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // User Verifications (Temp Table)
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_verifications (
                email TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                phone TEXT,
                otp_code TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Users
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT UNIQUE,
                phone TEXT,
                role TEXT DEFAULT 'user',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migration: Add new columns if they don't exist (Idempotent)
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified INTEGER DEFAULT 0;
        `);

        // Categories
        await client.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                userId INTEGER REFERENCES users(id),
                name TEXT NOT NULL,
                sortOrder INTEGER DEFAULT 0,
                isActive INTEGER DEFAULT 1
            )
        `);

        // Payment Templates
        await client.query(`
            CREATE TABLE IF NOT EXISTS payment_templates (
                id SERIAL PRIMARY KEY,
                userId INTEGER REFERENCES users(id),
                name TEXT NOT NULL,
                categoryId INTEGER REFERENCES categories(id),
                defaultPlannedAmount NUMERIC DEFAULT 0,
                notes TEXT,
                startMonth TEXT, -- YYYY-MM
                endMonth TEXT,   -- YYYY-MM or NULL
                frequency TEXT DEFAULT 'MONTHLY',
                isActive INTEGER DEFAULT 1
            )
        `);

        // Month Plans
        await client.query(`
            CREATE TABLE IF NOT EXISTS month_plans (
                id SERIAL PRIMARY KEY,
                userId INTEGER REFERENCES users(id),
                monthKey TEXT NOT NULL, -- YYYY-MM
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(userId, monthKey)
            )
        `);

        // Salaries
        await client.query(`
            CREATE TABLE IF NOT EXISTS salaries (
                id SERIAL PRIMARY KEY,
                userId INTEGER REFERENCES users(id),
                monthKey TEXT NOT NULL, -- YYYY-MM
                amount NUMERIC NOT NULL DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(userId, monthKey)
            )
        `);

        // Payment Items
        await client.query(`
            CREATE TABLE IF NOT EXISTS payment_items (
                id SERIAL PRIMARY KEY,
                userId INTEGER REFERENCES users(id),
                monthPlanId INTEGER REFERENCES month_plans(id),
                categoryId INTEGER REFERENCES categories(id),
                name TEXT NOT NULL,
                plannedAmount NUMERIC DEFAULT 0,
                actualAmount NUMERIC DEFAULT 0,
                isPaid INTEGER DEFAULT 0, -- 0 or 1
                notes TEXT
            )
        `);

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error initializing schema:', e);
        throw e;
    } finally {
        client.release();
    }
}

const initPromise = initSchema().catch(err => console.error(err));

// Wrapper functions to mimic sqlite3 API

async function run(sql, params = []) {
    await initPromise; // Wait for schema
    const adapted = adaptSql(sql);
    // ...
    let finalSql = adapted;

    // Auto-append RETURNING id for INSERTs to mimic sqlite3 lastID
    // Simple heuristic: starts with INSERT and doesn't have RETURNING
    if (/^\s*INSERT\s/i.test(finalSql) && !/RETURNING/i.test(finalSql)) {
        finalSql += ' RETURNING id';
    }

    try {
        const res = await pool.query(finalSql, params);
        return {
            lastID: res.rows.length > 0 && res.rows[0].id ? res.rows[0].id : null,
            changes: res.rowCount
        };
    } catch (err) {
        throw err;
    }
}

async function get(sql, params = []) {
    await initPromise;
    const adapted = adaptSql(sql);
    try {
        const res = await pool.query(adapted, params);
        return res.rows[0];
    } catch (err) {
        throw err;
    }
}

async function all(sql, params = []) {
    await initPromise;
    const adapted = adaptSql(sql);
    try {
        const res = await pool.query(adapted, params);
        return res.rows;
    } catch (err) {
        throw err;
    }
}

// Export pool as db, though standard sqlite3 db object properties like .serialize won't exist.
module.exports = { db: pool, run, get, all, pool };
