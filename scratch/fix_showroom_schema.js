const db = require('../db');

async function migrate() {
    try {
        console.log('Adding missing columns to showroom table...');
        await db.query(`ALTER TABLE showroom ADD COLUMN IF NOT EXISTS gstin TEXT`);
        await db.query(`ALTER TABLE showroom ADD COLUMN IF NOT EXISTS email TEXT`);
        await db.query(`ALTER TABLE showroom ADD COLUMN IF NOT EXISTS secondary_contact TEXT`);
        await db.query(`ALTER TABLE showroom ADD COLUMN IF NOT EXISTS google_maps_link TEXT`);
        console.log('Success!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
