const db = require('../db');

async function check() {
    try {
        const { rows } = await db.query(`SELECT * FROM showroom LIMIT 1`);
        if (rows.length > 0) {
            console.log('Columns found:', Object.keys(rows[0]));
        } else {
            // If empty, try to get column names from field data
            const res = await db.query(`SELECT * FROM showroom LIMIT 0`);
            console.log('Fields:', res.fields.map(f => f.name));
        }
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

check();
