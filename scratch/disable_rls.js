const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    console.log('Disabling RLS on all tables to allow public access...');
    
    const { rows: tables } = await client.query(`
        SELECT tablename FROM pg_catalog.pg_tables 
        WHERE schemaname = 'public'
    `);
    
    for (const { tablename } of tables) {
        try {
            await client.query(`ALTER TABLE "${tablename}" DISABLE ROW LEVEL SECURITY`);
            console.log(`Disabled RLS for ${tablename}`);
        } catch (err) {
            console.warn(`Failed to disable RLS for ${tablename}:`, err.message);
        }
    }
    
    await client.end();
}
run();
