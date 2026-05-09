const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

const queries = [
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS upc_code VARCHAR(100)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS lens_composite VARCHAR(100)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS lens_colorway VARCHAR(100)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS lens_width VARCHAR(20)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS bridge_size VARCHAR(20)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS temple_length VARCHAR(20)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS measurements_h VARCHAR(50)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS measurements_w VARCHAR(50)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS measurements_l VARCHAR(50)`,
    `ALTER TABLE variant ADD COLUMN IF NOT EXISTS color_code VARCHAR(50)`,
    `ALTER TABLE variant ADD COLUMN IF NOT EXISTS size_code VARCHAR(50)`,
    `ALTER TABLE variant ADD COLUMN IF NOT EXISTS variant_image TEXT`,
    `ALTER TABLE variant ADD COLUMN IF NOT EXISTS variant_price DECIMAL(12,2)`
];

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    console.log('Adding more missing columns...');
    for (const q of queries) {
        try {
            await client.query(q);
            console.log(`Executed: ${q}`);
        } catch (err) {
            console.error(`Failed: ${q}`, err.message);
        }
    }
    await client.end();
}
run();
