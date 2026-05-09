
const db = require('../db');

async function testCustomerQuery() {
    const biz = 'biz_blink_001';
    console.log('--- TESTING CUSTOMER LIST QUERY ---');

    try {
        const { rows } = await db.query(
            `SELECT c.*,
               (SELECT COUNT(*) FROM customer_order WHERE customer_id = c.customer_id) AS order_count,
               (SELECT COALESCE(SUM(total_amount),0) FROM customer_order WHERE customer_id = c.customer_id) AS lifetime_value,
               l.tier, l.points
             FROM customer c
             LEFT JOIN loyalty l ON l.customer_id = c.customer_id
             WHERE c.business_id = $1
             ORDER BY c.created_at DESC LIMIT $2 OFFSET $3`,
            [biz, 100, 0]
        );
        
        console.log('Row count:', rows.length);
        if (rows.length > 0) {
            console.log('First row:', JSON.stringify(rows[0], null, 2));
        }
    } catch (err) {
        console.error('Query failed:', err.message, err.stack);
    }
}

testCustomerQuery();
