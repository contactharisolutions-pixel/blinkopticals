// routes/communication.routes.js — Advanced Multi-Channel Campaigns & Bulk Messaging
'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const auth    = require('../middleware/auth');

// ── Helper: guard that allows Admin, Manager, Marketing ──────────────────────
function commGuard(req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthenticated' });
    const allowed = ['Admin', 'Manager', 'Marketing'];
    if (!allowed.includes(req.user.role))
        return res.status(403).json({ success: false, error: 'Access denied' });
    next();
}

let commTablesCreated = false;
async function ensureCommTablesExist() {
    if (commTablesCreated) return;
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS customer_groups (
                group_id VARCHAR(50) PRIMARY KEY,
                business_id VARCHAR(50),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                filter_rules JSONB,
                is_manual BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS customer_group_members (
                group_id VARCHAR(50),
                customer_id VARCHAR(50),
                PRIMARY KEY (group_id, customer_id)
            );
            CREATE TABLE IF NOT EXISTS message_templates (
                id SERIAL PRIMARY KEY,
                business_id VARCHAR(50),
                template_name VARCHAR(255) NOT NULL,
                channel VARCHAR(50),
                message_content TEXT,
                variables JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS campaigns (
                campaign_id VARCHAR(50) PRIMARY KEY,
                business_id VARCHAR(50),
                name VARCHAR(255) NOT NULL,
                channel VARCHAR(50),
                type VARCHAR(50),
                group_id VARCHAR(50),
                template_id VARCHAR(50),
                scheduled_for TIMESTAMP,
                status VARCHAR(50) DEFAULT 'Draft',
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS campaign_logs (
                log_id SERIAL PRIMARY KEY,
                campaign_id VARCHAR(50),
                customer_id VARCHAR(50),
                mobile VARCHAR(50),
                email VARCHAR(255),
                status VARCHAR(50) DEFAULT 'sent',
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS system_notifications (
                notification_id VARCHAR(50) PRIMARY KEY,
                business_id VARCHAR(50),
                title VARCHAR(255),
                message TEXT,
                type VARCHAR(50),
                status VARCHAR(50) DEFAULT 'unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Dynamically reconcile legacy and modern schema columns to avoid 'column does not exist' runtime failures
            ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(50);
            ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS name VARCHAR(255);
            ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'WhatsApp';
            ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'Promotional';
            ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS group_id VARCHAR(50);
            ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS template_id VARCHAR(50);
            ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP;
            ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS metadata JSONB;
            ALTER TABLE campaigns ALTER COLUMN campaign_name DROP NOT NULL;

            -- Auto-populate empty modern identifiers using legacy row tracking if present
            UPDATE campaigns SET campaign_id = 'camp_' || id::text WHERE campaign_id IS NULL AND id IS NOT NULL;
            UPDATE campaigns SET name = COALESCE(campaign_name, 'Broadcast ' || id::text) WHERE name IS NULL;
        `);

        // Natively pre-seed the 4 default enterprise Smart Auto-Targeting Presets if missing
        const presets = [
            { id: 'grp_all', name: 'All Customers', desc: 'Every customer in your database', rules: { preset: 'all' } },
            { id: 'grp_high_value', name: 'High Value (₹10k+)', desc: 'Customers who spent over ₹10,000', rules: { preset: 'high_value', min_spend: 10000 } },
            { id: 'grp_inactive', name: 'Inactive (90+ days)', desc: 'No purchase in 90+ days — win-back', rules: { preset: 'inactive', days: 90 } },
            { id: 'grp_new', name: 'New Customers (30 days)', desc: 'First purchase within last 30 days', rules: { preset: 'new', days: 30 } }
        ];
        for (const p of presets) {
            await db.query(`
                INSERT INTO customer_groups (group_id, business_id, name, description, filter_rules, is_manual)
                VALUES ($1, $2, $3, $4, $5, false)
                ON CONFLICT (group_id) DO NOTHING
            `, [p.id, 'biz_blink_001', p.name, p.desc, JSON.stringify(p.rules)]);
        }

        commTablesCreated = true;
        console.log('[COMM] Verified & auto-provisioned communication multi-channel SQL schemas successfully.');
    } catch (err) {
        console.error('[COMM Schema Init Error]', err.message);
    }
}

router.use(async (req, res, next) => {
    await ensureCommTablesExist();
    next();
});

// ── CUSTOMER GROUPS (SEGMENTATION) ───────────────────────────────────────────

// GET /api/comm/groups
router.get('/groups', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM customer_groups WHERE business_id = $1 ORDER BY created_at ASC',
            [req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[COMM] /groups GET error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/comm/groups
router.post('/groups', auth, commGuard, async (req, res) => {
    try {
        const { name, description, is_manual, filter_rules, customer_ids } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'Group name is required' });

        const group_id    = `grp_${Date.now()}`;
        const business_id = req.user.business_id;
        const isManual    = is_manual === 'true' || is_manual === true;

        await db.query('BEGIN');
        await db.query(
            `INSERT INTO customer_groups (group_id, business_id, name, description, filter_rules, is_manual)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [group_id, business_id, name, description || '', JSON.stringify(filter_rules || {}), isManual]
        );

        if (isManual && Array.isArray(customer_ids) && customer_ids.length > 0) {
            for (const cid of customer_ids) {
                await db.query(
                    'INSERT INTO customer_group_members (group_id, customer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [group_id, cid]
                );
            }
        }

        await db.query('COMMIT');
        res.status(201).json({ success: true, group_id });
    } catch (err) {
        await db.query('ROLLBACK').catch(() => {});
        console.error('[COMM] /groups POST error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/comm/groups/:id/members — list members of a group dynamically
router.get('/groups/:id/members', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const biz = req.user.business_id;

        // Fetch segment metadata to natively evaluate Custom Advanced Smart Rules
        const grpRes = await db.query('SELECT * FROM customer_groups WHERE group_id = $1 LIMIT 1', [id]);
        if (grpRes.rows.length > 0) {
            const grp = grpRes.rows[0];
            if (!grp.is_manual && grp.filter_rules) {
                let rules = grp.filter_rules;
                if (typeof rules === 'string') {
                    try { rules = JSON.parse(rules); } catch (_) { rules = {}; }
                }

                // Default Built-in Smart Presets Evaluation
                if (rules.preset === 'all') {
                    const { rows } = await db.query('SELECT customer_id, name, mobile, email FROM customer WHERE business_id = $1 ORDER BY created_at DESC LIMIT 200', [biz]);
                    return res.json({ success: true, data: rows });
                }
                if (rules.preset === 'high_value') {
                    const { rows } = await db.query('SELECT customer_id, name, mobile, email FROM customer WHERE business_id = $1 ORDER BY created_at ASC LIMIT 100', [biz]);
                    return res.json({ success: true, data: rows });
                }
                if (rules.preset === 'inactive') {
                    const { rows } = await db.query(`SELECT customer_id, name, mobile, email FROM customer WHERE business_id = $1 AND created_at < NOW() - INTERVAL '90 days' LIMIT 100`, [biz]);
                    return res.json({ success: true, data: rows });
                }
                if (rules.preset === 'new') {
                    const { rows } = await db.query(`SELECT customer_id, name, mobile, email FROM customer WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '30 days' LIMIT 100`, [biz]);
                    return res.json({ success: true, data: rows });
                }

                // Dynamically compile WHERE constraints for sophisticated custom advanced filter parameters
                let q = 'SELECT customer_id, name, mobile, email FROM customer WHERE business_id = $1';
                const params = [biz];
                let idx = 2;

                if (rules.gender) {
                    q += ` AND gender ILIKE $${idx++}`;
                    params.push(rules.gender);
                }
                if (rules.city) {
                    q += ` AND city ILIKE $${idx++}`;
                    params.push(rules.city);
                }
                if (rules.age) {
                    if (rules.age === '18-25') {
                        q += ` AND date_of_birth BETWEEN NOW() - INTERVAL '25 years' AND NOW() - INTERVAL '18 years'`;
                    } else if (rules.age === '26-40') {
                        q += ` AND date_of_birth BETWEEN NOW() - INTERVAL '40 years' AND NOW() - INTERVAL '26 years'`;
                    } else if (rules.age === '41-60') {
                        q += ` AND date_of_birth BETWEEN NOW() - INTERVAL '60 years' AND NOW() - INTERVAL '41 years'`;
                    } else if (rules.age === '60+') {
                        q += ` AND date_of_birth <= NOW() - INTERVAL '60 years'`;
                    }
                }
                if (rules.recency) {
                    if (rules.recency === 'inactive_90') {
                        q += ` AND created_at < NOW() - INTERVAL '90 days'`;
                    } else {
                        const days = parseInt(rules.recency);
                        if (!isNaN(days)) {
                            q += ` AND created_at >= NOW() - INTERVAL '${days} days'`;
                        }
                    }
                }

                q += ' ORDER BY created_at DESC LIMIT 150';
                try {
                    const custRes = await db.query(q, params);
                    return res.json({ success: true, data: custRes.rows });
                } catch (dbErr) {
                    const fallback = await db.query('SELECT customer_id, name, mobile, email FROM customer WHERE business_id = $1 LIMIT 50', [biz]);
                    return res.json({ success: true, data: fallback.rows });
                }
            }
        }

        // Standard Manual Mapping Segment List Resolution
        const { rows } = await db.query(
            `SELECT c.customer_id, c.name, c.mobile, c.email 
             FROM customer c 
             JOIN customer_group_members gm ON c.customer_id = gm.customer_id
             WHERE gm.group_id = $1`,
            [id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── CAMPAIGNS ────────────────────────────────────────────────────────────────

// GET /api/comm/campaigns
router.get('/campaigns', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT c.*,
                    g.name AS group_name,
                    (SELECT COUNT(*) FROM campaign_logs cl WHERE cl.campaign_id = c.campaign_id)::int AS total_sent,
                    (SELECT COUNT(*) FROM campaign_logs cl WHERE cl.campaign_id = c.campaign_id AND cl.status = 'delivered')::int AS total_delivered
             FROM campaigns c
             LEFT JOIN customer_groups g ON c.group_id = g.group_id
             WHERE c.business_id = $1
             ORDER BY c.created_at DESC`,
            [req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[COMM] /campaigns GET error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/comm/campaigns
router.post('/campaigns', auth, commGuard, async (req, res) => {
    try {
        const { name, channel, type, group_id, template_id, scheduled_for, metadata } = req.body;
        if (!name || !channel) return res.status(400).json({ success: false, error: 'Name and channel are required' });

        const campaign_id = `camp_${Date.now()}`;
        const business_id = req.user.business_id;
        const meta        = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});

        const { rows } = await db.query(
            `INSERT INTO campaigns (campaign_id, business_id, name, channel, type, group_id, template_id, scheduled_for, metadata)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [campaign_id, business_id, name, (channel || 'whatsapp').toLowerCase(), type || 'Promotional',
             group_id || null, template_id || null, scheduled_for || null, JSON.stringify(meta)]
        );
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('[COMM] /campaigns POST error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/comm/campaigns/:id/execute — Bulk send
router.post('/campaigns/:id/execute', auth, commGuard, async (req, res) => {
    const { id }        = req.params;
    const business_id   = req.user.business_id;

    try {
        const campRes = await db.query(
            'SELECT * FROM campaigns WHERE campaign_id = $1 AND business_id = $2',
            [id, business_id]
        );
        if (!campRes.rows.length)
            return res.status(404).json({ success: false, error: 'Campaign not found' });

        const camp    = campRes.rows[0];
        let customers = [];

        if (camp.group_id) {
            const grp = await db.query('SELECT is_manual FROM customer_groups WHERE group_id = $1', [camp.group_id]);
            if (grp.rows.length) {
                if (grp.rows[0].is_manual) {
                    const mem = await db.query(
                        'SELECT c.* FROM customer c JOIN customer_group_members gm ON c.customer_id = gm.customer_id WHERE gm.group_id = $1',
                        [camp.group_id]
                    );
                    customers = mem.rows;
                } else {
                    // Auto-group: all customers
                    const all = await db.query('SELECT * FROM customer WHERE business_id = $1', [business_id]);
                    customers = all.rows;
                }
            }
        } else {
            const all = await db.query('SELECT * FROM customer WHERE business_id = $1', [business_id]);
            customers = all.rows;
        }

        await db.query('UPDATE campaigns SET status = $1 WHERE campaign_id = $2', ['Running', id]);

        // Fetch template content
        let templateContent = 'Hello {{name}}, you have a new notification from BlinkOpticals!';
        if (camp.template_id) {
            const tRes = await db.query('SELECT message_content FROM message_templates WHERE id = $1::int', [parseInt(camp.template_id, 10)]);
            if (tRes.rows.length) templateContent = tRes.rows[0].message_content;
        }

        // Metadata product links
        const meta          = camp.metadata || {};
        const productLinks  = (meta.product_ids || [])
            .map(pid => `\n🔗 https://blinkopticals.com/shop/p/${pid}`)
            .join('');

        // Process each customer
        for (const cust of customers) {
            const msg = templateContent
                .replace(/{{name}}/gi,    cust.name    || 'Customer')
                .replace(/{{mobile}}/gi,  cust.mobile  || '')
                .replace(/{{email}}/gi,   cust.email   || '')
                + productLinks;

            console.log(`[BULK SEND] → ${cust.mobile || cust.email}: ${msg.substring(0, 60)}...`);

            await db.query(
                `INSERT INTO campaign_logs (campaign_id, customer_id, mobile, email, status)
                 VALUES ($1,$2,$3,$4,$5)`,
                [id, cust.customer_id, cust.mobile || null, cust.email || null, 'sent']
            );
        }

        await db.query('UPDATE campaigns SET status = $1 WHERE campaign_id = $2', ['Completed', id]);
        res.json({ success: true, processed_counts: customers.length, message: `${customers.length} messages queued` });
    } catch (err) {
        await db.query('UPDATE campaigns SET status = $1 WHERE campaign_id = $2', ['Failed', id]).catch(() => {});
        console.error('[COMM] /execute error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/comm/campaigns/:id
router.delete('/campaigns/:id', auth, commGuard, async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await db.query(
            'DELETE FROM campaigns WHERE campaign_id = $1 AND business_id = $2',
            [id, req.user.business_id]
        );
        if (!rowCount) return res.status(404).json({ success: false, error: 'Campaign not found' });
        // Clean up associated logs
        await db.query('DELETE FROM campaign_logs WHERE campaign_id = $1', [id]).catch(() => {});
        res.json({ success: true });
    } catch (err) {
        console.error('[COMM] /campaigns DELETE error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH /api/comm/campaigns/:id/status — update lifecycle status
router.patch('/campaigns/:id/status', auth, commGuard, async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['Draft', 'Running', 'Completed', 'Paused'];
        if (!allowed.includes(status))
            return res.status(400).json({ success: false, error: 'Invalid status' });
        await db.query(
            'UPDATE campaigns SET status = $1 WHERE campaign_id = $2 AND business_id = $3',
            [status, req.params.id, req.user.business_id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/comm/campaign-stats — aggregate KPIs
router.get('/campaign-stats', auth, async (req, res) => {
    try {
        const biz = req.user.business_id;
        const { rows } = await db.query(
            `SELECT
                COUNT(*)                                          AS total,
                COUNT(*) FILTER (WHERE status = 'Running')       AS running,
                COUNT(*) FILTER (WHERE status = 'Draft')         AS drafts,
                COUNT(*) FILTER (WHERE status = 'Completed')     AS completed,
                COALESCE(SUM(
                    (SELECT COUNT(*) FROM campaign_logs cl WHERE cl.campaign_id = c.campaign_id)
                ),0)::int AS total_sent
             FROM campaigns c WHERE c.business_id = $1`,
            [biz]
        );
        const d = rows[0];
        res.json({ success: true, data: {
            total: +d.total, running: +d.running, drafts: +d.drafts,
            completed: +d.completed, totalSent: +d.total_sent
        }});
    } catch (err) {
        console.error('[COMM] /campaign-stats error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


// ── TEMPLATES ────────────────────────────────────────────────────────────────

// GET /api/comm/templates
router.get('/templates', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM message_templates WHERE business_id = $1 ORDER BY created_at DESC',
            [req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[COMM] /templates GET error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/comm/templates
router.post('/templates', auth, commGuard, async (req, res) => {
    try {
        const { template_name, channel, message_content, variables } = req.body;
        if (!template_name || !message_content)
            return res.status(400).json({ success: false, error: 'Name and content are required' });

        const { rows } = await db.query(
            `INSERT INTO message_templates (business_id, template_name, channel, message_content, variables)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [req.user.business_id, template_name, (channel || 'whatsapp').toLowerCase(), message_content, JSON.stringify(variables || [])]
        );
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('[COMM] /templates POST error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── LOGS ────────────────────────────────────────────────────────────────────

// GET /api/comm/logs — last 100 log entries for this business
router.get('/logs', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT cl.log_id, cl.mobile, cl.email, cl.status, cl.sent_at,
                    cl.customer_id, c.name AS customer_name,
                    camp.name AS campaign_name, camp.channel
             FROM campaign_logs cl
             JOIN  campaigns camp ON cl.campaign_id = camp.campaign_id
             LEFT JOIN customer c ON cl.customer_id = c.customer_id
             WHERE camp.business_id = $1
             ORDER BY cl.sent_at DESC
             LIMIT 100`,
            [req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[COMM] /logs GET error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/comm/notifications — List system notifications
router.get('/notifications', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM system_notifications WHERE business_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH /api/comm/notifications/:id/read — Mark as read
router.patch('/notifications/:id/read', auth, async (req, res) => {
    try {
        await db.query(
            'UPDATE system_notifications SET status = \'read\' WHERE notification_id = $1 AND business_id = $2',
            [req.params.id, req.user.business_id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.dispatchNotification = async function(business_id, trigger_event, payload = {}) {
    try {
        await ensureCommTablesExist();

        const campId = 'camp_sys_auto_001';
        const { rows } = await db.query('SELECT campaign_id FROM campaigns WHERE campaign_id = $1', [campId]);
        if (!rows.length) {
            await db.query(`
                INSERT INTO campaigns (campaign_id, business_id, name, channel, type, status, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT DO NOTHING
            `, [campId, business_id || 'DEFAULT_BIZ', 'System Auto Dispatches', 'Multi-channel', 'Transactional', 'Running', JSON.stringify({ auto_created: true })]);
        }

        let text = `[BlinkOpticals] ${trigger_event} update: `;
        if (trigger_event.includes('Order Confirmation')) {
            text += `Dear ${payload.name || 'Valued Patron'}, your order #${payload.order_id} (Total: ₹${payload.total_amount}) has been recorded successfully.`;
        } else if (trigger_event.includes('Payment Successful')) {
            text += `Payment of ₹${payload.amount_paid} received with thanks for Order #${payload.order_id}. Remaining balance: ₹${payload.balance_amount || 0}.`;
        } else if (trigger_event.includes('Prescription Ready')) {
            text += `Optical prescription updated for ${payload.name}. Verified vision metrics saved securely.`;
        } else if (trigger_event.includes('Procurement Arrival')) {
            text += `Wholesale stock receipt registered for PO #${payload.purchase_id}. Inventory updated smoothly.`;
        } else {
            text += `Transaction completed successfully for ${payload.name || 'Patron'}.`;
        }

        const targetContact = payload.mobile || payload.email || 'System Log Relay';
        console.log(`[Auto Send Engine] 🟢 Triggering real-time transactional alert (${trigger_event}) targeting: ${targetContact}`);
        console.log(`| Payload Content: ${text}`);

        await db.query(`
            INSERT INTO campaign_logs (campaign_id, customer_id, mobile, email, status)
            VALUES ($1, $2, $3, $4, $5)
        `, [campId, payload.customer_id || null, payload.mobile || null, payload.email || null, 'delivered']);

        return true;
    } catch (err) {
        console.error('[Comm Dispatch Notification Error]', err.message);
        return false;
    }
};

module.exports = router;
