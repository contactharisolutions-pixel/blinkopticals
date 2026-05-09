
const db = require('../db');

async function test() {
    const biz = 'biz_blink_001';
    // This SQL matches what's in reports.routes.js:13
    const sql = `SELECT COALESCE(SUM(total_amount),0) AS revenue, COUNT(*) AS orders FROM customer_order WHERE business_id=$1 AND DATE(created_at)=CURRENT_DATE AND payment_status != 'cancelled'`;
    
    console.log('Testing Revenue Query via Proxy...');
    try {
        const { rows } = await db.query(sql, [biz]);
        console.log('Result:', rows[0]);
    } catch (err) {
        console.error('FAILED:', err.message);
    }
}

test();
