// routes/tax.routes.js — Simplified Category-Based GST Logic
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// 1. POST — CALCULATE TAX ENGINE
// Input: { items: [{ product_id, price, qty }], customer_id, showroom_id }
router.post('/calculate', auth, async (req, res) => {
    try {
        const { items, customer_id, showroom_id } = req.body;
        const { business_id } = req.user;

        if (!items || !items.length) return res.json({ success: true, breakdown: [], total_tax: 0 });

        // 1. Determine inter-state for CGST/SGST vs IGST split
        const [showroomRes, customerRes] = await Promise.all([
            showroom_id ? db.query('SELECT state FROM showroom WHERE showroom_id = $1', [showroom_id]) : { rows: [] },
            customer_id ? db.query('SELECT state FROM customer WHERE customer_id = $1', [customer_id]) : { rows: [] }
        ]);

        const showroomState = showroomRes.rows[0]?.state || 'Gujarat';
        const customerState = customerRes.rows[0]?.state || showroomState;
        const isInterState = showroomState.toLowerCase() !== customerState.toLowerCase();

        // 2. Lookup GST rate per product from product table (fallback to category)
        const taxLookupQuery = `
            SELECT COALESCE(p.gst_rate, c.gst_rate, 12.00) as tax_percentage
            FROM product p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.product_id = $1 AND p.business_id = $2
        `;

        const results = [];
        let totalTax = 0;

        for (const item of items) {
            const taxRes = await db.query(taxLookupQuery, [item.product_id, business_id]);
            const taxPercent = parseFloat(taxRes.rows[0]?.tax_percentage ?? 12.00);

            const inclusivePrice = parseFloat(item.price) * parseInt(item.qty);
            // Inclusive GST calculation: TaxableValue = Total / (1 + Rate/100)
            const taxableValue = inclusivePrice / (1 + taxPercent / 100);
            const itemTaxTotal = parseFloat((inclusivePrice - taxableValue).toFixed(2));

            let cgst = 0, sgst = 0, igst = 0;
            if (isInterState) {
                igst = itemTaxTotal;
            } else {
                cgst = parseFloat((itemTaxTotal / 2).toFixed(2));
                sgst = parseFloat((itemTaxTotal / 2).toFixed(2));
            }

            results.push({
                product_id: item.product_id,
                tax_percent: taxPercent,
                taxable_value: parseFloat(taxableValue.toFixed(2)),
                cgst, sgst, igst,
                item_tax_total: itemTaxTotal
            });
            totalTax += itemTaxTotal;
        }

        res.json({
            success: true,
            is_inter_state: isInterState,
            breakdown: results,
            total_tax: parseFloat(totalTax.toFixed(2))
        });

    } catch (err) {
        console.error('[tax/calculate error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
