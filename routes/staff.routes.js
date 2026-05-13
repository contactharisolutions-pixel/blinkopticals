// routes/staff.routes.js — ERP User/Staff Management
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// GET /api/staff
router.get('/', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { business_id } = req.query;
    const finalBizId = business_id || req.user.business_id;
    
    const sql = `SELECT 
                u.user_id, u.business_id, u.showroom_id, u.name, u.mobile, u.email, u.role, u.active_status, u.last_login, u.created_at,
                s.showroom_name 
             FROM app_user u 
             LEFT JOIN showroom s ON u.showroom_id = s.showroom_id 
             WHERE u.business_id = $1 
             ORDER BY u.created_at DESC`;

    try {
        console.log(`🔍 [Staff Query]: ${finalBizId}`);
        const { rows } = await db.query(sql, [finalBizId]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[Staff SQL Error]:', err.message);
        console.error('SQL State:', sql);
        res.json({ success: false, error: err.message });
    }
});

// POST /api/staff — Create staff account
router.post('/', auth, rbac('Admin'), async (req, res) => {
    let { business_id, showroom_id, name, mobile, email, role, password } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ success: false, error: 'name, email, role, password required' });
    
    // Normalize showroom_id (Global = null)
    if (showroom_id === '' || showroom_id === 'null') showroom_id = null;
    
    // Safety: Fallback to token business_id
    const finalBizId = business_id || req.user?.business_id;
    if (!finalBizId) return res.status(400).json({ success: false, error: 'Business context missing' });

    const user_id = `usr_${Date.now()}`;
    try {
        const password_hash = await bcrypt.hash(String(password), 12);
        await db.query(
            `INSERT INTO app_user (user_id, business_id, showroom_id, name, mobile, email, role, password_hash, active_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
            [
                user_id, 
                finalBizId, 
                showroom_id ?? null, 
                name, 
                mobile ?? '', 
                email, 
                role, 
                password_hash
            ]
        );
        res.status(201).json({ success: true, user_id });
    } catch (err) {
        console.error('[Staff POST Error]:', err.message);
        if (err.code === '23505') return res.status(409).json({ success: false, error: 'Email already in use' });
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/staff/:id
router.put('/:id', auth, rbac('Admin'), async (req, res) => {
    let { name, mobile, role, showroom_id, active_status } = req.body;
    
    // Normalize showroom_id (Global = null)
    if (showroom_id === '' || showroom_id === 'null') showroom_id = null;

    try {
        await db.query(
            `UPDATE app_user SET name=$1, mobile=$2, role=$3, showroom_id=$4, active_status=$5 WHERE user_id=$6`,
            [name, mobile, role, showroom_id, active_status, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH /api/staff/:id/reset-password
router.patch('/:id/reset-password', auth, rbac('Admin'), async (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, error: 'Password required' });
    const password_hash = await bcrypt.hash(password, 12);
    await db.query(`UPDATE app_user SET password_hash=$1 WHERE user_id=$2`, [password_hash, req.params.id]);
    res.json({ success: true });
});

// DELETE /api/staff/:id
router.delete('/:id', auth, rbac('Admin'), async (req, res) => {
    try {
        await db.query(`DELETE FROM app_user WHERE user_id=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
