const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

async function fixStorage() {
    console.log('Attempting to fix storage security with elevated roles...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        const roles = ['postgres', 'supabase_admin'];
        let success = false;

        for (const role of roles) {
            try {
                console.log(`Trying with role: ${role}...`);
                await client.query(`SET ROLE ${role}`);
                
                await client.query('DROP POLICY IF EXISTS "Allow Public View" ON "storage"."objects"');
                await client.query('DROP POLICY IF EXISTS "Public Access" ON "storage"."objects"');
                await client.query('DROP POLICY IF EXISTS "Allow Public Uploads" ON "storage"."objects"');
                await client.query('ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY');
                await client.query('DROP POLICY IF EXISTS "Service Role Full Access" ON "storage"."objects"');
                await client.query('CREATE POLICY "Service Role Full Access" ON "storage"."objects" FOR ALL TO service_role USING (true) WITH CHECK (true)');
                
                console.log(`🚀 SUCCESS with role: ${role}`);
                success = true;
                break;
            } catch (err) {
                console.warn(`Failed with role ${role}:`, err.message);
            }
        }

        if (!success) {
            console.error('All SQL elevation attempts failed.');
        }

    } catch (err) {
        console.error('Connection failed:', err.message);
    } finally {
        await client.end();
    }
}

fixStorage();
