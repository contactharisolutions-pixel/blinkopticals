const db = require('../db');

async function migrate() {
    console.log('🚀 Starting Master Data Schema Fix...');
    const TABLES = ['brands', 'categories', 'genders', 'frame_types', 'shapes', 'materials', 'frame_colors', 'lens_colors', 'lens_materials'];
    
    try {
        for (const table of TABLES) {
            console.log(`Checking table: ${table}`);
            await db.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
            console.log(`✅ Table ${table} updated.`);
        }
        console.log('✨ All master tables synchronized.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        process.exit(0);
    }
}

migrate();
