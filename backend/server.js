const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { run, get, all } = require('./database');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Request logging middleware
app.use((req, res, next) => {
    const logData = {};
    if (Object.keys(req.query).length > 0) logData.query = req.query;
    if (req.body && Object.keys(req.body).length > 0) logData.body = req.body;

    logger.info(`${req.method} ${req.path}`, Object.keys(logData).length > 0 ? logData : '');
    next();
});

// API routes are defined below... Use prefix /api to avoid conflicts.
// API routes are defined below... Use prefix /api to avoid conflicts.
// Catch-all for React Frontend
app.get(/^\/(?!api).*/, (req, res, next) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// --- AUTHENTICATION ---

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
}

const nodemailer = require('nodemailer');

async function sendOtpEmail(email, otp, username, timeoutMinutes = 2) {
    const provider = await getSetting('email_provider') || 'gmail';
    let transporterConfig = {};
    let fromEmail = '';

    // Provider Configuration
    if (provider === 'gmail') {
        const user = await getSetting('email_user') || process.env.EMAIL_USER;
        const pass = await getSetting('email_pass') || process.env.EMAIL_PASS;
        if (!user || !pass) {
            console.log('[OTP] Email not configured (Gmail). OTP:', otp);
            return;
        }
        transporterConfig = { service: 'gmail', auth: { user, pass } };
        fromEmail = user;
    }
    else if (provider === 'sendgrid') {
        const apiKey = await getSetting('sendgrid_api_key');
        const user = await getSetting('email_user') || 'no-reply@expenze.com';
        if (!apiKey) {
            console.log('[OTP] SendGrid API Key missing. OTP:', otp);
            return;
        }
        transporterConfig = {
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: { user: 'apikey', pass: apiKey }
        };
        fromEmail = user;
    }
    else if (provider === 'resend') {
        const apiKey = await getSetting('resend_api_key');
        const user = await getSetting('email_user') || 'onboarding@resend.dev';
        if (!apiKey) {
            console.log('[OTP] Resend API Key missing. OTP:', otp);
            return;
        }
        transporterConfig = {
            host: 'smtp.resend.com',
            port: 465,
            secure: true,
            auth: { user: 'resend', pass: apiKey }
        };
        fromEmail = user;
    }
    else if (provider === 'smtp') {
        const host = await getSetting('smtp_host');
        const port = await getSetting('smtp_port') || 587;
        const secure = (await getSetting('smtp_secure')) === 'true';
        const user = await getSetting('email_user');
        const pass = await getSetting('email_pass');

        if (!host || !user || !pass) {
            console.log('[OTP] Custom SMTP config missing. OTP:', otp);
            return;
        }

        transporterConfig = {
            host,
            port: parseInt(port),
            secure,
            auth: { user, pass }
        };
        fromEmail = user;
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    const mailOptions = {
        from: fromEmail,
        to: email,
        subject: 'Expenze - Verify your Account',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #0d9488; text-align: center;">Welcome to Expenze!</h2>
                <p>Hello <strong>${username}</strong>,</p>
                <p>Use the following OTP to verify your account or email change:</p>
                <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 5px;">
                    ${otp}
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">This OTP is valid for ${timeoutMinutes} minutes.</p>
            </div>
        `
    };
    return transporter.sendMail(mailOptions);
}

app.post('/api/register', async (req, res) => {
    const { username, password, email, phone } = req.body;
    if (!username || !password || !email) return res.status(400).json({ error: 'Username, password, and email required' });

    try {
        // 1. Check if user already exists in MAIN table
        const existing = await get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existing) {
            return res.status(400).json({ error: 'Username or Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Get Configurable Timeout
        const timeoutSetting = await getSetting('otp_timeout', '2');
        const timeoutMinutes = parseInt(timeoutSetting);
        const expiresAt = new Date(Date.now() + timeoutMinutes * 60000);

        // 2. Upsert into Temp Table (Postgres ON CONFLICT)
        // Since we can't easily use ON CONFLICT with our helper 'run', we'll try INSERT, fallback to UPDATE.
        // Actually, 'run' is a wrapper -> let's use raw SQL for upsert pattern or simple check-delete-insert.

        // Simpler: Delete any existing pending verification for this email
        await run('DELETE FROM user_verifications WHERE email = ?', [email]);

        await run(
            'INSERT INTO user_verifications (email, username, password, phone, otp_code, expires_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING email',
            [email, username, hashedPassword, phone, otp, expiresAt]
        );

        // Send Email OTP in BACKGROUND to avoid blocking the UI
        const emailUser = await getSetting('email_user') || process.env.EMAIL_USER;
        const emailPass = await getSetting('email_pass') || process.env.EMAIL_PASS;
        const emailProvider = await getSetting('email_provider') || 'gmail';

        if (emailUser && emailPass) {
            // FIRE AND FORGET - Don't await this
            sendOtpEmail(email, otp, username, timeoutMinutes)
                .then(async () => {
                    logger.info(`OTP sent to ${email} via ${emailProvider}`);
                    await run('UPDATE user_verifications SET delivery_status = ? WHERE email = ?', ['sent', email]);
                })
                .catch(async err => {
                    logger.error('Background Email Failed:', err);
                    console.log(`[OTP RECOVERY] User: ${username}, Code: ${otp}`);
                    await run('UPDATE user_verifications SET delivery_status = ?, delivery_error = ? WHERE email = ?', ['failed', err.message, email]);
                });
        } else {
            logger.warn('Email credentials not configured.');
            console.log(`[OTP] User: ${username}, Code: ${otp}`);
            await run('UPDATE user_verifications SET delivery_status = ?, delivery_error = ? WHERE email = ?', ['failed', 'Email not configured', email]);
        }

        // Return response immediately
        res.json({
            message: 'Account created! Sending verification email...',
            email: email,
            otp_timeout: timeoutMinutes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const pending = await get('SELECT username FROM user_verifications WHERE email = ?', [email]);
        if (!pending) return res.status(404).json({ error: 'No pending registration found for this email' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Get Configurable Timeout
        const timeoutSetting = await getSetting('otp_timeout', '2');
        const timeoutMinutes = parseInt(timeoutSetting);
        const expiresAt = new Date(Date.now() + timeoutMinutes * 60000);

        // Update record with new OTP
        await run(
            'UPDATE user_verifications SET otp_code = ?, expires_at = ?, delivery_status = ?, delivery_error = ? WHERE email = ?',
            [otp, expiresAt, 'pending', null, email]
        );

        // Background email sending
        const emailUser = await getSetting('email_user') || process.env.EMAIL_USER;
        const emailPass = await getSetting('email_pass') || process.env.EMAIL_PASS;
        const emailProvider = await getSetting('email_provider') || 'gmail';

        if (emailUser && emailPass) {
            sendOtpEmail(email, otp, pending.username, timeoutMinutes)
                .then(async () => {
                    logger.info(`Resent OTP to ${email} via ${emailProvider}`);
                    await run('UPDATE user_verifications SET delivery_status = ? WHERE email = ?', ['sent', email]);
                })
                .catch(async err => {
                    logger.error('Resend Background Email Failed:', err);
                    await run('UPDATE user_verifications SET delivery_status = ?, delivery_error = ? WHERE email = ?', ['failed', err.message, email]);
                });
        }

        res.json({ message: 'New OTP has been sent!', otp_timeout: timeoutMinutes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// New endpoint to poll email delivery status
app.get('/api/registration-status/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const status = await get('SELECT delivery_status, delivery_error FROM user_verifications WHERE email = ?', [email]);
        if (!status) return res.status(404).json({ error: 'Registration not found' });
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/verify-otp', async (req, res) => {
    const { email, otp } = req.body; // Changed from userId to email
    try {
        const record = await get('SELECT * FROM user_verifications WHERE email = ?', [email]);
        if (!record) return res.status(400).json({ error: 'Invalid or expired verification request.' });

        if (record.otp_code !== otp) return res.status(400).json({ error: 'Invalid OTP' });
        if (new Date(record.expires_at) < new Date()) {
            return res.status(400).json({ error: 'OTP Expired. Please register again.' });
        }

        // OTP Valid. Move to Users Table.
        const result = await run(
            'INSERT INTO users (username, password, email, phone, role) VALUES (?, ?, ?, ?, ?)',
            [record.username, record.password, record.email, record.phone, 'user']
        );

        // Cleanup Temp
        await run('DELETE FROM user_verifications WHERE email = ?', [email]);

        const user = { id: result.lastID, username: record.username, role: 'user' };
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });

        res.json({ token, user });

    } catch (err) {
        if (err.message.includes('unique constraint')) {
            return res.status(400).json({ error: 'User already exists (Race condition)' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

        // No need to check is_verified, because they are only in this table IF verified.

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CATEGORIES ---

app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const rows = await all('SELECT * FROM categories WHERE userId = ? ORDER BY name ASC', [req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
    const { name, sortOrder, isActive, icon } = req.body;
    try {
        const result = await run(
            'INSERT INTO categories (userId, name, sortOrder, isActive, icon) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, name, sortOrder || 0, isActive !== undefined ? isActive : 1, icon || '']
        );
        res.json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
    const { name, sortOrder, isActive, icon } = req.body;
    try {
        await run(
            'UPDATE categories SET name = ?, sortOrder = ?, isActive = ?, icon = ? WHERE id = ? AND userId = ?',
            [name, sortOrder, isActive, icon || '', req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- MIDDLEWARE ---

function requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admins only.' });
    }
}

// --- PROFILE ---

app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await get('SELECT id, username, email, phone, role, is_verified, default_budget FROM users WHERE id = ?', [req.user.id]);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
    const { phone, default_budget } = req.body;
    try {
        // Direct email update is disabled for security. Use /request-email-change.
        await run('UPDATE users SET phone = ?, default_budget = ? WHERE id = ?', [phone, default_budget || 0, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/profile/request-email-change', authenticateToken, async (req, res) => {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ error: 'New email required' });

    try {
        // 1. Check if email matches current
        if (newEmail === req.user.email) return res.status(400).json({ error: 'New email matches current email' });

        // 2. Check if email is already taken
        const existing = await get('SELECT id FROM users WHERE email = ?', [newEmail]);
        if (existing) return res.status(400).json({ error: 'Email already registered' });

        // 3. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const timeoutSetting = await getSetting('otp_timeout', '2');
        const timeoutMinutes = parseInt(timeoutSetting);
        const expiresAt = new Date(Date.now() + timeoutMinutes * 60000);

        // 4. Store Request (Cleanup old requests first)
        await run('DELETE FROM email_change_requests WHERE userId = ?', [req.user.id]);
        await run(
            'INSERT INTO email_change_requests (userId, newEmail, otp, expiresAt) VALUES (?, ?, ?, ?)',
            [req.user.id, newEmail, otp, expiresAt]
        );

        // 5. Send OTP
        await sendOtpEmail(newEmail, otp, req.user.username, timeoutMinutes);

        res.json({ message: 'OTP sent to new email', timeoutMinutes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/profile/verify-email-change', authenticateToken, async (req, res) => {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP required' });

    try {
        const reqRecord = await get('SELECT * FROM email_change_requests WHERE userId = ?', [req.user.id]);
        if (!reqRecord) return res.status(400).json({ error: 'No pending email change request' });

        if (new Date() > new Date(reqRecord.expiresAt)) {
            return res.status(400).json({ error: 'OTP expired. Please request again.' });
        }

        if (reqRecord.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Verify Uniqueness again (race condition check)
        const conflict = await get('SELECT id FROM users WHERE email = ?', [reqRecord.newEmail]);
        if (conflict) return res.status(400).json({ error: 'Email already registered' });

        // Update User Email
        await run('UPDATE users SET email = ? WHERE id = ?', [reqRecord.newEmail, req.user.id]);

        // Cleanup
        await run('DELETE FROM email_change_requests WHERE userId = ?', [req.user.id]);

        res.json({ success: true, message: 'Email updated successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN ---

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await all('SELECT id, username, email, phone, role, is_verified, createdAt FROM users ORDER BY createdAt DESC');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { role, is_verified } = req.body;
    try {
        await run(
            'UPDATE users SET role = ?, is_verified = ? WHERE id = ?',
            [role, is_verified, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }
        await run('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SYSTEM SETTINGS (Admin Only) ---

// Get all settings
app.get('/api/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const settings = await all('SELECT * FROM system_settings ORDER BY category, setting_key');
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get setting by key
app.get('/api/settings/:key', async (req, res) => {
    try {
        const setting = await get('SELECT * FROM system_settings WHERE setting_key = ?', [req.params.key]);
        if (!setting) {
            return res.status(404).json({ error: 'Setting not found' });
        }
        // Only return public settings for non-admin users
        res.json(setting);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update/Create setting
app.put('/api/admin/settings/:key', authenticateToken, requireAdmin, async (req, res) => {
    const { value, type, description, category } = req.body;
    const { key } = req.params;

    try {
        // Check if exists
        const existing = await get('SELECT id FROM system_settings WHERE setting_key = ?', [key]);

        if (existing) {
            await run(
                'UPDATE system_settings SET setting_value = ?, setting_type = ?, description = ?, category = ?, updatedAt = CURRENT_TIMESTAMP WHERE setting_key = ?',
                [value, type || 'text', description || '', category || 'general', key]
            );
        } else {
            await run(
                'INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category) VALUES (?, ?, ?, ?, ?)',
                [key, value, type || 'text', description || '', category || 'general']
            );
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper function to get setting value
async function getSetting(key, defaultValue = null) {
    try {
        const setting = await get('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key]);
        return setting ? setting.setting_value : defaultValue;
    } catch (err) {
        return defaultValue;
    }
}

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
        await run('DELETE FROM categories WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REGULAR PAYMENTS ---

app.get('/api/regular', authenticateToken, async (req, res) => {
    try {
        const rows = await all(`
            SELECT t.*, c.name as categoryName 
            FROM regular_payments t
            LEFT JOIN categories c ON t.categoryId = c.id
            WHERE t.userId = ?
            ORDER BY c.name, t.name
        `, [req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/regular', authenticateToken, async (req, res) => {
    const { name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive } = req.body;
    try {
        const result = await run(
            `INSERT INTO regular_payments 
             (userId, name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive]
        );
        res.json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/regular/:id', authenticateToken, async (req, res) => {
    const { name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive } = req.body;
    try {
        await run(
            `UPDATE regular_payments 
             SET name=?, categoryId=?, defaultPlannedAmount=?, notes=?, startMonth=?, endMonth=?, isActive=?
             WHERE id=? AND userId=?`,
            [name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive, req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/regular/:id', authenticateToken, async (req, res) => {
    try {
        await run('DELETE FROM regular_payments WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- MONTH PLANS ---

app.get('/api/month/:key', authenticateToken, async (req, res) => {
    const { key } = req.params; // YYYY-MM
    try {
        const plan = await get('SELECT * FROM month_plans WHERE monthKey = ? AND userId = ?', [key, req.user.id]);
        if (!plan) return res.json(null); // Not found

        const items = await all(`
            SELECT i.*, c.name as categoryName
            FROM payment_items i
            LEFT JOIN categories c ON i.categoryId = c.id
            WHERE i.monthPlanId = ? AND i.userId = ?
            ORDER BY c.sortOrder, i.name
        `, [plan.id, req.user.id]);

        res.json({ plan, items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/month/generate', authenticateToken, async (req, res) => {
    const { monthKey } = req.body;
    try {
        // 1. Create plan if not exists
        let plan = await get('SELECT * FROM month_plans WHERE monthKey = ? AND userId = ?', [monthKey, req.user.id]);
        if (!plan) {
            const result = await run('INSERT INTO month_plans (userId, monthKey) VALUES (?, ?)', [req.user.id, monthKey]);
            plan = { id: result.lastID, monthKey };
        }

        // 2. Find regular payments valid for this month
        const records = await all(`
            SELECT * FROM regular_payments 
            WHERE userId = ? 
            AND isActive = 1 
            AND startMonth <= ? 
            AND (endMonth IS NULL OR endMonth >= ?)
        `, [req.user.id, monthKey, monthKey]);

        let createdCount = 0;
        for (const t of records) {
            // Check if exists
            const exists = await get(
                'SELECT id FROM payment_items WHERE monthPlanId = ? AND name = ? AND categoryId = ? AND userId = ?',
                [plan.id, t.name, t.categoryId, req.user.id]
            );

            if (!exists) {
                await run(
                    `INSERT INTO payment_items (userId, monthPlanId, categoryId, name, plannedAmount)
                      VALUES (?, ?, ?, ?, ?)`,
                    [req.user.id, plan.id, t.categoryId, t.name, t.defaultPlannedAmount]
                );
                createdCount++;
            }
        }

        res.json({ message: `Generated ${createdCount} items for ${monthKey}`, planId: plan.id });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/items/:id', authenticateToken, async (req, res) => {
    const { name, plannedAmount, actualAmount, isPaid, notes } = req.body;
    try {
        await run(
            `UPDATE payment_items 
             SET name=?, plannedAmount=?, actualAmount=?, isPaid=?, notes=?
             WHERE id=? AND userId=?`,
            [name, plannedAmount, actualAmount, isPaid, notes, req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/items', authenticateToken, async (req, res) => {
    // Add manual item
    const { monthPlanId, categoryId, name, plannedAmount, actualAmount, isPaid, notes } = req.body;
    try {
        const result = await run(
            `INSERT INTO payment_items (userId, monthPlanId, categoryId, name, plannedAmount, actualAmount, isPaid, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, monthPlanId, categoryId, name, plannedAmount, actualAmount, isPaid, notes]
        );
        res.json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/items/:id', authenticateToken, async (req, res) => {
    try {
        await run('DELETE FROM payment_items WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Summary for last 6 months
app.get('/api/summary/last6', authenticateToken, async (req, res) => {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12

        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(currentYear, currentMonth - 1 - i, 1);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            months.push(`${year}-${month}`);
        }

        const placeholders = months.map(() => '?').join(',');

        // Params must effectively double or include userId
        // Construct query carefully

        const rows = await all(`
            SELECT mp.monthKey,
                   COALESCE(SUM(pi.plannedAmount), 0) AS totalPlanned,
                   COALESCE(SUM(pi.actualAmount), 0) AS totalActual
            FROM month_plans mp
            LEFT JOIN payment_items pi ON pi.monthPlanId = mp.id
            WHERE mp.userId = ? AND mp.monthKey IN (${placeholders})
            GROUP BY mp.monthKey
            ORDER BY mp.monthKey ASC
        `, [req.user.id, ...months]);

        const result = months.map(monthKey => {
            const existing = rows.find(r => r.monthKey === monthKey);
            return existing || {
                monthKey,
                totalPlanned: 0,
                totalActual: 0
            };
        });

        res.json(result);
    } catch (err) {
        logger.error('Error fetching last 6 months summary:', err);
        res.status(500).json({ error: err.message });
    }
});

// Category expenses for current month (for pie chart)
app.get('/api/category-expenses/:monthKey', authenticateToken, async (req, res) => {
    const { monthKey } = req.params;
    try {
        const plan = await get('SELECT * FROM month_plans WHERE monthKey = ? AND userId = ?', [monthKey, req.user.id]);
        if (!plan) return res.json([]);

        const rows = await all(`
            SELECT c.name as categoryName,
                   SUM(pi.actualAmount) AS totalActual
            FROM payment_items pi
            LEFT JOIN categories c ON pi.categoryId = c.id
            WHERE pi.monthPlanId = ? AND pi.userId = ?
            GROUP BY pi.categoryId, c.name
            HAVING totalActual > 0
            ORDER BY totalActual DESC
        `, [plan.id, req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Salary endpoints
app.get('/api/salary/:monthKey', authenticateToken, async (req, res) => {
    const { monthKey } = req.params;
    try {
        const salary = await get('SELECT * FROM salaries WHERE monthKey = ? AND userId = ?', [monthKey, req.user.id]);
        res.json(salary || { monthKey, amount: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/salary', authenticateToken, async (req, res) => {
    const { monthKey, amount } = req.body;
    try {
        const existing = await get('SELECT * FROM salaries WHERE monthKey = ? AND userId = ?', [monthKey, req.user.id]);

        if (existing) {
            await run('UPDATE salaries SET amount = ? WHERE monthKey = ? AND userId = ?', [amount, monthKey, req.user.id]);
            res.json({ id: existing.id, monthKey, amount });
        } else {
            const result = await run('INSERT INTO salaries (userId, monthKey, amount) VALUES (?, ?, ?)', [req.user.id, monthKey, amount]);
            res.json({ id: result.lastID, monthKey, amount });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SEED DEFAULT USER ---
async function seedAdminUser() {
    const defaultUser = process.env.DEFAULT_ADMIN_USERNAME;
    const defaultPass = process.env.DEFAULT_ADMIN_PASSWORD;

    if (defaultUser && defaultPass) {
        try {
            const existing = await get('SELECT * FROM users WHERE username = ?', [defaultUser]);
            if (!existing) {
                const hashedPassword = await bcrypt.hash(defaultPass, 10);
                await run(
                    'INSERT INTO users (username, password, role, is_verified) VALUES (?, ?, ?, 1)',
                    [defaultUser, hashedPassword, 'admin']
                );
                logger.info(`Default admin user '${defaultUser}' created.`);
                console.log(`Default admin user '${defaultUser}' created.`);
            } else {
                // Ensure admin role and verification
                if (existing.role !== 'admin' || !existing.is_verified) {
                    await run('UPDATE users SET role = ?, is_verified = 1 WHERE id = ?', ['admin', existing.id]);
                    console.log(`Updated '${defaultUser}' to admin role and verified status.`);
                }
            }
        } catch (err) {
            logger.error('Error seeding admin user:', err);
            console.error('Error seeding admin user:', err.message);
        }
    }
}

// Start Server
seedAdminUser().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server running at http://0.0.0.0:${PORT}`);
        console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
});
