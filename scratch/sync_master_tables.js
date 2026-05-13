const db = require('../db');

async function migrate() {
    console.log('🚀 Synchronizing Master Tables...');
    const TABLES = ['brands', 'categories', 'genders', 'frame_types', 'shapes', 'materials', 'frame_colors', 'lens_colors', 'lens_materials'];
    
    try {
        for (const table of TABLES) {
            console.log(`Ensuring table: ${table}`);
            await db.query(`
                CREATE TABLE IF NOT EXISTS ${table} (
                    id TEXT PRIMARY KEY DEFAULT 'id_' || floor(random() * 1000000000)::text,
                    business_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    slug TEXT NOT NULL,
                    active_status BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `);
            
            // Add extra columns for specific tables if missing
            if (table === 'brands') {
                await db.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo TEXT`);
                await db.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS hero_url TEXT`);
                await db.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS description TEXT`);
            }
            if (table === 'categories') {
                await db.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_category_id TEXT`);
            }
            if (table === 'frame_colors') {
                await db.query(`ALTER TABLE frame_colors ADD COLUMN IF NOT EXISTS color_code TEXT`);
            }
            
            console.log(`✅ Table ${table} verified.`);
        }
        console.log('✨ All master tables synchronized in PostgreSQL.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        process.exit(0);
    }
}

migrate();
