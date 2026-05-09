
const db = require('../db');

async function test() {
    const biz = 'biz_blink_001';
    // This SQL matches what's in showrooms.routes.js
    const sql = `SELECT s.*, 
                (SELECT COUNT(*) FROM app_user u WHERE u.showroom_id = s.showroom_id AND u.business_id = s.business_id) AS staff_count,
                (SELECT COALESCE(SUM(i.available_qty),0) FROM inventory i WHERE i.showroom_id = s.showroom_id AND i.business_id = s.business_id) AS total_stock
             FROM showroom s 
             WHERE s.business_id = $1 
             ORDER BY s.created_at DESC`;
    
    console.log('Testing Showroom Query via Proxy...');
    try {
        const { rows } = await db.query(sql, [biz]);
        console.log('Rows found:', rows.length);
        console.log('Sample Row:', rows[0]);
    } catch (err) {
        console.error('FAILED:', err.message);
    }
}

test();
