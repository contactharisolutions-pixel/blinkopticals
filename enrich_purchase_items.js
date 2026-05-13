const db = require('./db');

async function migrate() {
    try {
        console.log('--- Adding Optical Attributes to Purchase Items ---');
        
        await db.query(`
            ALTER TABLE purchase_items 
            ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
            ADD COLUMN IF NOT EXISTS category VARCHAR(100),
            ADD COLUMN IF NOT EXISTS shape VARCHAR(100),
            ADD COLUMN IF NOT EXISTS size VARCHAR(50),
            ADD COLUMN IF NOT EXISTS frame_color VARCHAR(100),
            ADD COLUMN IF NOT EXISTS frame_material VARCHAR(100),
            ADD COLUMN IF NOT EXISTS lens_material VARCHAR(100),
            ADD COLUMN IF NOT EXISTS lens_color VARCHAR(100)
        `);

        console.log('Success: Purchase items schema enriched.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
