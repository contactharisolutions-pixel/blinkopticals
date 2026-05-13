const { Pool } = require('pg');
require('dotenv').config({ path: '.env.development' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS business_settings (
                business_id TEXT NOT NULL,
                setting_key TEXT NOT NULL,
                setting_value JSONB,
                updated_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (business_id, setting_key)
            )
        `);
        console.log('business_settings table ready');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

run();
