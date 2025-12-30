require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { run, get, all } = require('./database');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, { query: req.query, body: req.body });
    next();
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

app.post('/api/register', async (req, res) => {
    const { username, password, email, phone } = req.body;
    if (!username || !password || !email) return res.status(400).json({ error: 'Username, password, and email required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60000); // 10 mins

        const result = await run(
            'INSERT INTO users (username, password, email, phone, otp_code, otp_expiry, is_verified) VALUES (?, ?, ?, ?, ?, ?, 0)',
            [username, hashedPassword, email, phone, otp, otpExpiry]
        );

        // In a real app, send OTP via Email/SMS here.
        // For development, we log it and return it in response for easy testing.
        console.log(`[OTP] User: ${username}, Code: ${otp}`);

        res.json({
            message: 'Registration successful. Please verify OTP.',
            userId: result.lastID,
            testOtp: otp // REMOVE IN PRODUCTION
        });
    } catch (err) {
        if (err.message.includes('unique constraint') || err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Username or Email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/verify-otp', async (req, res) => {
    const { userId, otp } = req.body;
    try {
        const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) return res.status(400).json({ error: 'User not found' });

        if (user.is_verified) return res.json({ message: 'Already verified' });

        if (user.otp_code !== otp) return res.status(400).json({ error: 'Invalid OTP' });
        if (new Date(user.otp_expiry) < new Date()) return res.status(400).json({ error: 'OTP Expired' });

        await run('UPDATE users SET is_verified = 1, otp_code = NULL, otp_expiry = NULL WHERE id = ?', [userId]);

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });

    } catch (err) {
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

        if (!user.is_verified) {
            return res.status(403).json({ error: 'User not verified', userId: user.id });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CATEGORIES ---

app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const rows = await all('SELECT * FROM categories WHERE userId = ? ORDER BY sortOrder ASC', [req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
    const { name, sortOrder, isActive } = req.body;
    try {
        const result = await run(
            'INSERT INTO categories (userId, name, sortOrder, isActive) VALUES (?, ?, ?, ?)',
            [req.user.id, name, sortOrder || 0, isActive !== undefined ? isActive : 1]
        );
        res.json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
    const { name, sortOrder, isActive } = req.body;
    try {
        await run(
            'UPDATE categories SET name = ?, sortOrder = ?, isActive = ? WHERE id = ? AND userId = ?',
            [name, sortOrder, isActive, req.params.id, req.user.id]
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
        const user = await get('SELECT id, username, email, phone, role, is_verified FROM users WHERE id = ?', [req.user.id]);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
    const { email, phone } = req.body;
    try {
        await run('UPDATE users SET email = ?, phone = ? WHERE id = ?', [email, phone, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        if (err.message.includes('unique constraint') || err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Email already exists' });
        }
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

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
        await run('DELETE FROM categories WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TEMPLATES ---

app.get('/api/templates', authenticateToken, async (req, res) => {
    try {
        const rows = await all(`
            SELECT t.*, c.name as categoryName 
            FROM payment_templates t
            LEFT JOIN categories c ON t.categoryId = c.id
            WHERE t.userId = ?
            ORDER BY c.sortOrder, t.name
        `, [req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/templates', authenticateToken, async (req, res) => {
    const { name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive } = req.body;
    try {
        // Validate category belongs to user?
        // Ideally yes, but foreign key check might fail if not strict or handled by DB.
        // Assuming categoryId is valid for simplicity, or SQL foreign key handles it if enabled.

        const result = await run(
            `INSERT INTO payment_templates 
             (userId, name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive]
        );
        res.json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/templates/:id', authenticateToken, async (req, res) => {
    const { name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive } = req.body;
    try {
        await run(
            `UPDATE payment_templates 
             SET name=?, categoryId=?, defaultPlannedAmount=?, notes=?, startMonth=?, endMonth=?, isActive=?
             WHERE id=? AND userId=?`,
            [name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive, req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/templates/:id', authenticateToken, async (req, res) => {
    try {
        await run('DELETE FROM payment_templates WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
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

        // 2. Find templates valid for this month
        const templates = await all(`
            SELECT * FROM payment_templates 
            WHERE userId = ? 
            AND isActive = 1 
            AND startMonth <= ? 
            AND (endMonth IS NULL OR endMonth >= ?)
        `, [req.user.id, monthKey, monthKey]);

        let createdCount = 0;
        for (const t of templates) {
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
