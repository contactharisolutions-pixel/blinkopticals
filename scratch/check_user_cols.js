const db = require('../db');

async function check() {
    try {
        const { rows } = await db.query(`SELECT * FROM app_user LIMIT 1`);
        if (rows.length > 0) {
            console.log('Columns found:', Object.keys(rows[0]));
        } else {
            const res = await db.query(`SELECT * FROM app_user LIMIT 0`);
            console.log('Fields:', res.fields.map(f => f.name));
        }
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

check();
