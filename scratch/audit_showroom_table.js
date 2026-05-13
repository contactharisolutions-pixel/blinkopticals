const db = require('../db');

async function migrate() {
    try {
        console.log('Auditing showroom table...');
        await db.query(`ALTER TABLE showroom ADD COLUMN IF NOT EXISTS pincode TEXT`);
        await db.query(`ALTER TABLE showroom ADD COLUMN IF NOT EXISTS state TEXT`);
        console.log('Success!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
