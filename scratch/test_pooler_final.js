
const { Client } = require('pg');

async function test() {
    const projectRef = 'mtoslybnnywmsmpwjphv';
    const password = 'Life@20242526';
    const host = 'aws-0-ap-south-1.pooler.supabase.com';
    const port = 6543;
    const user = `postgres.${projectRef}`;
    const dbname = 'postgres';

    const connectionString = `postgresql://${user}:${password}@${host}:${port}/${dbname}`;
    console.log(`Connecting to ${host}:${port} as ${user}...`);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    });

    try {
        await client.connect();
        console.log('SUCCESS! Connected via Pooler.');
        const res = await client.query('SELECT version()');
        console.log('DB Version:', res.rows[0].version);
        await client.end();
    } catch (err) {
        console.error('FAILED:', err.message);
        if (err.code) console.error('Error Code:', err.code);
    }
}

test();
