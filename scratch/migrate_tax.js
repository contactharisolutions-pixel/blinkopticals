const { Pool } = require('pg');
require('dotenv').config({ path: '.env.development' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await pool.query(`
            ALTER TABLE tax_rules ADD COLUMN IF NOT EXISTS hsn_code TEXT;
            ALTER TABLE tax_rules ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;
        `);
        console.log('tax_rules table enhanced');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

run();
