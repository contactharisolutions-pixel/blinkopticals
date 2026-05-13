// routes/clinic.routes.js — Eye Tests, Repairs, Appointments, Loyalty
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/ping', (req, res) => res.json({ success: true, message: 'Clinic API Online' }));

// GET /api/clinic/eye-tests — List eye tests with filters
router.get('/eye-tests', auth, async (req, res) => {
    const { customer_id, business_id, search, from_date, to_date, limit = 50, offset = 0 } = req.query;
    const conditions = ['et.business_id = $1'];
    const values = [business_id || req.user.business_id];
    let i = 2;

    if (customer_id) { conditions.push(`et.customer_id = $${i++}`); values.push(customer_id); }
    if (from_date) { conditions.push(`et.test_date >= $${i++}`); values.push(from_date); }
    if (to_date) { conditions.push(`et.test_date <= $${i++}`); values.push(to_date); }
    if (search) {
        conditions.push(`(c.name ILIKE $${i} OR c.mobile ILIKE $${i} OR et.doctor_name ILIKE $${i})`);
        values.push(`%${search}%`); i++;
    }

    try {
        const { rows } = await db.query(
            `SELECT et.*, c.name AS customer_name, c.mobile 
             FROM "eye_test" et 
             LEFT JOIN customer c ON et.customer_id = c.customer_id 
             WHERE ${conditions.join(' AND ')} 
             ORDER BY et.test_date DESC 
             LIMIT $${i} OFFSET $${i + 1}`,
            [...values, parseInt(limit), parseInt(offset)]
        );
        res.json({ success: true, data: rows });
    } catch (err) { 
        console.error(`[Clinic] GET /eye-tests Error:`, err);
        res.status(500).json({ success: false, error: err.message }); 
    }
});

