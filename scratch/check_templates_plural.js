const db = require('../db');

async function check() {
    try {
        const { rows } = await db.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'message_templates'`);
        console.log('Columns:', rows);
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

check();
