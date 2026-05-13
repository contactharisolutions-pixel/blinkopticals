const db = require('./db');

async function migrate() {
    try {
        console.log('--- Altering Purchase Tables for Tax & Barcode Details ---');
        
        await db.query(`
            ALTER TABLE purchase_items 
            ADD COLUMN IF NOT EXISTS model_no VARCHAR(100),
            ADD COLUMN IF NOT EXISTS upc_code VARCHAR(100),
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(15,2) DEFAULT 0
        `);

        console.log('Success: Purchase tables updated.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
