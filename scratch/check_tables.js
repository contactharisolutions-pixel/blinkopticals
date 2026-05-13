const db = require('../db');
async function run() {
    const tables = ['pos_order_items', 'purchase_items', 'cart_items', 'stock_adjustment_items', 'transfer_items', 'wishlist'];
    for (const t of tables) {
        try {
            await db.query(`SELECT 1 FROM ${t} LIMIT 0`);
            console.log(`✅ ${t} exists`);
        } catch (e) {
            console.log(`❌ ${t} missing`);
        }
    }
    process.exit();
}
run();
