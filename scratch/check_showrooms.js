const db = require('../db');

async function check() {
    try {
        const { rows } = await db.query(`SELECT showroom_id, showroom_name FROM showroom`);
        console.log('Available Showrooms:', rows);
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

check();
