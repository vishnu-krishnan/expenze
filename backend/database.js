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
                delivery_status TEXT DEFAULT 'pending', -- pending, sent, failed
                delivery_error TEXT,
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
            ALTER TABLE users ADD COLUMN IF NOT EXISTS default_budget NUMERIC DEFAULT 0;

            ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';
            ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS delivery_error TEXT;

            ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;
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

        // Regular Payments
        await client.query(`
            CREATE TABLE IF NOT EXISTS regular_payments (
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

        // Migration: Rename older table names to regular_payments
        await client.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_templates') AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'regular_payments') THEN
                    ALTER TABLE payment_templates RENAME TO regular_payments;
                ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recurring_records') AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'regular_payments') THEN
                    ALTER TABLE recurring_records RENAME TO regular_payments;
                END IF;
            END $$;
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

        // System Settings
        await client.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id SERIAL PRIMARY KEY,
                setting_key TEXT UNIQUE NOT NULL,
                setting_value TEXT,
                setting_type TEXT DEFAULT 'text', -- text, number, boolean, json
                description TEXT,
                category TEXT DEFAULT 'general', -- general, email, appearance, etc
                is_public INTEGER DEFAULT 0, -- 0 = admin only, 1 = public readable
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Email Change Requests
        await client.query(`
            CREATE TABLE IF NOT EXISTS email_change_requests (
                id SERIAL PRIMARY KEY,
                userId INTEGER REFERENCES users(id),
                newEmail TEXT NOT NULL,
                otp TEXT NOT NULL,
                expiresAt TIMESTAMP NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Seed default OTP timeout (2 minutes)
        await client.query(`
            INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public)
            VALUES ('otp_timeout', '2', 'number', 'OTP validity period in minutes', 'security', 1)
            ON CONFLICT (setting_key) DO NOTHING
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
