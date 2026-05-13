// middleware/rbac.js — Dynamic Role-Based Access Control
'use strict';
const db = require('../db');

const ROLE_PERMISSIONS = {
    'Admin': ['dashboard','pos','products','ecommerce','inventory','orders','customers','crm','marketing','cms','reports','settings','staff','showrooms','clinic','transfers','business','master','media','appointments','accounting','purchase','invoices','return_customer','return_vendor','damaged_goods'],
    'Manager': ['dashboard','pos','products','ecommerce','inventory','orders','customers','crm','reports','showrooms','clinic','transfers','business','master','media','appointments','accounting','purchase','invoices','return_customer','return_vendor','damaged_goods'],
    'Cashier': ['pos','orders','customers'],
    'Showroom Manager': ['dashboard','pos','products','inventory','orders','customers','reports','showrooms','transfers','invoices','return_customer','damaged_goods'],
    'Optometrist': ['dashboard', 'clinic', 'appointments', 'customers'],
    'Warehouse Staff': ['inventory', 'transfers', 'products', 'return_vendor'],
    'Sales': ['pos', 'orders', 'customers', 'products']
};

/**
 * Gate a route to specific roles or permissions.
 * Usage: router.get('/route', auth, rbac('Admin','Manager'), handler)
 */
function rbac(...allowedRolesOrPerms) {
    return async (req, res, next) => {
        if (!req.user) return res.status(401).json({ success: false, error: 'Unauthenticated' });
        
        const userRole = req.user.role;

        // 1. Super Admin always bypasses
        if (userRole === 'Admin') return next();

        // 2. Check static/system roles if any
        if (allowedRolesOrPerms.includes(userRole)) return next();

        try {
            // 3. Fetch dynamic permissions for this role
            const { rows } = await db.query(
                'SELECT permissions FROM access_roles WHERE role_name = $1 AND (business_id = $2 OR is_system = true)',
                [userRole, req.user.business_id]
            );

            if (rows.length > 0) {
                const permissions = Array.isArray(rows[0].permissions) ? rows[0].permissions : JSON.parse(rows[0].permissions || '[]');
                
                // Check if any of the required roles/perms match the user's granted permissions
                const hasPermission = allowedRolesOrPerms.some(p => permissions.includes(p.toLowerCase()));
                if (hasPermission) return next();
            }
        } catch (err) {
            console.error('[RBAC Error]:', err.message);
        }

        return res.status(403).json({ 
            success: false, 
            error: `Access denied. Insufficient permissions for role: ${userRole}` 
        });
    };
}

module.exports = rbac;
module.exports.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
