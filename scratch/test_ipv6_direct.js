
const { Client } = require('pg');

const ipv6 = '2406:da18:243:740e:e420:23f1:3394:c5e1';
const projectRef = 'mtoslybnnywmsmpwjphv';
const password = 'Life@20242526';

async function test() {
    console.log(`Connecting to [${ipv6}]...`);
    const client = new Client({
        host: ipv6,
        port: 5432,
        user: 'postgres',
        password: password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        console.log('SUCCESS!');
        await client.end();
    } catch (err) {
        console.error('FAILED:', err.message);
    }
}

test();
