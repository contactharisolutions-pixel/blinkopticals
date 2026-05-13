// routes/chat.routes.js — AI Chatbot & Support Management Engine
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// Auto initialize required schemas deterministically
async function initChatSchema() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS chat_sessions (
                session_id VARCHAR(50) PRIMARY KEY,
                business_id VARCHAR(50) DEFAULT 'biz_blink_001',
                customer_name VARCHAR(255) DEFAULT 'Anonymous Visitor',
                customer_mobile VARCHAR(20),
                device_info TEXT,
                bot_active BOOLEAN DEFAULT TRUE,
                status VARCHAR(50) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                message_id VARCHAR(50) PRIMARY KEY,
                session_id VARCHAR(50) REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
                sender VARCHAR(50) CHECK (sender IN ('user', 'bot', 'agent')),
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS chatbot_knowledge (
                id SERIAL PRIMARY KEY,
                business_id VARCHAR(50) DEFAULT 'biz_blink_001',
                intent VARCHAR(100) NOT NULL,
                keywords TEXT NOT NULL,
                answer TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Seed elegant initial knowledge defaults if none found
        const { rows } = await db.query(`SELECT count(*) FROM chatbot_knowledge`);
        if (parseInt(rows[0].count) === 0) {
            const defaults = [
                ['greeting', 'hello,hi,hey,start', 'Welcome to BlinkOpticals exclusive virtual support hub! How can I assist you with our premium collection today?'],
                ['returns', 'return,refund,exchange,damaged', 'We offer an absolutely effortless 14-day exchange and refund timeline for all our designer frames. Prescription lenses are uniquely custom crafted and evaluated per visual requirement.'],
                ['location', 'store,location,address,where,visit', 'Our primary central showroom is fully equipped with state-of-the-art vision simulation labs located at City Light, Surat. Check our footer or Store Locations explorer for dynamic turn-by-turn routing maps!'],
                ['hours', 'hours,open,time,when', 'We are open today from 10:00 AM to 9:30 PM for high-fashion clinical optical fittings and certified professional guidance.']
            ];
            for (const [intent, keywords, answer] of defaults) {
                await db.query(`INSERT INTO chatbot_knowledge (intent, keywords, answer) VALUES ($1, $2, $3)`, [intent, keywords, answer]);
            }
        }
    } catch (e) { console.warn('[ChatBot Schema Sync Warning]', e.message); }
}

// Ensure init runs
initChatSchema();

