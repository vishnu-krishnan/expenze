// scripts/importCsv.js
// Usage: node scripts/importCsv.js "path/to/Payment_Schedule_With_Status - 1. All Payments.csv"

const fs = require('fs');
const path = require('path');
const { run, get, all } = require('../database');

// Helper to convert "Nov-2025" -> "2025-11"
function monthLabelToKey(label) {
    const [monStr, yearStr] = label.split('-');
    const monthMap = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
        Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };
    const month = monthMap[monStr];
    if (!month) throw new Error(`Unknown month abbreviation: ${monStr}`);
    return `${yearStr}-${month}`;
}

async function ensureCategory(name) {
    const existing = await get('SELECT id FROM categories WHERE name = ?', [name]);
    if (existing) return existing.id;
    const result = await run('INSERT INTO categories (name, sortOrder, isActive) VALUES (?, 0, 1)', [name]);
    return result.lastID;
}

async function ensureTemplate(name, categoryId, plannedAmount, monthKey) {
    const existing = await get('SELECT id, startMonth, endMonth FROM payment_templates WHERE name = ? AND categoryId = ?', [name, categoryId]);
    if (existing) {
        // Update startMonth/endMonth if needed (keep earliest start, latest end)
        const newStart = existing.startMonth && existing.startMonth < monthKey ? existing.startMonth : monthKey;
        const newEnd = existing.endMonth && existing.endMonth > monthKey ? existing.endMonth : monthKey;
        await run('UPDATE payment_templates SET startMonth = ?, endMonth = ?, defaultPlannedAmount = ? WHERE id = ?', [newStart, newEnd, plannedAmount, existing.id]);
        return existing.id;
    }
    const result = await run(
        `INSERT INTO payment_templates (name, categoryId, defaultPlannedAmount, notes, startMonth, endMonth, frequency, isActive)
     VALUES (?, ?, ?, NULL, ?, NULL, 'MONTHLY', 1)`,
        [name, categoryId, plannedAmount, monthKey]
    );
    return result.lastID;
}

async function ensureMonthPlan(monthKey) {
    const existing = await get('SELECT id FROM month_plans WHERE monthKey = ?', [monthKey]);
    if (existing) return existing.id;
    const result = await run('INSERT INTO month_plans (monthKey) VALUES (?)', [monthKey]);
    return result.lastID;
}

async function importCsv(csvPath) {
    const raw = fs.readFileSync(csvPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
    const header = lines[0].split(',').map(h => h.trim());
    const idx = {
        month: header.indexOf('Month'),
        category: header.indexOf('Category'),
        paymentName: header.indexOf('Payment Name'),
        planned: header.indexOf('Planned Amount (₹)'),
        actual: header.indexOf('Actual Amount (₹)'),
        paid: header.indexOf('Paid? (Y/N)'),
        notes: header.indexOf('Notes'),
        total: header.indexOf('Total Expense') // not used for import
    };

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const monthLabel = cols[idx.month].trim();
        const monthKey = monthLabelToKey(monthLabel);
        const categoryName = cols[idx.category].trim();
        const paymentName = cols[idx.paymentName].trim();
        const plannedAmt = parseFloat(cols[idx.planned].replace(/[^0-9.-]+/g, '')) || 0;
        const actualAmt = parseFloat(cols[idx.actual].replace(/[^0-9.-]+/g, '')) || 0;
        const paidFlag = (cols[idx.paid] || '').trim().toUpperCase() === 'Y' ? 1 : 0;
        const notes = cols[idx.notes] ? cols[idx.notes].trim() : '';

        // Ensure related records exist
        const categoryId = await ensureCategory(categoryName);
        const templateId = await ensureTemplate(paymentName, categoryId, plannedAmt, monthKey);
        const monthPlanId = await ensureMonthPlan(monthKey);

        // Insert payment item (one‑off items are also stored here)
        await run(
            `INSERT INTO payment_items (monthPlanId, categoryId, name, plannedAmount, actualAmount, isPaid, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [monthPlanId, categoryId, paymentName, plannedAmt, actualAmt, paidFlag, notes]
        );
    }
    console.log('Import completed successfully.');
}

// ---- Entry point ----
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.error('Usage: node scripts/importCsv.js <path-to-csv>');
        process.exit(1);
    }
    const csvPath = path.resolve(args[0]);
    importCsv(csvPath).catch(err => {
        console.error('Error during import:', err);
        process.exit(1);
    });
}
