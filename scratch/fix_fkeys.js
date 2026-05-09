const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

const fixQueries = [
    // Brand
    `ALTER TABLE product DROP CONSTRAINT IF EXISTS product_brand_id_fkey`,
    `ALTER TABLE product ADD CONSTRAINT product_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id)`,
    
    // Category
    `ALTER TABLE product DROP CONSTRAINT IF EXISTS product_category_id_fkey`,
    `ALTER TABLE product ADD CONSTRAINT product_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id)`
];

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    console.log('Fixing product table foreign keys...');
    for (const q of fixQueries) {
        try {
            await client.query(q);
            console.log(`Executed: ${q}`);
        } catch (err) {
            console.error(`Failed: ${q}`, err.message);
        }
    }
    await client.end();
    console.log('Foreign keys fixed.');
}
run();
