// routes/email.routes.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');
const db = require('../db');

/**
 * Dynamically fetch SMTP settings from DB or ENV fallback
 */
async function getTransporter(business_id) {
    try {
        const { rows } = await db.query(
            'SELECT setting_value FROM business_settings WHERE business_id = $1 AND setting_key = $2',
            [business_id || 'biz_blink_001', 'email_sender']
        );

        let config = rows[0]?.setting_value;
        if (typeof config === 'string') config = JSON.parse(config);

        if (config && config.smtp_server) {
            return nodemailer.createTransport({
                host: config.smtp_server,
                port: parseInt(config.smtp_port),
                secure: config.use_tls,
                auth: {
                    user: config.smtp_user,
                    pass: config.smtp_password
                }
            });
        }
    } catch (e) {
        console.warn('[email] Failed to load DB config, using ENV fallback');
    }

    // Fallback to ENV variables
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

// POST /api/email/send
router.post('/send', auth, async (req, res) => {
    const { to, subject, html, text } = req.body;
    if (!to || !subject || !html)
        return res.status(400).json({ success: false, error: 'to, subject, and html are required' });

    try {
        const transporter = await getTransporter(req.user?.business_id);
        const info = await transporter.sendMail({
            from: `"BlinkOpticals" <${process.env.SMTP_USER}>`,
            to, subject, html, text
        });
        res.json({ success: true, messageId: info.messageId });
    } catch (err) {
        console.error('[email error]', err.message);
        res.status(502).json({ success: false, error: 'Email delivery failed' });
    }
});

// POST /api/email/invoice — send order invoice email
router.post('/invoice', auth, async (req, res) => {
    const { to, customer_name, invoice_number, items, total_amount, payment_status } = req.body;
    const itemRows = (items || []).map(i =>
        `<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>₹${i.unit_price}</td><td>₹${i.total_price}</td></tr>`
    ).join('');

    const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:30px;border:1px solid #eee">
      <h2 style="color:#000">BlinkOpticals Invoice</h2>
      <p>Dear ${customer_name}, thank you for your purchase!</p>
      <p><strong>Invoice #:</strong> ${invoice_number} &nbsp; <strong>Status:</strong> ${payment_status}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:20px">
        <thead>
          <tr style="background:#000;color:#fff">
            <th style="padding:10px;text-align:left">Product</th>
            <th>Qty</th><th>Price</th><th>Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="margin-top:20px;font-size:1.2rem"><strong>Total: ₹${total_amount}</strong></p>
      <hr/>
      <p style="color:#999;font-size:0.8rem">Visit us at blinkopticals.com</p>
    </div>`;

    try {
        const transporter = await getTransporter(req.user?.business_id);
        await transporter.sendMail({
            from: `"BlinkOpticals" <${process.env.SMTP_USER}>`,
            to, subject: `Invoice ${invoice_number} - BlinkOpticals`, html
        });
        res.json({ success: true });
    } catch (err) {
        res.status(502).json({ success: false, error: 'Invoice email failed' });
    }
});

// POST /api/email/verify-smtp
router.post('/verify-smtp', auth, async (req, res) => {
    const { smtp_server, smtp_port, smtp_user, smtp_password, use_tls } = req.body;
    
    if (!smtp_server || !smtp_user || !smtp_password) {
        return res.status(400).json({ success: false, error: 'Missing SMTP credentials' });
    }

    try {
        const testTransporter = nodemailer.createTransport({
            host: smtp_server,
            port: parseInt(smtp_port),
            secure: use_tls,
            auth: {
                user: smtp_user,
                pass: smtp_password
            },
            connectionTimeout: 5000 // 5 seconds timeout
        });

        await testTransporter.verify();
        res.json({ success: true, message: 'SMTP connection verified successfully' });
    } catch (err) {
        console.error('[smtp verify error]', err.message);
        res.status(401).json({ success: false, error: 'SMTP connection failed: ' + err.message });
    }
});

module.exports = router;
