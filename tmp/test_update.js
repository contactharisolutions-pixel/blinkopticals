const db = require('../db');
async function test() {
    try {
        const { rows } = await db.query("SELECT product_id, business_id, mrp, selling_price FROM product WHERE is_published=false LIMIT 1");
        if (!rows[0]) { console.log('No unpublished products'); process.exit(0); }
        const p = rows[0];
        console.log('Testing update on:', p.product_id);
        
        await db.query(`
            UPDATE product SET
                product_name = product_name,
                selling_price = COALESCE(CASE WHEN selling_price > 0 THEN selling_price ELSE NULL END, mrp, 0.00),
                is_published = true
            WHERE product_id=$1 AND business_id=$2
        `, [p.product_id, p.business_id]);
        
        console.log('Update Success');
    } catch (e) {
        console.error('Update Failed:', e.message);
        console.error(e.stack);
    }
    process.exit(0);
}
test();
