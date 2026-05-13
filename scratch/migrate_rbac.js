const db = require('../db');

async function migrate() {
    console.log('🚀 Starting RBAC Migration (Simplified)...');
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS access_roles (
                role_id TEXT PRIMARY KEY,
                business_id TEXT NOT NULL,
                role_name TEXT NOT NULL,
                permissions JSONB DEFAULT '[]',
                is_system BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(business_id, role_name)
            )
        `);
        console.log('✅ Table access_roles created/verified.');

        const systemRoles = [
            { id: 'role_admin', name: 'Admin', permissions: ['dashboard','pos','products','ecommerce','inventory','orders','customers','crm','marketing','cms','reports','settings','staff','showrooms','clinic','transfers','business','master','media','appointments','accounting','purchase'] },
            { id: 'role_manager', name: 'Manager', permissions: ['dashboard','pos','products','ecommerce','inventory','orders','customers','crm','reports','showrooms','clinic','transfers','business','master','media','appointments','accounting','purchase'] },
            { id: 'role_cashier', name: 'Cashier', permissions: ['pos','orders','customers'] }
        ];

        for (const r of systemRoles) {
            await db.query(
                `INSERT INTO access_roles (role_id, business_id, role_name, permissions, is_system) 
                 VALUES ($1, 'biz_blink_001', $2, $3, true)
                 ON CONFLICT (role_id) DO NOTHING`,
                [r.id, r.name, JSON.stringify(r.permissions)]
            );
        }
        console.log('🌱 Seeded system roles (if missing).');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        process.exit(0);
    }
}

migrate();
