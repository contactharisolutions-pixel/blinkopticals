
const { Client } = require('pg');

const configs = [
    {
        name: 'Pooler (Swapped User)',
        host: 'aws-0-ap-south-1.pooler.supabase.com',
        port: 6543,
        user: 'mtoslybnnywmsmpwjphv.postgres',
        password: 'Life@20242526',
        database: 'postgres'
    },
    {
        name: 'Pooler (Only Project User)',
        host: 'aws-0-ap-south-1.pooler.supabase.com',
        port: 6543,
        user: 'mtoslybnnywmsmpwjphv',
        password: 'Life@20242526',
        database: 'postgres'
    }
];

async function check(config) {
    console.log(`\n--- Testing: ${config.name} ---`);
    const client = new Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
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
