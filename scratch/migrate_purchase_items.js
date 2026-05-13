const { Pool } = require('pg');
require('dotenv').config({ path: '.env.development' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('--- Migration: Adding Brand, Gender, Discount to purchase_items ---');
        
        await pool.query(`
            ALTER TABLE purchase_items 
            ADD COLUMN IF NOT EXISTS brand_id TEXT,
            ADD COLUMN IF NOT EXISTS gender TEXT,
            ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0
        `);
        
        console.log('Success: purchase_items updated.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
