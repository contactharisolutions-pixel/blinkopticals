// routes/invoices.routes.js — Enterprise Invoice & Returns/Shrinkage Engine
'use strict';

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const db      = require('../db');

// ── 1. INVOICES MANAGEMENT LISTING ──────────────────────────────────────────
router.get('/', auth, async (req, res) => {
    const { type, showroom_id, search, from_date, to_date } = req.query;
    const biz = req.query.business_id || req.user.business_id;
    const supabase = require('../supabase_client');

    try {
        let q = supabase.from('customer_order').select('*').eq('business_id', biz);

        if (showroom_id) {
            q = q.eq('showroom_id', showroom_id);
        }
        if (type === 'POS') {
            q = q.eq('order_type', 'POS');
        } else if (type === 'Ecommerce') {
            q = q.eq('order_type', 'online');
        }

        const { data: orders, error } = await q.order('created_at', { ascending: false }).limit(200);
        if (error) throw new Error(error.message);

        // Enrich customer & showroom data
        const custIds = [...new Set((orders || []).map(o => o.customer_id).filter(Boolean))];
        let custMap = {};
        if (custIds.length) {
            const { data: custs } = await supabase.from('customer').select('customer_id,name,mobile').in('customer_id', custIds);
            custMap = Object.fromEntries((custs || []).map(c => [c.customer_id, c]));
        }

        const { data: showrooms } = await supabase.from('showroom').select('showroom_id,showroom_name').eq('business_id', biz);
        const showroomMap = Object.fromEntries((showrooms || []).map(s => [s.showroom_id, s.showroom_name]));

        let rows = (orders || []).map(o => {
            const computedInv = o.invoice_number || `INV-${new Date(o.created_at || Date.now()).getFullYear()}-${(o.order_id || '').slice(-6)}`;
            return {
                ...o,
                invoice_number:  computedInv,
                customer_name:   custMap[o.customer_id]?.name   || o.customer_name || 'Walk-in',
                customer_mobile: custMap[o.customer_id]?.mobile || o.customer_mobile || '',
                showroom_name:   showroomMap[o.showroom_id]     || 'Central Showroom'
            };
        });

        // Search text matching
        if (search) {
            const term = search.toLowerCase().trim();
            rows = rows.filter(o => 
                (o.invoice_number || '').toLowerCase().includes(term) ||
                (o.order_id       || '').toLowerCase().includes(term) ||
                (o.customer_name  || '').toLowerCase().includes(term) ||
                (o.customer_mobile|| '').toLowerCase().includes(term)
            );
        }

        // Date boundaries
        if (from_date) {
            rows = rows.filter(o => new Date(o.created_at) >= new Date(from_date));
        }
        if (to_date) {
            rows = rows.filter(o => new Date(o.created_at) <= new Date(to_date + 'T23:59:59Z'));
        }

        res.json({ success: true, data: rows, total: rows.length });
    } catch (err) {
        console.error('[invoices get error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


// ── 2. RETURN FROM CUSTOMER MANAGEMENT ─────────────────────────────────────
router.post('/return-customer', auth, rbac('Admin', 'Manager', 'Showroom Manager'), async (req, res) => {
    const { invoice_number, items, refund_amount, payment_mode, notes } = req.body;
    const biz = req.user.business_id;
    const supabase = require('../supabase_client');

    try {
        // Resolve target order ID cleanly without hitting non-existent SQL schema indexes
        const isInvString = invoice_number && invoice_number.startsWith('INV-');
        let order = null;

        if (isInvString) {
            const { data: allOrds } = await supabase.from('customer_order').select('*').eq('business_id', biz).limit(500);
            order = (allOrds || []).find(o => {
                const comp = o.invoice_number || `INV-${new Date(o.created_at || Date.now()).getFullYear()}-${(o.order_id || '').slice(-6)}`;
                return comp.toLowerCase() === invoice_number.toLowerCase();
            });
        } else {
            const { data: ordById } = await supabase.from('customer_order').select('*').eq('order_id', invoice_number).eq('business_id', biz).limit(1);
            order = ordById?.[0];
        }
        
        if (!order) return res.status(404).json({ success: false, error: 'Target invoice record not found' });

        // Process refund transaction log if negative sum specified
        const rAmt = parseFloat(refund_amount || 0);
        if (rAmt > 0) {
            await supabase.from('payment').insert({
                payment_id:   `ret_refund_${Date.now()}`,
                order_id:     order.order_id,
                business_id:  biz,
                amount:       -rAmt,
                payment_mode: payment_mode || 'Original Mode',
                status:       'refunded',
                notes:        `Customer Goods Return Against Invoice: ${invoice_number}. Notes: ${notes || ''}`
            });

            // Recalculate remaining amounts
            const currentPaid = parseFloat(order.total_paid || order.total_amount || 0);
            await supabase.from('customer_order').update({
                total_paid: Math.max(0, currentPaid - rAmt),
                order_status: 'Returned / Refunded'
            }).eq('order_id', order.order_id);
        }

        // Audit availability inventory counts loop
        for (const it of (items || [])) {
            const qty = parseInt(it.return_qty || 1);
            if (it.variant_id && order.showroom_id) {
                // Perform postgres direct increment via pg pool for bulletproof locking
                await db.query(
                    `UPDATE inventory SET available_qty = available_qty + $1, last_updated = NOW() 
                     WHERE variant_id = $2 AND showroom_id = $3`,
                    [qty, it.variant_id, order.showroom_id]
                );

                // Insert stock auditing trail record
                await db.query(
                    `INSERT INTO stock_movement (movement_id, business_id, product_id, variant_id, from_location, quantity, movement_type)
                     VALUES ($1, $2, $3, $4, $5, $6, 'Customer Return')`,
                    [`smv_ret_${Date.now()}_${Math.random().toString(36).slice(2,5)}`, biz, it.product_id || null, it.variant_id, order.showroom_id, qty]
                );
            }
        }

        res.json({ success: true, message: 'Return audit record and financial refund sleep executed successfully' });
    } catch (err) {
        console.error('[customer return error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


// ── 3. RETURN TO VENDOR MANAGEMENT ─────────────────────────────────────────
router.post('/return-vendor', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { purchase_id, items, credit_note_ref, return_reason } = req.body;
    const biz = req.user.business_id;

    try {
        await db.query('BEGIN');

        // Fetch source purchase order info
        const poRes = await db.query('SELECT * FROM purchase_orders WHERE purchase_id = $1 AND business_id = $2', [purchase_id, biz]);
        if (!poRes.rows.length) throw new Error('Source Purchase Order ID could not be found');
        const po = poRes.rows[0];

        let deductedCost = 0;

        for (const it of (items || [])) {
            const qty = parseInt(it.return_qty || 1);
            const cost = parseFloat(it.unit_cost || 0);
            deductedCost += (qty * cost);

            if (it.variant_id && po.showroom_id) {
                // Deduct from localized inventory availability
                await db.query(
                    `UPDATE inventory SET available_qty = GREATEST(0, available_qty - $1), last_updated = NOW()
                     WHERE variant_id = $2 AND showroom_id = $3`,
                    [qty, it.variant_id, po.showroom_id]
                );

                // Add stock audit sequence
                await db.query(
                    `INSERT INTO stock_movement (movement_id, business_id, product_id, variant_id, from_location, quantity, movement_type)
                     VALUES ($1, $2, $3, $4, $5, $6, 'Vendor Return')`,
                    [`smv_vnd_${Date.now()}_${Math.random().toString(36).slice(2,5)}`, biz, it.product_id || null, it.variant_id, po.showroom_id, qty]
                );
            }
        }

        // Add note indicating credit memo mapping
        const appendedNote = `${po.notes || ''} | [Vendor Return: ${credit_note_ref || 'Credit Memo'} - Deducted ₹${deductedCost} for: ${return_reason || 'RTV'}]`;
        await db.query('UPDATE purchase_orders SET notes = $1 WHERE purchase_id = $2', [appendedNote, purchase_id]);

        await db.query('COMMIT');
        res.json({ success: true, message: 'Vendor Return goods registered and inventory counts debited cleanly' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('[vendor return error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


// ── 4. DAMAGED GOODS MANAGEMENT ────────────────────────────────────────────
router.post('/damaged-goods', auth, rbac('Admin', 'Manager', 'Showroom Manager'), async (req, res) => {
    const { showroom_id, variant_id, damaged_qty, damage_reason } = req.body;
    const biz = req.user.business_id;

    try {
        const qty = parseInt(damaged_qty || 1);
        if (qty <= 0) return res.status(400).json({ success: false, error: 'Damaged quantity must be positive' });

        // Update inventory availability decrement and update damaged accumulator counter
        const r = await db.query(
            `UPDATE inventory 
             SET available_qty = GREATEST(0, available_qty - $1), 
                 damaged_qty   = COALESCE(damaged_qty, 0) + $1,
                 last_updated  = NOW()
             WHERE variant_id = $2 AND showroom_id = $3
             RETURNING product_id`,
            [qty, variant_id, showroom_id]
        );

        const prodId = r.rows[0]?.product_id || null;

        // Add structural audit record trace mapping
        await db.query(
            `INSERT INTO stock_movement (movement_id, business_id, product_id, variant_id, from_location, quantity, movement_type)
             VALUES ($1, $2, $3, $4, $5, $6, 'Damage')`,
            [`smv_dmg_${Date.now()}`, biz, prodId, variant_id, showroom_id, qty]
        );

        res.json({ success: true, message: 'Damaged clinical item reported and dispensing available counts adjusted' });
    } catch (err) {
        console.error('[damaged goods error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


// GET /api/invoices/damaged-list — Fetch reported damage logs
router.get('/damaged-list', auth, async (req, res) => {
    const biz = req.query.business_id || req.user.business_id;
    try {
        const { rows } = await db.query(
            `SELECT sm.*, p.product_name, v.sku, s.showroom_name
             FROM stock_movement sm
             LEFT JOIN product p ON sm.product_id = p.product_id
             LEFT JOIN variant v ON sm.variant_id = v.variant_id
             LEFT JOIN showroom s ON sm.from_location = s.showroom_id
             WHERE sm.business_id = $1 AND sm.movement_type = 'Damage'
             ORDER BY sm.created_at DESC LIMIT 100`,
            [biz]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[damaged list error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
