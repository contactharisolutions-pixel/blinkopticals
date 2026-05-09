
const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

const configs = [
    {
        name: 'Pooler (Mumbai) No SSL',
        host: 'aws-0-ap-south-1.pooler.supabase.com',
        port: 6543,
        user: 'postgres.mtoslybnnywmsmpwjphv',
        password: 'Life@20242526',
        database: 'postgres',
        ssl: false
    },
    {
        name: 'Pooler (Mumbai) SSL',
        host: 'aws-0-ap-south-1.pooler.supabase.com',
        port: 6543,
        user: 'postgres.mtoslybnnywmsmpwjphv',
        password: 'Life@20242526',
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    }
];

async function check(config) {
    console.log(`\n--- Testing: ${config.name} ---`);
    console.log(`Host: ${config.host}`);
    
    const client = new Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: config.ssl,
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