// ─── PUBLIC CLIENT CHAT INTERFACE ───
// POST /api/chat/message — Process user message & auto-answer
router.post('/message', async (req, res) => {
    await initChatSchema();
    const { session_id, message, customer_name, customer_mobile } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'Message payload required' });

    const sid = session_id || `cs_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
    const msgText = message.trim().toLowerCase();

    try {
        // 1. Ensure Session exists
        let { rows: sRows } = await db.query(`SELECT * FROM chat_sessions WHERE session_id = $1`, [sid]);
        if (sRows.length === 0) {
            await db.query(
                `INSERT INTO chat_sessions (session_id, customer_name, customer_mobile, device_info, bot_active) VALUES ($1, $2, $3, $4, true)`,
                [sid, customer_name || 'Anonymous Visitor', customer_mobile || null, req.headers['user-agent'] || 'Web Browser']
            );
            sRows = [{ session_id: sid, bot_active: true }];
        }

        const session = sRows[0];

        // 2. Insert User Message
        const uMsgId = `cm_${Date.now()}_u`;
        await db.query(`INSERT INTO chat_messages (message_id, session_id, sender, message) VALUES ($1, $2, 'user', $3)`, [uMsgId, sid, message]);
        await db.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE session_id = $1`, [sid]);

        // 3. If Bot is handed off to human agent, simply return acknowledgment (no auto answer)
        if (!session.bot_active) {
            return res.json({ success: true, session_id: sid, reply: null, status: 'agent_active' });
        }

        // 4. Compute auto answer intent
        let replyText = null;

        // Intent logic A: Order Tracking Check
        if (msgText.includes('track') || msgText.includes('order') || msgText.includes('shipment')) {
            const orderMatch = msgText.match(/(?:ord_|pos_|\b\d{5,}\b)/i);
            let oRows = [];
            if (orderMatch) {
                const resOrd = await db.query(`SELECT * FROM customer_order WHERE order_id ILIKE $1 OR invoice_number ILIKE $1 LIMIT 1`, [`%${orderMatch[0]}%`]);
                oRows = resOrd.rows;
            } else if (customer_mobile || session.customer_mobile) {
                const mob = customer_mobile || session.customer_mobile;
                const resOrd = await db.query(`SELECT * FROM customer_order WHERE customer_id IN (SELECT customer_id FROM customer WHERE mobile LIKE $1) ORDER BY created_at DESC LIMIT 1`, [`%${mob}%`]);
                oRows = resOrd.rows;
            }

            if (oRows.length > 0) {
                const o = oRows[0];
                replyText = `📦 **Order Tracking Details Found:**\n• **Order ID**: ${o.order_id}\n• **Status**: ${o.order_status || 'Processing'}\n• **Total Amount**: ₹${o.total_amount}\n• **Payment**: ${o.payment_status || 'Paid'}\nYour customized package is actively monitored by our multi-store fulfillment queues.`;
            } else {
                replyText = `We couldn't instantly retrieve an active tracking matrix for that input. Please provide your exact **Order ID** or associated **Mobile Number** to look up dispatch telemetry.`;
            }
        } 
        // Intent logic B: Live Escalation Request
        else if (msgText.includes('agent') || msgText.includes('human') || msgText.includes('staff') || msgText.includes('operator')) {
            await db.query(`UPDATE chat_sessions SET bot_active = false WHERE session_id = $1`, [sid]);
            replyText = `🤖 **Escalating to Certified Human Agent:**\nI have successfully routed your live context buffer to our primary support queue. An expert staff member will respond to you right here shortly!`;
        }
        // Intent logic C: Retrieve from Knowledge Base Matches
        else {
            const { rows: kRows } = await db.query(`SELECT * FROM chatbot_knowledge`);
            for (const k of kRows) {
                const kwds = k.keywords.split(',').map(x => x.trim().toLowerCase());
                if (kwds.some(w => w.length > 2 && msgText.includes(w))) {
                    replyText = k.answer;
                    break;
                }
            }
            if (!replyText) {
                replyText = `Thank you for sharing with BlinkOpticals. Our certified automated engine is parsing your request. Would you like me to instantly route this query to a live human consultant?`;
            }
        }

        // 5. Insert Bot Message Reply
        const bMsgId = `cm_${Date.now()}_b`;
        await db.query(`INSERT INTO chat_messages (message_id, session_id, sender, message) VALUES ($1, $2, 'bot', $3)`, [bMsgId, sid, replyText]);

        res.json({ success: true, session_id: sid, reply: replyText, status: 'bot_answered' });
    } catch (err) { console.error('[Chat Message Processing Error]', err); res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/chat/history/:sessionId — Load full session threads for client/admin
router.get('/history/:sessionId', async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`, [req.params.sessionId]);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── ADMIN MANAGEMENT CONTROLS ───
// GET /api/chat/sessions — List all active sessions
router.get('/sessions', auth, async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT s.*, 
                   (SELECT message FROM chat_messages m WHERE m.session_id = s.session_id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                   (SELECT count(*) FROM chat_messages m WHERE m.session_id = s.session_id) as message_count
            FROM chat_sessions s 
            ORDER BY s.updated_at DESC LIMIT 200
        `);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/chat/reply — Agent manual response override
router.post('/reply', auth, async (req, res) => {
    const { session_id, message } = req.body;
    if (!session_id || !message) return res.status(400).json({ success: false, error: 'Parameters missing' });
    try {
        const msgId = `cm_${Date.now()}_a`;
        await db.query(`INSERT INTO chat_messages (message_id, session_id, sender, message) VALUES ($1, $2, 'agent', $3)`, [msgId, session_id, message]);
        // Lock out bot auto answers to preserve human consistency
        await db.query(`UPDATE chat_sessions SET bot_active = false, updated_at = NOW() WHERE session_id = $1`, [session_id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/chat/session/:sessionId/toggle-bot — Toggle manual vs bot routing
router.put('/session/:sessionId/toggle-bot', auth, async (req, res) => {
    const { bot_active } = req.body;
    try {
        await db.query(`UPDATE chat_sessions SET bot_active = $1 WHERE session_id = $2`, [bot_active === true, req.params.sessionId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Knowledge Base REST
router.get('/knowledge', auth, async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM chatbot_knowledge ORDER BY id ASC`);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/knowledge', auth, async (req, res) => {
    const { intent, keywords, answer } = req.body;
    try {
        await db.query(`INSERT INTO chatbot_knowledge (intent, keywords, answer) VALUES ($1, $2, $3)`, [intent || 'custom', keywords || '', answer || '']);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/knowledge/:id', auth, async (req, res) => {
    const { intent, keywords, answer } = req.body;
    try {
        await db.query(`UPDATE chatbot_knowledge SET intent=$1, keywords=$2, answer=$3 WHERE id=$4`, [intent, keywords, answer, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/knowledge/:id', auth, async (req, res) => {
    try {
        await db.query(`DELETE FROM chatbot_knowledge WHERE id=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
