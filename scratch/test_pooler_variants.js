
const { Client } = require('pg');

async function test() {
    const projectRef = 'mtoslybnnywmsmpwjphv';
    const password = 'Life@20242526';
    const host = '3.111.105.85'; // Mumbai Pooler IP
    
    const configs = [
        { name: 'DB = ProjectRef', user: 'postgres', database: projectRef },
        { name: 'User = ProjectRef', user: projectRef, database: 'postgres' }
    ];

    for (const config of configs) {
        console.log(`\n--- Testing: ${config.name} ---`);
        const client = new Client({
            host,
            port: 5432,
            user: config.user,
            password,
            database: config.database,
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
}

test();
