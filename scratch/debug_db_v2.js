
const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

const configs = [
    {
        name: 'Pooler with Options',
        connectionString: "postgresql://postgres:Life%4020242526@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?options=-c%20project%3Dmtoslybnnywmsmpwjphv"
    },
    {
        name: 'Pooler with Project in User',
        connectionString: "postgresql://postgres.mtoslybnnywmsmpwjphv:Life%4020242526@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
    }
];

async function check(config) {
    console.log(`\n--- Testing: ${config.name} ---`);
    const client = new Client({
        connectionString: config.connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        console.log(`SUCCESS: Connected to ${config.name}`);
        const res = await client.query('SELECT current_database(), now()');
        console.log('Query result:', res.rows[0]);
        await client.end();
        return true;
    } catch (err) {
        console.error(`FAILED: ${config.name}`);
        console.error(`Error Code: ${err.code}`);
        console.error(`Message: ${err.message}`);
        return false;
    }
}

async function run() {
    for (const config of configs) {
        await check(config);
    }
}

run();
