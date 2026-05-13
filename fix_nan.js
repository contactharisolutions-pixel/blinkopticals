const db = require('./db');
async function run() {
    try {
        const res = await db.query("SELECT purchase_id FROM purchase_orders WHERE total_amount = 'NaN'");
        for (const row of res.rows) {
            const p = row.purchase_id;
            const items = await db.query('SELECT * FROM purchase_items WHERE purchase_id = $1', [p]);
            let total = 0;
            for (const item of items.rows) {
                const qty = parseFloat(item.quantity) || 0;
                const cost = parseFloat(item.unit_cost) || 0;
                const disc = parseFloat(item.discount_amount) || 0;
                total += Math.max(0, (qty * cost) - disc);
            }
            await db.query('UPDATE purchase_orders SET total_amount = $1 WHERE purchase_id = $2', [total, p]);
            console.log('Fixed', p, 'to', total);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
