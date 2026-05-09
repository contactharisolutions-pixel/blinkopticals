
const dns = require('dns').promises;
const { Client } = require('pg');

async function test() {
    const hostname = 'db.mtoslybnnywmsmpwjphv.supabase.co';
    console.log(`Resolving ${hostname}...`);
    try {
        const addresses = await dns.resolve6(hostname);
        console.log('IPv6 addresses:', addresses);
        const ip = addresses[0];
        
        console.log(`Connecting to [${ip}]...`);
        const client = new Client({
            host: ip,
            port: 5432,
            user: 'postgres',
            password: 'Life@20242526',
            database: 'postgres',
            ssl: { rejectUnauthorized: false }
        });
        
        await client.connect();
        console.log('SUCCESS!');
        await client.end();
    } catch (err) {
        console.error('FAILED:', err);
    }
}

test();
