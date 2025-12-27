const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../expenze.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Fixing database year from 2030 to 2025...\n');

db.serialize(() => {
    // Update month_plans table
    db.run(`UPDATE month_plans SET monthKey = REPLACE(monthKey, '2030-', '2025-')`, function (err) {
        if (err) {
            console.error('❌ Error updating month_plans:', err);
        } else {
            console.log(`✅ Updated ${this.changes} month_plans records`);
        }
    });

    // Update payment_templates start and end months
    db.run(`UPDATE payment_templates SET startMonth = REPLACE(startMonth, '2030-', '2025-')`, function (err) {
        if (err) {
            console.error('❌ Error updating payment_templates startMonth:', err);
        } else {
            console.log(`✅ Updated ${this.changes} payment_templates startMonth records`);
        }
    });

    db.run(`UPDATE payment_templates SET endMonth = REPLACE(endMonth, '2030-', '2025-') WHERE endMonth IS NOT NULL`, function (err) {
        if (err) {
            console.error('❌ Error updating payment_templates endMonth:', err);
        } else {
            console.log(`✅ Updated ${this.changes} payment_templates endMonth records`);
        }
    });

    // Update salaries table if it exists
    db.run(`UPDATE salaries SET monthKey = REPLACE(monthKey, '2030-', '2025-')`, function (err) {
        if (err) {
            console.error('❌ Error updating salaries (table might not exist):', err.message);
        } else {
            console.log(`✅ Updated ${this.changes} salaries records`);
        }
    });

    // Verify the changes
    db.all(`SELECT DISTINCT monthKey FROM month_plans ORDER BY monthKey DESC LIMIT 10`, [], (err, rows) => {
        if (err) {
            console.error('❌ Error verifying changes:', err);
        } else {
            console.log('\n📅 Current month keys in database:');
            rows.forEach(row => {
                console.log(`   - ${row.monthKey}`);
            });
        }

        console.log('\n✨ Database fix complete!');
        console.log('🔄 Please restart your server and refresh the browser.\n');

        db.close();
    });
});