// GET /api/clinic/eye-tests/kpis — Optometry Metrics
router.get('/eye-tests/kpis', auth, async (req, res) => {
    const business_id = req.query.business_id || req.user.business_id;
    console.log(`[Clinic] Fetching Eye Test KPIs for Biz: ${business_id}`);
    try {
        // Single query — proxy handler computes all KPIs in-memory
        const result = await db.query(
            `SELECT COUNT(*), COUNT(DISTINCT customer_id) FROM eye_test WHERE business_id = $1`,
            [business_id]
        );
        const row = result.rows[0] || {};
        const total   = parseInt(row.count || 0);
        const today   = parseInt(row.today || 0);
        const last30  = parseInt(row.last30 || 0);
        const unique  = parseInt(row.unique_patients || 0);

        res.json({
            success: true,
            data: {
                totalPatients:    unique  || total,
                today:            today,
                thisMonth:        last30
            }
        });
    } catch (err) {
        console.error(`[Clinic] Eye Test KPIs Error:`, err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/eye-tests', auth, async (req, res) => {
    const { 
        business_id, customer_id, doctor_name, 
        right_dv_sph, right_dv_cyl, right_dv_axis, right_dv_va, right_dv_add,
        right_nv_sph, right_nv_cyl, right_nv_axis, right_nv_va,
        left_dv_sph, left_dv_cyl, left_dv_axis, left_dv_va, left_dv_add,
        left_nv_sph, left_nv_cyl, left_nv_axis, left_nv_va,
        right_prism, right_pd, right_fh,
        left_prism, left_pd, left_fh,
        ipd, notes, prescription_for, test_id: req_test_id, test_date: req_test_date 
    } = req.body;
    
    if (!customer_id) return res.status(400).json({ success: false, error: 'customer_id required' });
    const test_id = req_test_id || `RX-${Date.now().toString().slice(-6)}`;
    const test_date = req_test_date || new Date().toISOString();
    const pFor = prescription_for || 'Glasses';
    
    try {
        await db.query(
            `INSERT INTO eye_test (
                test_id, business_id, customer_id, test_date, doctor_name, 
                right_dv_sph, right_dv_cyl, right_dv_axis, right_dv_va, right_dv_add,
                right_nv_sph, right_nv_cyl, right_nv_axis, right_nv_va,
                left_dv_sph, left_dv_cyl, left_dv_axis, left_dv_va, left_dv_add,
                left_nv_sph, left_nv_cyl, left_nv_axis, left_nv_va,
                right_prism, right_pd, right_fh,
                left_prism, left_pd, left_fh,
                ipd, notes, prescription_for
            )
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)`,
            [
                test_id, business_id, customer_id, test_date, doctor_name, 
                right_dv_sph, right_dv_cyl, right_dv_axis, right_dv_va, right_dv_add,
                right_nv_sph, right_nv_cyl, right_nv_axis, right_nv_va,
                left_dv_sph, left_dv_cyl, left_dv_axis, left_dv_va, left_dv_add,
                left_nv_sph, left_nv_cyl, left_nv_axis, left_nv_va,
                right_prism, right_pd, right_fh,
                left_prism, left_pd, left_fh,
                ipd, notes, pFor
            ]
        );

        // Trigger automated real-time communication notification
        setTimeout(async () => {
            let custData = { name: doctor_name || 'Patient', mobile: '', email: '' };
            if (customer_id) {
                const { rows: cRes } = await db.query('SELECT name,mobile,email FROM customer WHERE customer_id = $1 LIMIT 1', [customer_id]);
                if (cRes?.[0]) custData = cRes[0];
            }
            const comm = require('./communication.routes.js');
            if (typeof comm.dispatchNotification === 'function') {
                await comm.dispatchNotification(business_id, 'Prescription Ready', {
                    ...custData,
                    order_id: test_id,
                    customer_id
                });
            }
        }, 100);

        res.status(201).json({ success: true, test_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/eye-tests/:id', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT et.*, c.name AS customer_name, c.mobile 
             FROM "eye_test" et 
             LEFT JOIN customer c ON et.customer_id = c.customer_id 
             WHERE et.test_id = $1 AND et.business_id = $2`,
            [req.params.id, req.user.business_id]
        );
        if (!rows.length) return res.status(404).json({ success: false, error: 'Record not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/eye-tests/:id', auth, async (req, res) => {
    const { 
        customer_id, doctor_name, 
        right_dv_sph, right_dv_cyl, right_dv_axis, right_dv_va, right_dv_add,
        right_nv_sph, right_nv_cyl, right_nv_axis, right_nv_va,
        left_dv_sph, left_dv_cyl, left_dv_axis, left_dv_va, left_dv_add,
        left_nv_sph, left_nv_cyl, left_nv_axis, left_nv_va,
        right_prism, right_pd, right_fh,
        left_prism, left_pd, left_fh,
        ipd, notes, prescription_for, test_date 
    } = req.body;

    try {
        await db.query(
            `UPDATE eye_test SET 
                customer_id = $1, test_date = $2, doctor_name = $3,
                right_dv_sph = $4, right_dv_cyl = $5, right_dv_axis = $6, right_dv_va = $7, right_dv_add = $8,
                right_nv_sph = $9, right_nv_cyl = $10, right_nv_axis = $11, right_nv_va = $12,
                left_dv_sph = $13, left_dv_cyl = $14, left_dv_axis = $15, left_dv_va = $16, left_dv_add = $17,
                left_nv_sph = $18, left_nv_cyl = $19, left_nv_axis = $20, left_nv_va = $21,
                right_prism = $22, right_pd = $23, right_fh = $24,
                left_prism = $25, left_pd = $26, left_fh = $27,
                ipd = $28, notes = $29, prescription_for = $30
             WHERE test_id = $31 AND business_id = $32`,
            [
                customer_id, test_date || new Date().toISOString(), doctor_name,
                right_dv_sph, right_dv_cyl, right_dv_axis, right_dv_va, right_dv_add,
                right_nv_sph, right_nv_cyl, right_nv_axis, right_nv_va,
                left_dv_sph, left_dv_cyl, left_dv_axis, left_dv_va, left_dv_add,
                left_nv_sph, left_nv_cyl, left_nv_axis, left_nv_va,
                right_prism, right_pd, right_fh,
                left_prism, left_pd, left_fh,
                ipd, notes, prescription_for || 'Glasses',
                req.params.id, req.user.business_id
            ]
        );
        res.json({ success: true, message: 'Updated successfully' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/eye-tests/:id', auth, async (req, res) => {
    try {
        await db.query(`DELETE FROM eye_test WHERE test_id = $1 AND business_id = $2`, [req.params.id, req.user.business_id]);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/clinic/repairs — List repairs with advanced filters
router.get('/repairs', auth, async (req, res) => {
    const { business_id, status, search, limit = 50, offset = 0 } = req.query;
    const biz = business_id || req.user.business_id;
    try {
        const { rows } = await db.query(
            `SELECT * FROM repair WHERE business_id = $1 ORDER BY created_at DESC`,
            [biz]
        );
        let filtered = rows;
        if (status) filtered = filtered.filter(r => r.status === status);
        if (search) { const s = search.toLowerCase(); filtered = filtered.filter(r => (r.customer_name || '').toLowerCase().includes(s) || (r.repair_id || '').toLowerCase().includes(s)); }
        res.json({ success: true, data: filtered.slice(parseInt(offset), parseInt(offset) + parseInt(limit)) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/clinic/repairs/kpis — Repair Analytics
router.get('/repairs/kpis', auth, async (req, res) => {
    const business_id = req.query.business_id || req.user.business_id;
    try {
        const { rows } = await db.query(`SELECT * FROM repair WHERE business_id = $1`, [business_id]);
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
        const pending      = rows.filter(r => ['Received', 'In Progress'].includes(r.status)).length;
        const readyForPickup = rows.filter(r => r.status === 'Ready').length;
        const revenue30d   = rows.filter(r => r.status === 'Delivered' && new Date(r.created_at) >= cutoff).reduce((s, r) => s + (parseFloat(r.cost) || 0), 0);
        res.json({ success: true, data: { pending, readyForPickup, revenue30d } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/clinic/repairs — Create new ticket
router.post('/repairs', auth, async (req, res) => {
    const { business_id, customer_id, issue, repair_type, cost, showroom_id } = req.body;
    const repair_id = `REP-${Date.now().toString().slice(-6)}`;
    try {
        await db.query(
            `INSERT INTO "repair" (repair_id, business_id, customer_id, issue, repair_type, cost, status, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, 'Received', NOW())`,
            [repair_id, business_id || req.user.business_id, customer_id, issue, repair_type, cost]
        );
        res.status(201).json({ success: true, repair_id });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH /api/clinic/repairs/:id/status
router.patch('/repairs/:id/status', auth, async (req, res) => {
    const { status } = req.body;
    try {
        await db.query(`UPDATE "repair" SET status = $1 WHERE repair_id = $2`, [status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── APPOINTMENTS ──
router.get('/appointments', auth, async (req, res) => {
    const { business_id, showroom_id, from_date, to_date, status, search } = req.query;
    const conditions = ['a.business_id=$1'];
    const values = [business_id || req.user.business_id];
    let i = 2;
    
    if (showroom_id) { conditions.push(`a.showroom_id=$${i++}`); values.push(showroom_id); }
    if (status) { conditions.push(`a.status=$${i++}`); values.push(status); }
    if (from_date) { conditions.push(`a.appointment_date >= $${i++}`); values.push(from_date); }
    if (to_date) { conditions.push(`a.appointment_date <= $${i++}`); values.push(to_date); }
    if (search) { 
        conditions.push(`(c.name ILIKE $${i} OR c.mobile ILIKE $${i})`); 
        values.push(`%${search}%`); i++; 
    }

    try {
        const { rows } = await db.query(
            `SELECT a.*, c.name AS customer_name, c.mobile, s.name AS showroom_name 
             FROM appointment a 
             LEFT JOIN customer c ON a.customer_id=c.customer_id 
             LEFT JOIN showroom s ON a.showroom_id = s.showroom_id
             WHERE ${conditions.join(' AND ')} 
             ORDER BY a.appointment_date ASC`,
            values
        );
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/appointments/kpis', auth, async (req, res) => {
    const business_id = req.user.business_id;
    try {
        const [today, pending, completed] = await Promise.all([
            db.query(`SELECT COUNT(*) FROM appointment WHERE business_id=$1 AND appointment_date::date = CURRENT_DATE`, [business_id]),
            db.query(`SELECT COUNT(*) FROM appointment WHERE business_id=$1 AND status='Booked'`, [business_id]),
            db.query(`SELECT COUNT(*) FROM appointment WHERE business_id=$1 AND status='Completed' AND appointment_date::date = CURRENT_DATE`, [business_id])
        ]);
        res.json({
            success: true,
            data: {
                today: parseInt(today.rows[0].count),
                pending: parseInt(pending.rows[0].count),
                completedToday: parseInt(completed.rows[0].count)
            }
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/appointments', auth, async (req, res) => {
    const { business_id, customer_id, showroom_id, appointment_date, appointment_type, notes } = req.body;
    if (!customer_id || !showroom_id || !appointment_date) return res.status(400).json({ success: false, error: 'Incomplete data' });
    
    const appointment_id = `apt_${Date.now()}`;
    try {
        await db.query(
            `INSERT INTO appointment (appointment_id, business_id, customer_id, showroom_id, appointment_date, appointment_type, notes, status) 
             VALUES ($1,$2,$3,$4,$5,$6,$7,'Booked')`,
            [appointment_id, business_id || req.user.business_id, customer_id, showroom_id, appointment_date, appointment_type || 'Eye Test', notes]
        );

        // Trigger automated real-time communication notification
        setTimeout(async () => {
            let custData = { name: 'Valued Patron', mobile: '', email: '' };
            if (customer_id) {
                const { rows: cRes } = await db.query('SELECT name,mobile,email FROM customer WHERE customer_id = $1 LIMIT 1', [customer_id]);
                if (cRes?.[0]) custData = cRes[0];
            }
            const comm = require('./communication.routes.js');
            if (typeof comm.dispatchNotification === 'function') {
                await comm.dispatchNotification(business_id || 'DEFAULT_BIZ', 'Appointment Confirmed', {
                    ...custData,
                    order_id: appointment_id,
                    customer_id
                });
            }
        }, 100);

        res.status(201).json({ success: true, appointment_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch('/appointments/:id/status', auth, async (req, res) => {
    const { status } = req.body;
    try {
        await db.query(`UPDATE appointment SET status=$1 WHERE appointment_id=$2`, [status, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});


// ── LOYALTY ──
// GET /api/clinic/loyalty/kpis — Aggregate membership metrics
router.get('/loyalty/kpis', auth, async (req, res) => {
    const business_id = req.user.business_id;
    try {
                const supabase = require('../supabase_client');

        const { data: members } = await supabase.from('loyalty').select('tier,points').eq('business_id', business_id);
        const rows = members || [];

        const totalPoints  = rows.reduce((acc, r) => acc + (r.points || 0), 0);
        const totalMembers = rows.length;
        const tierMap = rows.reduce((acc, r) => { acc[r.tier] = (acc[r.tier] || 0) + 1; return acc; }, {});

        res.json({ success: true, data: { totalPoints, totalMembers, tiers: tierMap } });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/clinic/loyalty/members — Searchable membership list
router.get('/loyalty/members', auth, async (req, res) => {
    const { search, tier, limit = 50 } = req.query;
    const business_id = req.user.business_id;

    try {
                const supabase = require('../supabase_client');

        // Fetch loyalty rows and customers in parallel — no JOIN needed
        const [{ data: loyaltyRows }, { data: customers }] = await Promise.all([
            supabase.from('loyalty').select('*').eq('business_id', business_id).order('points', { ascending: false }),
            supabase.from('customer').select('customer_id,name,mobile,email').eq('business_id', business_id)
        ]);

        const cMap = Object.fromEntries((customers || []).map(c => [c.customer_id, c]));

        // Enrich loyalty rows with customer fields
        let rows = (loyaltyRows || []).map(l => ({
            ...l,
            customer_name: cMap[l.customer_id]?.name   || 'Unknown',
            mobile:        cMap[l.customer_id]?.mobile  || '—',
            email:         cMap[l.customer_id]?.email   || ''
        }));

        // JS-side filters
        if (tier && tier !== '')   rows = rows.filter(r => r.tier === tier);
        if (search && search !== '') {
            const t = search.toLowerCase();
            rows = rows.filter(r =>
                (r.customer_name || '').toLowerCase().includes(t) ||
                (r.mobile        || '').toLowerCase().includes(t)
            );
        }

        res.json({ success: true, data: rows.slice(0, parseInt(limit)), total: rows.length });
    } catch (err) {
        console.error('[loyalty/members error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/clinic/loyalty/adjust — Ledgered points adjustment
router.post('/loyalty/adjust', auth, async (req, res) => {
    const { customer_id, points_change, reason } = req.body;
    const business_id = req.user.business_id;

    if (!customer_id || points_change === undefined) return res.status(400).json({ success: false, error: 'Missing parameters' });

    try {
                const supabase = require('../supabase_client');

        // 1. Find or create loyalty record
        let { data: existing } = await supabase.from('loyalty').select('loyalty_id,points').eq('customer_id', customer_id).eq('business_id', business_id).single();

        if (!existing) {
            const newId = `loy_${Date.now()}`;
            await supabase.from('loyalty').insert({ loyalty_id: newId, business_id, customer_id, points: 0, tier: 'Silver' });
            const { data: fresh } = await supabase.from('loyalty').select('loyalty_id,points').eq('loyalty_id', newId).single();
            existing = fresh;
        }

        const loyalty_id = existing.loyalty_id;
        const new_points = Math.max(0, parseInt(existing.points) + parseInt(points_change));
        const tier = new_points >= 5000 ? 'Platinum' : new_points >= 2000 ? 'Gold' : 'Silver';

        // 2. Update balance and tier
        await supabase.from('loyalty').update({ points: new_points, tier }).eq('loyalty_id', loyalty_id);

        // 3. Record in ledger
        await supabase.from('loyalty_ledger').insert({
            loyalty_id,
            change_type:   points_change > 0 ? 'EARN' : 'REDEEM',
            points_change: parseInt(points_change),
            reason:        reason || 'Manual adjustment'
        });

        res.json({ success: true, new_balance: new_points, tier });
    } catch (err) {
        console.error('[loyalty/adjust error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/clinic/loyalty/ledger — Audit trail for a specific membership
router.get('/loyalty/ledger', auth, async (req, res) => {
    const { loyalty_id } = req.query;
    if (!loyalty_id) return res.status(400).json({ success: false, error: 'Loyalty ID required' });

    try {
        const { rows } = await db.query(
            `SELECT * FROM loyalty_ledger WHERE loyalty_id = $1 ORDER BY created_at DESC`,
            [loyalty_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});


module.exports = router;
