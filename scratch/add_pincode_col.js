const db = require('../db');

async function migrate() {
    try {
        console.log('Adding pincode to business table...');
        await db.query(`ALTER TABLE business ADD COLUMN IF NOT EXISTS pincode TEXT`);
        console.log('Success!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
