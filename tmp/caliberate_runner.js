const db = require('../db');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'calibrate_product_table.sql'), 'utf8');
        await db.query(sql);
        console.log('SUCCESS: Product table calibrated.');
        
        const cols = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name='product'`);
        console.log(`NEW COLUMNS (product):`, cols.rows.map(r => r.column_name).sort().join(', '));
    } catch (e) {
        console.error('CALIBRATION FAILED:', e.message);
    }
    process.exit(0);
}
run();
