const db = require('./db');
async function run() {
    const q = `
        SELECT p.product_name, b.name as brand_name, o.offer_name 
        FROM product p 
        LEFT JOIN brands b ON p.brand_id = b.id 
        LEFT JOIN LATERAL (
            SELECT offer_name 
            FROM offer 
            WHERE active_status = true 
              AND apply_on = 'Brand' 
              AND apply_target = b.name
        ) o ON true 
        WHERE p.product_name LIKE 'ARMANI EXCHANGE%'
    `;
    const { rows } = await db.query(q);
    console.log(rows);
    process.exit();
}
run();
