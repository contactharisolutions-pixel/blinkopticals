const db = require('../db');

async function migrate() {
    try {
        console.log('Adding favicon_url to business table...');
        await db.query(`ALTER TABLE business ADD COLUMN IF NOT EXISTS favicon_url TEXT`);
        console.log('Success!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
