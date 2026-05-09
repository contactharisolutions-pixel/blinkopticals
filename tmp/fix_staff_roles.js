const db = require('../db');

async function fixConstraint() {
    try {
        console.log('--- DB Hardening: Updating Staff Roles ---');
        
        // 1. Drop existing constraint
        await db.query('ALTER TABLE app_user DROP CONSTRAINT IF EXISTS app_user_role_check');
        
        // 2. Add new constraint with 'Sales' included
        // Based on schema.sql + 'Sales'
        const roles = ['Admin', 'Manager', 'Showroom Manager', 'Cashier', 'Optometrist', 'Warehouse Staff', 'Sales'];
        const rolesStr = roles.map(r => `'${r}'`).join(', ');
        
        await db.query(`ALTER TABLE app_user ADD CONSTRAINT app_user_role_check CHECK (role IN (${rolesStr}))`);
        
        console.log('✅ Staff role constraint upgraded successfully to include "Sales".');
        
    } catch (err) {
        console.error('❌ Error updating constraint:', err);
    } finally {
        process.exit();
    }
}

fixConstraint();
