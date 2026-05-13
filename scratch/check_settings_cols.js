const db = require('../db');

async function check() {
    try {
        const { rows } = await db.query(`SELECT * FROM business_settings LIMIT 1`);
        console.log('Record:', rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

check();
