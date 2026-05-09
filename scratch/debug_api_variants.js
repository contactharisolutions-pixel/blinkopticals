
const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

const configs = [
    {
        name: 'API Host + Pooler User',
        host: 'mtoslybnnywmsmpwjphv.supabase.co',
        port: 5432,
        user: 'postgres.mtoslybnnywmsmpwjphv',
        password: 'Life@20242526',
        database: 'postgres'
    },
    {
        name: 'API Host + Pooler User + 6543',
        host: 'mtoslybnnywmsmpwjphv.supabase.co',
        port: 6543,
        user: 'postgres.mtoslybnnywmsmpwjphv',
        password: 'Life@20242526',
        database: 'postgres'
    }
];

async function test() {
    for (const config of configs) {
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
            console.log(`SUCCESS!`);
            await client.end();
        } catch (err) {
            console.error(`FAILED: ${err.message}`);
        }
    }
}

test();
