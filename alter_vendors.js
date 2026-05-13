const db = require('./db');

async function migrate() {
    try {
        console.log('--- Altering Vendors Table with Enterprise Fields ---');
        
        await db.query(`
            ALTER TABLE vendors 
            ADD COLUMN IF NOT EXISTS city VARCHAR(100),
            ADD COLUMN IF NOT EXISTS state VARCHAR(100),
            ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
            ADD COLUMN IF NOT EXISTS pan_no VARCHAR(20),
            ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS bank_acc_no VARCHAR(50),
            ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(20)
        `);

        console.log('Success: Vendors table updated.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
