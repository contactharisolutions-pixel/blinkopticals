// routes/access.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// 1. GET /api/access/roles — Fetch all roles for a business
router.get('/roles', auth, rbac('Admin'), async (req, res) => {
    try {
        const { business_id } = req.user;
        const { rows } = await db.query(
            'SELECT * FROM access_roles WHERE business_id = $1 OR is_system = true ORDER BY is_system DESC, created_at DESC',
            [business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. POST /api/access/roles — Create a new custom role
router.post('/roles', auth, rbac('Admin'), async (req, res) => {
    const { role_name, permissions } = req.body;
    if (!role_name || !permissions) {
        return res.status(400).json({ success: false, error: 'Role name and permissions are required' });
    }

    try {
        const { business_id } = req.user;
        const role_id = `role_${Date.now()}`;
        
        const { rows } = await db.query(
            `INSERT INTO access_roles (role_id, business_id, role_name, permissions, is_system)
             VALUES ($1, $2, $3, $4, false)
             RETURNING *`,
            [role_id, business_id, role_name, JSON.stringify(permissions)]
        );
        
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ success: false, error: 'Role name already exists' });
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. PUT /api/access/roles/:id — Update a custom role
router.put('/roles/:id', auth, rbac('Admin'), async (req, res) => {
    const { role_name, permissions } = req.body;
    const { id } = req.params;

    try {
        const { business_id } = req.user;
        
        // Prevent editing system roles
        const check = await db.query('SELECT is_system FROM access_roles WHERE role_id = $1', [id]);
        if (check.rows[0]?.is_system) {
            return res.status(403).json({ success: false, error: 'System roles cannot be modified' });
        }

        const { rows } = await db.query(
            `UPDATE access_roles 
             SET role_name = $1, permissions = $2, updated_at = NOW()
             WHERE role_id = $3 AND business_id = $4
             RETURNING *`,
            [role_name, JSON.stringify(permissions), id, business_id]
        );
        
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Role not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. DELETE /api/access/roles/:id
router.delete('/roles/:id', auth, rbac('Admin'), async (req, res) => {
    try {
        const { business_id } = req.user;
        const { id } = req.params;

        const check = await db.query('SELECT is_system FROM access_roles WHERE role_id = $1', [id]);
        if (check.rows[0]?.is_system) {
            return res.status(403).json({ success: false, error: 'System roles cannot be deleted' });
        }

        await db.query('DELETE FROM access_roles WHERE role_id = $1 AND business_id = $2', [id, business_id]);
        res.json({ success: true, message: 'Role deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
