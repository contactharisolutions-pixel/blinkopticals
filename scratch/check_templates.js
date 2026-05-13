const db = require('../db');

async function check() {
    try {
        const { rows } = await db.query(`SELECT * FROM message_template LIMIT 1`);
        if (rows[0]) {
            console.log('Template Columns:', Object.keys(rows[0]));
        } else {
            console.log('No templates found');
        }
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

check();
