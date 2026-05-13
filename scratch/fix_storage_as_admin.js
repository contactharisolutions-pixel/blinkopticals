const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

async function setupStorage() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        // Try to elevate role
        try { await client.query('SET ROLE postgres'); } catch (e) { console.log('Could not set role postgres, continuing...'); }

        // 1. Ensure RLS is on
        await client.query('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY');

        // 2. Add Service Role policy (Bypass)
        await client.query('DROP POLICY IF EXISTS "Service Role Full Access" ON storage.objects');
        await client.query('CREATE POLICY "Service Role Full Access" ON storage.objects FOR ALL TO service_role USING (true) WITH CHECK (true)');

        // 3. Add Public Read policy for 'media' bucket
        await client.query('DROP POLICY IF EXISTS "Public Read Access" ON storage.objects');
        await client.query('CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT TO public USING (bucket_id = \'media\')');

        console.log('✅ Storage policies updated successfully');
    } catch (err) {
        console.error('Failed to update storage policies:', err.message);
    } finally {
        await client.end();
    }
}

setupStorage();
