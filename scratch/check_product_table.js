const db = require('../db');
async function run() {
    try { await db.query('SELECT 1 FROM product LIMIT 0'); console.log('✅ product exists'); } catch(e) { console.log('❌ product missing'); }
    try { await db.query('SELECT 1 FROM products LIMIT 0'); console.log('✅ products exists'); } catch(e) { console.log('❌ products missing'); }
    process.exit();
}
run();
