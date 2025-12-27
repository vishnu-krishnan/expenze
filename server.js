const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { run, get, all } = require('./database');
const logger = require('./logger');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, { query: req.query, body: req.body });
    next();
});

// --- CATEGORIES ---

app.get('/api/categories', async (req, res) => {
    try {
        const rows = await all('SELECT * FROM categories ORDER BY sortOrder ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/categories', async (req, res) => {
    const { name, sortOrder, isActive } = req.body;
    try {
        const result = await run(
            'INSERT INTO categories (name, sortOrder, isActive) VALUES (?, ?, ?)',
            [name, sortOrder || 0, isActive !== undefined ? isActive : 1]
        );
        res.json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    const { name, sortOrder, isActive } = req.body;
    try {
        await run(
            'UPDATE categories SET name = ?, sortOrder = ?, isActive = ? WHERE id = ?',
            [name, sortOrder, isActive, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TEMPLATES ---

app.get('/api/templates', async (req, res) => {
    try {
        const rows = await all(`
            SELECT t.*, c.name as categoryName 
            FROM payment_templates t
            LEFT JOIN categories c ON t.categoryId = c.id
            ORDER BY c.sortOrder, t.name
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/templates', async (req, res) => {
    const { name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive } = req.body;
    try {
        const result = await run(
            `INSERT INTO payment_templates 
             (name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive]
        );
        res.json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/templates/:id', async (req, res) => {
    const { name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive } = req.body;
    try {
        await run(
            `UPDATE payment_templates 
             SET name=?, categoryId=?, defaultPlannedAmount=?, notes=?, startMonth=?, endMonth=?, isActive=?
             WHERE id=?`,
            [name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, isActive, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- MONTH PLANS ---

app.get('/api/month/:key', async (req, res) => {
    const { key } = req.params; // YYYY-MM
    try {
        const plan = await get('SELECT * FROM month_plans WHERE monthKey = ?', [key]);
        if (!plan) return res.json(null); // Not found

        const items = await all(`
            SELECT i.*, c.name as categoryName
            FROM payment_items i
            LEFT JOIN categories c ON i.categoryId = c.id
            WHERE i.monthPlanId = ?
            ORDER BY c.sortOrder, i.name
        `, [plan.id]);

        res.json({ plan, items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/month/generate', async (req, res) => {
    const { monthKey } = req.body;
    try {
        // 1. Create plan if not exists
        let plan = await get('SELECT * FROM month_plans WHERE monthKey = ?', [monthKey]);
        if (!plan) {
            const result = await run('INSERT INTO month_plans (monthKey) VALUES (?)', [monthKey]);
            plan = { id: result.lastID, monthKey };
        }

        // 2. Find templates valid for this month
        // logic: isActive=1, startMonth <= monthKey, (endMonth is NULL or >= monthKey)
        const templates = await all(`
            SELECT * FROM payment_templates 
            WHERE isActive = 1 
            AND startMonth <= ? 
            AND (endMonth IS NULL OR endMonth >= ?)
        `, [monthKey, monthKey]);

        // 3. For each template, check if item already exists in this monthPlan
        // (Simplified: we assume we don't want duplicates of the same template in the same month)
        // Wait, multiple different templates could map to items. We just blindly add if not "linked"?
        // Actually, let's just create items. But we shouldn't duplicate if they ran this twice.
        // We'll trust the user calls this ONCE, or we check existing items.
        // Let's optimize: fetch existing items derived from templates

        let createdCount = 0;
        for (const t of templates) {
            // Check if an item linked to this template already exists in this plan
            // We can check by matching name+category or some other key if we didn't store templateId?
            // Ah, we didn't store templateId in the simple schema above... wait, checking schema.
            // I missed `paymentTemplateId` in the raw SQL schema? 
            // Let's add it or rely on name?
            // Actually, I didn't verify the SQL schema in `database.js` thoroughly against Prisma one.
            // Checking database.js content...
            // `CREATE TABLE IF NOT EXISTS payment_items ...` NO `paymentTemplateId` column there!
            // That's fine, we can match by name + categoryId for "deduplication" purposes or just allow duplicates for now.
            // Let's simple check if (monthPlanId, name, categoryId) exists.

            const exists = await get(
                'SELECT id FROM payment_items WHERE monthPlanId = ? AND name = ? AND categoryId = ?',
                [plan.id, t.name, t.categoryId]
            );

            if (!exists) {
                await run(
                    `INSERT INTO payment_items (monthPlanId, categoryId, name, plannedAmount)
                      VALUES (?, ?, ?, ?)`,
                    [plan.id, t.categoryId, t.name, t.defaultPlannedAmount]
                );
                createdCount++;
            }
        }

        res.json({ message: `Generated ${createdCount} items for ${monthKey}`, planId: plan.id });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/items/:id', async (req, res) => {
    const { name, plannedAmount, actualAmount, isPaid, notes } = req.body;
    try {
        await run(
            `UPDATE payment_items 
             SET name=?, plannedAmount=?, actualAmount=?, isPaid=?, notes=?
             WHERE id=?`,
            [name, plannedAmount, actualAmount, isPaid, notes, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/items', async (req, res) => {
    // Add manual item
    const { monthPlanId, categoryId, name, plannedAmount, actualAmount, isPaid, notes } = req.body;
    try {
        const result = await run(
            `INSERT INTO payment_items (monthPlanId, categoryId, name, plannedAmount, actualAmount, isPaid, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [monthPlanId, categoryId, name, plannedAmount, actualAmount, isPaid, notes]
        );
        res.json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Summary for last 6 months (from current month backwards)
app.get('/api/summary/last6', async (req, res) => {
    try {
        // Calculate last 6 months from current date
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

        logger.info(`Fetching summary for months: ${months.join(', ')}`);

        // Fetch data for these specific months
        const placeholders = months.map(() => '?').join(',');
        const rows = await all(`
            SELECT mp.monthKey,
                   COALESCE(SUM(pi.plannedAmount), 0) AS totalPlanned,
                   COALESCE(SUM(pi.actualAmount), 0) AS totalActual
            FROM month_plans mp
            LEFT JOIN payment_items pi ON pi.monthPlanId = mp.id
            WHERE mp.monthKey IN (${placeholders})
            GROUP BY mp.monthKey
            ORDER BY mp.monthKey ASC
        `, months);

        // Ensure we have data for all 6 months (fill with zeros if missing)
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
app.get('/api/category-expenses/:monthKey', async (req, res) => {
    const { monthKey } = req.params;
    try {
        const plan = await get('SELECT * FROM month_plans WHERE monthKey = ?', [monthKey]);
        if (!plan) return res.json([]);

        const rows = await all(`
            SELECT c.name as categoryName,
                   SUM(pi.actualAmount) AS totalActual
            FROM payment_items pi
            LEFT JOIN categories c ON pi.categoryId = c.id
            WHERE pi.monthPlanId = ?
            GROUP BY pi.categoryId, c.name
            HAVING totalActual > 0
            ORDER BY totalActual DESC
        `, [plan.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Salary endpoints
app.get('/api/salary/:monthKey', async (req, res) => {
    const { monthKey } = req.params;
    try {
        const salary = await get('SELECT * FROM salaries WHERE monthKey = ?', [monthKey]);
        res.json(salary || { monthKey, amount: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/salary', async (req, res) => {
    const { monthKey, amount } = req.body;
    try {
        const existing = await get('SELECT * FROM salaries WHERE monthKey = ?', [monthKey]);

        if (existing) {
            await run('UPDATE salaries SET amount = ? WHERE monthKey = ?', [amount, monthKey]);
            res.json({ id: existing.id, monthKey, amount });
        } else {
            const result = await run('INSERT INTO salaries (monthKey, amount) VALUES (?, ?)', [monthKey, amount]);
            res.json({ id: result.lastID, monthKey, amount });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CRUD Delete Endpoints
app.delete('/api/categories/:id', async (req, res) => {
    try {
        await run('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/templates/:id', async (req, res) => {
    try {
        await run('DELETE FROM payment_templates WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/items/:id', async (req, res) => {
    try {
        await run('DELETE FROM payment_items WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
    console.log(`Server running at http://localhost:${PORT}`);
});
// Duplicate listen removed – only one server instance

