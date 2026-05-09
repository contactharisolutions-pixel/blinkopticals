const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

const queries = [
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS model_no VARCHAR(100)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS mrp DECIMAL(12,2)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS selling_price DECIMAL(12,2)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS measurements_h VARCHAR(50)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS measurements_w VARCHAR(50)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS measurements_l VARCHAR(50) DEFAULT '140'`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS short_description TEXT`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS tags TEXT[]`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS seo_keywords TEXT`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS seo_description TEXT`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS video_url TEXT`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS additional_images JSONB DEFAULT '[]'`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS main_image TEXT`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS lens_material_id VARCHAR(50)`,
    `ALTER TABLE product ADD COLUMN IF NOT EXISTS lens_color_id VARCHAR(50)`,
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
    console.log('Connected to database to add missing columns...');
    for (const q of queries) {
        try {
            await client.query(q);
            console.log(`Executed: ${q}`);
        } catch (err) {
            console.error(`Failed: ${q}`, err.message);
        }
    }
    await client.end();
    console.log('Missing columns added.');
}
run();
