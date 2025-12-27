const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../expenze.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Cleaning up database - removing year 2030 data...\n');

db.serialize(() => {
    // First, show what we have
    db.all(`SELECT monthKey, COUNT(*) as count FROM month_plans GROUP BY monthKey ORDER BY monthKey`, [], (err, rows) => {
        if (!err) {
            console.log('📊 Current month_plans:');
            rows.forEach(row => {
                console.log(`   ${row.monthKey}: ${row.count} plan(s)`);
            });
            console.log('');
        }
    });

    // Delete month plans from 2030
    db.run(`DELETE FROM month_plans WHERE monthKey LIKE '2030-%'`, function (err) {
        if (err) {
            console.error('❌ Error deleting 2030 month_plans:', err);
        } else {
            console.log(`✅ Deleted ${this.changes} month_plans from year 2030`);
        }
    });

    // Delete payment items for 2030 months
    db.run(`DELETE FROM payment_items WHERE monthPlanId IN (SELECT id FROM month_plans WHERE monthKey LIKE '2030-%')`, function (err) {
        if (err) {
            console.error('❌ Error deleting payment_items:', err.message);
        } else {
            console.log(`✅ Deleted ${this.changes} payment_items from year 2030`);
        }
    });

    // Update templates to use 2025
    db.run(`UPDATE payment_templates SET startMonth = REPLACE(startMonth, '2030-', '2025-') WHERE startMonth LIKE '2030-%'`, function (err) {
        if (err) {
            console.error('❌ Error updating templates startMonth:', err);
        } else {
            console.log(`✅ Updated ${this.changes} templates startMonth to 2025`);
        }
    });

    db.run(`UPDATE payment_templates SET endMonth = REPLACE(endMonth, '2030-', '2025-') WHERE endMonth LIKE '2030-%'`, function (err) {
        if (err) {
            console.error('❌ Error updating templates endMonth:', err);
        } else {
            console.log(`✅ Updated ${this.changes} templates endMonth to 2025`);
        }
    });

    // Delete salaries from 2030
    db.run(`DELETE FROM salaries WHERE monthKey LIKE '2030-%'`, function (err) {
        if (err) {
            console.error('❌ Error deleting 2030 salaries:', err.message);
        } else {
            console.log(`✅ Deleted ${this.changes} salaries from year 2030`);
        }
    });

    // Verify the cleanup
    setTimeout(() => {
        db.all(`SELECT DISTINCT monthKey FROM month_plans ORDER BY monthKey DESC LIMIT 10`, [], (err, rows) => {
            if (err) {
                console.error('❌ Error verifying:', err);
            } else {
                console.log('\n📅 Remaining month keys in database:');
                rows.forEach(row => {
                    console.log(`   - ${row.monthKey}`);
                });
            }

            console.log('\n✨ Database cleanup complete!');
            console.log('💡 Now you can generate new months for 2025 using "Generate from Templates"');
            console.log('🔄 Please restart your server and refresh the browser.\n');

            db.close();
        });
    }, 1000);
});
