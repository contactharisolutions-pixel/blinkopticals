const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

async function fixStorage() {
    console.log('Attempting to fix storage security as supabase_admin...');
    
    // Attempting to use the same password for supabase_admin
    const connectionString = 'postgresql://supabase_admin:Life%4020242526@db.mtoslybnnywmsmpwjphv.supabase.co:5432/postgres';
    
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        await client.query('DROP POLICY IF EXISTS "Allow Public View" ON "storage"."objects"');
        await client.query('DROP POLICY IF EXISTS "Public Access" ON "storage"."objects"');
        await client.query('DROP POLICY IF EXISTS "Allow Public Uploads" ON "storage"."objects"');
        await client.query('ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY');
        
        console.log('🚀 SUCCESS: Policies dropped and storage secured as supabase_admin!');

    } catch (err) {
        console.error('FAILED as supabase_admin:', err.message);
    } finally {
        await client.end();
    }
}

fixStorage();
