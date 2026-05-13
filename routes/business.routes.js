// routes/business.routes.js — Multi-business management (Super Admin / Admin)
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// GET /api/business — List all businesses (Admin only)
router.get('/', auth, rbac('Admin'), async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM business ORDER BY created_at DESC`);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/business/me — Get current business details
router.get('/me', auth, async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM business WHERE business_id = $1`, [req.user.business_id]);
        res.json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/business — Create new business
router.post('/', auth, rbac('Admin'), async (req, res) => {
    const { business_name, owner_name, mobile_number, email, city, state, active_status, logo_url, pan_no, gstin_main, subscription_tier } = req.body;
    const business_id = `biz_${Date.now()}`;
    try {
        await db.query(
            `INSERT INTO business (business_id, business_name, owner_name, mobile_number, email, city, state, active_status, logo_url, pan_no, gstin_main, subscription_tier) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                business_id, 
                business_name || '', 
                owner_name || '', 
                mobile_number || '', 
                email || '', 
                city || '', 
                state || '', 
                active_status !== undefined ? active_status : true, 
                logo_url || '', 
                pan_no || '', 
                gstin_main || '', 
                subscription_tier || 'Basic'
            ]
        );
        res.status(201).json({ success: true, business_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/business/:id — Update business details
router.put('/:id', auth, rbac('Admin'), async (req, res) => {
    const { business_name, owner_name, mobile_number, email, city, state, pincode, active_status, logo_url, favicon_url, pan_no, gstin_main, subscription_tier, social_links } = req.body;
    try {
        // Auto-migrate database column if needed
        try { await db.query(`ALTER TABLE business ADD COLUMN IF NOT EXISTS social_links JSONB`); } catch (e) {}

        const socialPayload = social_links ? JSON.stringify(social_links) : null;

        await db.query(
            `UPDATE business SET 
                business_name=COALESCE($1, business_name), 
                owner_name=COALESCE($2, owner_name), 
                mobile_number=COALESCE($3, mobile_number), 
                email=COALESCE($4, email), 
                city=COALESCE($5, city), 
                state=COALESCE($6, state), 
                pincode=COALESCE($7, pincode), 
                active_status=COALESCE($8, active_status), 
                logo_url=COALESCE($9, logo_url), 
                favicon_url=COALESCE($10, favicon_url), 
                pan_no=COALESCE($11, pan_no), 
                gstin_main=COALESCE($12, gstin_main), 
                subscription_tier=COALESCE($13, subscription_tier), 
                social_links=COALESCE($14, social_links),
                updated_at=NOW() 
             WHERE business_id=$15`,
            [
                business_name || null, 
                owner_name || null, 
                mobile_number || null, 
                email || null, 
                city || null, 
                state || null, 
                pincode || null, 
                active_status !== undefined ? active_status : null, 
                logo_url || null, 
                favicon_url || null, 
                pan_no || null, 
                gstin_main || null, 
                subscription_tier || null, 
                socialPayload,
                req.params.id
            ]
        );

        // Also broadcast update direct to Supabase for synchronized cluster state
        try {
            const supabase = require('../supabase_client');
            const updateObj = {};
            if (business_name) updateObj.business_name = business_name;
            if (owner_name) updateObj.owner_name = owner_name;
            if (mobile_number) updateObj.mobile_number = mobile_number;
            if (email) updateObj.email = email;
            if (logo_url) updateObj.logo_url = logo_url;
            if (favicon_url) updateObj.favicon_url = favicon_url;
            if (social_links) updateObj.social_links = social_links;
            await supabase.from('business').update(updateObj).eq('business_id', req.params.id);
        } catch(e){}

        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
