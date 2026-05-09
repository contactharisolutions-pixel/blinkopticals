
const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

const projectRef = 'mtoslybnnywmsmpwjphv';
const password = 'Life@20242526';

const hosts = [
    `db.${projectRef}.supabase.co`,
    `aws-0-ap-south-1.pooler.supabase.com`,
    `aws-0-us-east-1.pooler.supabase.com`
];

const ports = [5432, 6543];

const users = [
    'postgres',
    `postgres.${projectRef}`
];

async function test() {
    for (const host of hosts) {
        for (const port of ports) {
            for (const user of users) {
                console.log(`\n--- Testing: ${user}@${host}:${port} ---`);
                const client = new Client({
                    host,
                    port,
                    user,
                    password,
                    database: 'postgres',
                    ssl: { rejectUnauthorized: false },
                    connectionTimeoutMillis: 3000
                });

                try {
                    await client.connect();
                    console.log(`SUCCESS!`);
                    await client.end();
                    process.exit(0);
                } catch (err) {
                    console.error(`FAILED: ${err.message}`);
                }
            }
        }
    }
}

test();
