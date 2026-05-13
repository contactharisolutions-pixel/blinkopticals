const db = require('../db');

async function check() {
    try {
        const { rows } = await db.query(`SELECT * FROM business LIMIT 1`);
        if (rows[0]) {
            console.log('Business Columns:', Object.keys(rows[0]));
        } else {
            console.log('No business found');
        }
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

check();
