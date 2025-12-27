const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../expenze.db');
const db = new sqlite3.Database(dbPath);

const currentYear = new Date().getFullYear(); // 2025

console.log(`🔧 Keeping only year ${currentYear} data...\n`);

db.serialize(() => {
    // Show current state
    db.all(`SELECT monthKey, COUNT(*) as itemCount FROM month_plans mp LEFT JOIN payment_items pi ON mp.id = pi.monthPlanId GROUP BY monthKey ORDER BY monthKey`, [], (err, rows) => {
        if (!err) {
            console.log('📊 Current database state:');
            rows.forEach(row => {
                const year = row.monthKey.split('-')[0];
                const marker = year == currentYear ? '✓' : '✗';
                console.log(`   ${marker} ${row.monthKey}: ${row.itemCount} items`);
            });
            console.log('');
        }
    });

    // Delete future years
    db.run(`DELETE FROM payment_items WHERE monthPlanId IN (SELECT id FROM month_plans WHERE monthKey NOT LIKE '${currentYear}-%')`, function (err) {
        if (err) {
            console.error('❌ Error deleting payment_items:', err.message);
        } else {
            console.log(`✅ Deleted ${this.changes} payment items from other years`);
        }
    });

    db.run(`DELETE FROM month_plans WHERE monthKey NOT LIKE '${currentYear}-%'`, function (err) {
        if (err) {
            console.error('❌ Error deleting month_plans:', err);
        } else {
            console.log(`✅ Deleted ${this.changes} month plans from other years`);
        }
    });

    db.run(`DELETE FROM salaries WHERE monthKey NOT LIKE '${currentYear}-%'`, function (err) {
        if (err) {
            console.error('❌ Error deleting salaries:', err.message);
        } else {
            console.log(`✅ Deleted ${this.changes} salaries from other years`);
        }
    });

    // Update templates to use current year
    db.run(`UPDATE payment_templates SET startMonth = '${currentYear}-' || substr(startMonth, 6) WHERE startMonth NOT LIKE '${currentYear}-%'`, function (err) {
        if (err) {
            console.error('❌ Error updating templates:', err);
        } else {
            console.log(`✅ Updated ${this.changes} template start months to ${currentYear}`);
        }
    });

    // Verify
    setTimeout(() => {
        db.all(`SELECT monthKey FROM month_plans ORDER BY monthKey`, [], (err, rows) => {
            if (err) {
                console.error('❌ Error verifying:', err);
            } else {
                console.log(`\n📅 Remaining months (${rows.length} total):`);
                rows.forEach(row => {
                    console.log(`   ✓ ${row.monthKey}`);
                });
            }

            console.log(`\n✨ Database cleaned! Only ${currentYear} data remains.`);
            console.log('💡 You can now generate more months using "Generate from Templates"');
            console.log('🔄 Restart your server and refresh the browser.\n');

            db.close();
        });
    }, 1000);
});
