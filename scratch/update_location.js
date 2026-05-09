const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    console.log('Updating business location to Surat...');
    const res = await client.query(`
        UPDATE business 
        SET city = 'Surat', state = 'Gujarat' 
        WHERE business_id = 'biz_blink_001'
    `);
    console.log(`Updated ${res.rowCount} record(s).`);
    await client.end();
}
run();
