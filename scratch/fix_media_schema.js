const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function fixMediaSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database...');

        // 1. Create media_folders table
        console.log('Creating media_folders table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS media_folders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                business_id TEXT NOT NULL,
                folder_name TEXT NOT NULL,
                parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // 2. Fix media_library table
        console.log('Updating media_library table...');
        
        // Drop old if empty and recreate for consistency
        const { rows } = await client.query('SELECT COUNT(*) FROM media_library');
        if (rows[0].count === '0') {
            console.log('Table is empty, recreating for fresh schema...');
            await client.query('DROP TABLE IF EXISTS media_library CASCADE');
            await client.query(`
                CREATE TABLE media_library (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    business_id TEXT NOT NULL,
                    folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL,
                    file_name TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    file_url TEXT NOT NULL,
                    thumbnail_url TEXT,
                    size BIGINT,
                    width INT,
                    height INT,
                    tags JSONB DEFAULT '[]',
                    created_by TEXT DEFAULT 'system',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            `);
        } else {
            console.log('Table has data, altering columns...');
            // Add missing columns
            const cols = ['thumbnail_url', 'size', 'width', 'height', 'created_by', 'folder_id'];
            for (const col of cols) {
                try {
                    const type = col === 'size' ? 'BIGINT' : col === 'folder_id' ? 'UUID' : (col === 'width' || col === 'height') ? 'INT' : 'TEXT';
                    await client.query(`ALTER TABLE media_library ADD COLUMN IF NOT EXISTS ${col} ${type}`);
                } catch (e) { console.warn(`Column ${col} skip:`, e.message); }
            }
            // Rename media_id to id if exists
            try { await client.query('ALTER TABLE media_library RENAME COLUMN media_id TO id'); } catch(e){}
        }

        console.log('✅ Schema fixed successfully!');

    } catch (err) {
        console.error('❌ Error fixing schema:', err);
    } finally {
        await client.end();
    }
}

fixMediaSchema();
