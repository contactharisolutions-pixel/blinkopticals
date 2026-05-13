require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');

async function addColumn() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Adding prescription_for column to eye_test table...');
        await client.query(`ALTER TABLE eye_test ADD COLUMN IF NOT EXISTS prescription_for VARCHAR(50) DEFAULT 'Glasses'`);
        console.log('Column successfully added.');
    } catch (err) {
        console.error('Failed to add column:', err.message);
    } finally {
        await client.end();
    }
}

addColumn();
