const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ── VENDORS ──────────────────────────────────────────────────────────

router.get('/vendors', auth, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM vendors WHERE business_id = $1 ORDER BY name', [req.user.business_id]);
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/vendors', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { name, contact_person, mobile, email, gstin, address } = req.body;
    const vendor_id = `vnd_${Date.now()}`;
    try {
        await db.query(
            `INSERT INTO vendors (vendor_id, business_id, name, contact_person, mobile, email, gstin, address)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [vendor_id, req.user.business_id, name, contact_person, mobile, email, gstin, address]
        );
        res.json({ success: true, vendor_id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── PURCHASE ORDERS ───────────────────────────────────────────────────

router.get('/orders', auth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT po.*, v.name as vendor_name, v.gstin as vendor_gstin,
               (SELECT COUNT(*) FROM purchase_items WHERE purchase_id = po.purchase_id) as item_count,
               (SELECT COALESCE(SUM(gst_amount), 0) FROM purchase_items WHERE purchase_id = po.purchase_id) as total_gst,
               (po.total_amount + COALESCE((SELECT SUM(gst_amount) FROM purchase_items WHERE purchase_id = po.purchase_id), 0)) as final_amount
             FROM purchase_orders po 
             JOIN vendors v ON po.vendor_id = v.vendor_id 
             WHERE po.business_id = $1 ORDER BY po.order_date DESC`,
            [req.user.business_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/purchase/orders/:id — Fetch single PO with items (Universal lookup: PO#, barcode, model_no)
router.get('/orders/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const term = id.trim();
        
        let poRes = await db.query(
            `SELECT po.*, v.name as vendor_name, v.gstin as vendor_gstin 
             FROM purchase_orders po 
             LEFT JOIN vendors v ON po.vendor_id = v.vendor_id 
             WHERE po.purchase_id = $1 AND po.business_id = $2`, 
            [term, req.user.business_id]
        );
        
        if (!poRes.rows.length) {
            // Universal fallback: scan purchase items for matching barcode or model number
            poRes = await db.query(
                `SELECT po.*, v.name as vendor_name, v.gstin as vendor_gstin 
                 FROM purchase_orders po 
                 LEFT JOIN vendors v ON po.vendor_id = v.vendor_id 
                 JOIN purchase_items pi ON po.purchase_id = pi.purchase_id 
                 WHERE po.business_id = $1 AND (pi.barcode ILIKE $2 OR pi.model_no ILIKE $2)
                 ORDER BY po.order_date DESC LIMIT 1`,
                [req.user.business_id, `%${term}%`]
            );
        }
        
        if (!poRes.rows.length) return res.status(404).json({ success: false, error: 'Target procurement item/order not found' });
        
        const matchedPO = poRes.rows[0];
        const { rows: items } = await db.query('SELECT * FROM purchase_items WHERE purchase_id = $1', [matchedPO.purchase_id]);
        res.json({ success: true, data: { ...matchedPO, items } });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/purchase/orders — Create PO
router.post('/orders', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { vendor_id, items, showroom_id, notes } = req.body;
    const business_id = req.user.business_id;
    const purchase_id = `PO-${Date.now()}`;

    try {
        await db.query('BEGIN');
        
        let total = 0;
        for (let itm of items) {
            const qty = parseFloat(itm.quantity) || 0;
            const cost = parseFloat(itm.unit_cost) || 0;
            const disc = parseFloat(itm.discount_amount) || 0;
            total += Math.max(0, (qty * cost) - disc);
        }

        await db.query(
            `INSERT INTO purchase_orders (purchase_id, business_id, vendor_id, showroom_id, total_amount, status, notes)
             VALUES ($1, $2, $3, $4, $5, 'Draft', $6)`,
            [purchase_id, business_id, vendor_id, showroom_id, total, notes]
        );

        for (let itm of items) {
            await db.query(
                `INSERT INTO purchase_items (purchase_id, product_id, variant_id, quantity, unit_cost, total_amount, model_no, upc_code, description, gst_rate, gst_amount, barcode, category, shape, size, frame_color, frame_material, lens_material, lens_color, brand_id, gender, discount_amount, discount_percent)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
                [purchase_id, itm.product_id, itm.variant_id, itm.quantity, itm.unit_cost, itm.total_amount, itm.model_no, itm.upc_code, itm.description, itm.gst_rate, itm.gst_amount, itm.barcode, itm.category, itm.shape, itm.size, itm.frame_color, itm.frame_material, itm.lens_material, itm.lens_color, itm.brand_id, itm.gender, itm.discount_amount || 0, itm.discount_percent || 0]
            );
        }

        await db.query('COMMIT');
        res.json({ success: true, purchase_id });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/purchase/orders/:id — Update PO
router.put('/orders/:id', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { id } = req.params;
    const { vendor_id, items, showroom_id, notes, total_amount } = req.body;
    const business_id = req.user.business_id;

    try {
        await db.query('BEGIN');
        
        const { rows } = await db.query('SELECT status FROM purchase_orders WHERE purchase_id = $1 AND business_id = $2', [id, business_id]);
        if (!rows.length) throw new Error('Order not found');
        if (rows[0].status === 'Received') throw new Error('Received orders cannot be edited');

        await db.query(
            `UPDATE purchase_orders SET vendor_id = $1, showroom_id = $2, total_amount = $3, notes = $4
             WHERE purchase_id = $5 AND business_id = $6`,
            [vendor_id, showroom_id, total_amount, notes, id, business_id]
        );

        // Re-insert items
        await db.query('DELETE FROM purchase_items WHERE purchase_id = $1', [id]);
        for (let itm of items) {
            await db.query(
                `INSERT INTO purchase_items (purchase_id, product_id, variant_id, quantity, unit_cost, total_amount, model_no, upc_code, description, gst_rate, gst_amount, barcode, category, shape, size, frame_color, frame_material, lens_material, lens_color, brand_id, gender, discount_amount, discount_percent)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
                [id, itm.product_id, itm.variant_id, itm.quantity, itm.unit_cost, itm.total_amount, itm.model_no, itm.upc_code, itm.description, itm.gst_rate, itm.gst_amount, itm.barcode, itm.category, itm.shape, itm.size, itm.frame_color, itm.frame_material, itm.lens_material, itm.lens_color, itm.brand_id, itm.gender, itm.discount_amount || 0, itm.discount_percent || 0]
            );
        }

        await db.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/purchase/orders/:id/receive — Inward stock and update inventory
router.post('/orders/:id/receive', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { id: purchase_id } = req.params;
    const business_id = req.user.business_id;

    try {
        await db.query('BEGIN');

        // 1. Get PO Details
        const poRes = await db.query('SELECT * FROM purchase_orders WHERE purchase_id = $1 AND business_id = $2', [purchase_id, business_id]);
        if (!poRes.rows.length) throw new Error('Purchase Order not found');
        if (poRes.rows[0].status === 'Received') throw new Error('This order has already been received');
        
        const po = poRes.rows[0];
        const { rows: items } = await db.query('SELECT * FROM purchase_items WHERE purchase_id = $1', [purchase_id]);

        // 1.5 Fetch Master Data for resolution
        const [cats, shapes, mats, brands, genders] = await Promise.all([
            db.query('SELECT id, name FROM categories WHERE business_id = $1', [business_id]),
            db.query('SELECT id, name FROM shapes WHERE business_id = $1', [business_id]),
            db.query('SELECT id, name FROM materials WHERE business_id = $1', [business_id]),
            db.query('SELECT id, name FROM brands WHERE business_id = $1', [business_id]),
            db.query('SELECT id, name FROM genders WHERE business_id = $1', [business_id])
        ]);
        const resName = (arr, name) => name ? arr.find(x => x.name.toLowerCase() === name.toLowerCase())?.id : null;

        // 1.7 Fetch Prefix Rules
        const { rows: settingsRows } = await db.query(
            `SELECT setting_value FROM business_settings WHERE business_id = $1 AND setting_key = 'prefix_rules'`,
            [business_id]
        );
        const prefixRules = settingsRows.length ? settingsRows[0].setting_value : {};
        const barcodePrefix = prefixRules?.showroom_rules?.[po.showroom_id]?.barcode_prefix || prefixRules?.global_barcode_prefix || 'PUR';

        // 2. Process Items and Update Inventory
        let totalGst = 0;
        let totalBase = 0;

        for (let itm of items) {
            let pid = itm.product_id;
            let vid = itm.variant_id;

            const catId = resName(cats.rows, itm.category);
            const shapeId = resName(shapes.rows, itm.shape);
            const matId = resName(mats.rows, itm.frame_material);
            const brandId = resName(brands.rows, itm.brand_id) || itm.brand_id; // Try resolve or keep as-is
            const genderId = resName(genders.rows, itm.gender);

            // Resolve or Create Product if missing
            if (!pid) {
                const { rows: existingProds } = await db.query(
                    `SELECT product_id FROM product WHERE model_no = $1 AND brand_id = $2 AND business_id = $3 LIMIT 1`,
                    [itm.model_no, brandId, business_id]
                );
                if (existingProds.length > 0) {
                    pid = existingProds[0].product_id;
                } else {
                    pid = `prod_pur_${Date.now()}_${itm.item_id}`;
                    // Use a clean Brand + Model name instead of generic description
                    const brandName = brands.rows.find(b => b.id === brandId)?.name || itm.brand_id || 'Unknown Brand';
                    const finalName = `${brandName} ${itm.model_no}`.trim();
                    
                    await db.query(
                        `INSERT INTO product (product_id, business_id, product_name, model_no, description, is_published, active_status, gst_rate, mrp, selling_price, upc_code, category_id, shape_id, material_id, brand_id, gender_id)
                         VALUES ($1, $2, $3, $4, $5, false, false, $6, $7, $7, $8, $9, $10, $11, $12, $13)`,
                        [pid, business_id, finalName, itm.model_no, itm.description, itm.gst_rate || 0, itm.unit_cost, itm.barcode || itm.upc_code || null, catId, shapeId, matId, brandId, genderId]
                    );
                }
            }

            // Resolve or Create Variant if missing
            if (!vid) {
                const { rows: existingVars } = await db.query(
                    `SELECT variant_id FROM variant WHERE product_id = $1 AND color_code = $2 AND size_code = $3 LIMIT 1`,
                    [pid, itm.frame_color || '', itm.size || '']
                );
                if (existingVars.length > 0) {
                    vid = existingVars[0].variant_id;
                } else {
                    vid = `var_pur_${Date.now()}_${itm.item_id}`;
                    const sku = `${barcodePrefix}-${itm.model_no}-${itm.frame_color}-${Date.now()}`.replace(/--/g, '-').slice(0, 100);
                    await db.query(
                        `INSERT INTO variant (variant_id, product_id, color_code, size_code, barcode, sku)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [vid, pid, itm.frame_color || '', itm.size || '', itm.barcode, sku]
                    );
                }
            }

            // Update item with resolved IDs
            await db.query(`UPDATE purchase_items SET product_id = $1, variant_id = $2 WHERE item_id = $3`, [pid, vid, itm.item_id]);

            // Upsert Inventory
            const invId = `inv_pur_${Date.now()}_${itm.item_id}`;
            await db.query(
                `INSERT INTO inventory (inventory_id, business_id, product_id, variant_id, showroom_id, available_qty)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (business_id, variant_id, showroom_id) 
                 DO UPDATE SET available_qty = inventory.available_qty + $6`,
                [invId, business_id, pid, vid, po.showroom_id, itm.quantity]
            );

            totalBase += (itm.quantity * itm.unit_cost);
            totalGst += (itm.gst_amount || 0);
        }

        // 3. Update PO Status
        await db.query('UPDATE purchase_orders SET status = $1 WHERE purchase_id = $2', ['Received', purchase_id]);

        // 4. Accounting entry
        const journal_id = `jrnl_pur_${Date.now()}`;
        const finalTotal = totalBase + totalGst;

        await db.query(
            `INSERT INTO journal_entries (journal_id, business_id, date, reference_type, reference_id, total_amount, notes)
             VALUES ($1, $2, CURRENT_DATE, 'purchase', $3, $4, $5)`,
            [journal_id, business_id, purchase_id, finalTotal, `Stock Inward for PO: ${purchase_id}`]
        );
        
        // Debit Inventory (Asset)
        await db.query(`INSERT INTO journal_lines (journal_id, account_id, debit_amount, credit_amount) VALUES ($1, 'acc_inventory_001', $2, 0)`, [journal_id, totalBase]);
        
        // Debit GST Input (Asset/Reduction of Liability)
        if (totalGst > 0) {
            await db.query(`INSERT INTO journal_lines (journal_id, account_id, debit_amount, credit_amount) VALUES ($1, 'acc_gst_pay_001', $2, 0)`, [journal_id, totalGst]);
        }
        
        // Credit Accounts Payable (Liability)
        await db.query(`INSERT INTO journal_lines (journal_id, account_id, debit_amount, credit_amount) VALUES ($1, 'acc_creditors_001', 0, $2)`, [journal_id, finalTotal]);

        await db.query('COMMIT');

        // Trigger automated background wholesale inbound communication alert
        setTimeout(async () => {
            const comm = require('./communication.routes.js');
            if (typeof comm.dispatchNotification === 'function') {
                await comm.dispatchNotification(business_id, 'Procurement Arrival', {
                    name: po.vendor_name || 'Wholesale Supplier',
                    purchase_id,
                    total_amount: finalTotal
                });
            }
        }, 100);

        res.json({ success: true, message: 'Stock inwarded and inventory updated successfully' });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/purchase/orders/:id/print — Generate PDF Purchase Order
const PDFDocument = require('pdfkit');

router.get('/orders/:id/print', auth, async (req, res) => {
    const { id } = req.params;
    const business_id = req.user.business_id;

    try {
        // 1. Fetch data
        const poRes = await db.query(`
            SELECT po.*, v.name as vendor_name, v.address as vendor_address, v.gstin as vendor_gstin, v.mobile as vendor_mobile,
                   s.showroom_name, s.address as showroom_address, s.gstin as showroom_gstin,
                   b.logo_url, b.gstin_main as main_gstin, b.business_name as business_title
            FROM purchase_orders po
            JOIN vendors v ON po.vendor_id = v.vendor_id
            JOIN showroom s ON po.showroom_id = s.showroom_id
            JOIN business b ON po.business_id = b.business_id
            WHERE po.purchase_id = $1 AND po.business_id = $2
        `, [id, business_id]);

        if (!poRes.rows.length) return res.status(404).send('Purchase Order not found');
        const po = poRes.rows[0];

        const { rows: items } = await db.query(`
            SELECT pi.*, p.product_name, var.sku
            FROM purchase_items pi
            JOIN product p ON pi.product_id = p.product_id
            LEFT JOIN variant var ON pi.variant_id = var.variant_id
            WHERE pi.purchase_id = $1
        `, [id]);

        // 2. Create PDF
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=PO-${id}.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(20).text(po.business_title, { align: 'left' });
        doc.fontSize(10).text('Enterprise Optical Solutions', { align: 'left' });
        doc.moveDown();

        doc.fontSize(16).text('PURCHASE ORDER', { align: 'right' });
        doc.fontSize(10).text(`PO Number: ${po.purchase_id}`, { align: 'right' });
        doc.text(`Date: ${new Date(po.order_date).toLocaleDateString()}`, { align: 'right' });
        doc.text(`Status: ${po.status}`, { align: 'right' });
        doc.moveDown(2);

        const top = doc.y;
        // Vendor Info
        doc.fontSize(12).text('VENDOR:', 50, top, { underline: true });
        doc.fontSize(10).text(po.vendor_name);
        doc.text(po.vendor_address || 'N/A');
        doc.text(`GSTIN: ${po.vendor_gstin || 'N/A'}`);
        doc.text(`Contact: ${po.vendor_mobile || 'N/A'}`);

        // Ship To
        doc.fontSize(12).text('SHIP TO:', 300, top, { underline: true });
        doc.fontSize(10).text(po.showroom_name);
        doc.text(po.showroom_address || 'N/A');
        doc.text(`GSTIN: ${po.showroom_gstin || 'N/A'}`);
        doc.moveDown(2);

        // Table Header
        const tableTop = doc.y + 20;
        doc.rect(50, tableTop, 500, 20).fill('#f1f5f9').stroke('#e2e8f0');
        doc.fillColor('#0f172a').fontSize(10).text('Product Description', 60, tableTop + 5);
        doc.text('SKU', 250, tableTop + 5);
        doc.text('Qty', 350, tableTop + 5);
        doc.text('Unit Cost', 410, tableTop + 5);
        doc.text('Total', 480, tableTop + 5);

        // Table Rows
        let rowTop = tableTop + 20;
        doc.fillColor('black');
        items.forEach(itm => {
            doc.text(itm.product_name, 60, rowTop + 5, { width: 180 });
            doc.text(itm.sku || '-', 250, rowTop + 5);
            doc.text(itm.quantity.toString(), 350, rowTop + 5);
            doc.text(`₹${itm.unit_cost.toLocaleString()}`, 410, rowTop + 5);
            doc.text(`₹${itm.total_amount.toLocaleString()}`, 480, rowTop + 5);
            rowTop += 20;
            doc.moveTo(50, rowTop).lineTo(550, rowTop).stroke('#f1f5f9');
        });

        // Summary
        doc.moveDown();
        doc.fontSize(12).text(`Grand Total: ₹${po.total_amount.toLocaleString()}`, { align: 'right', bold: true });

        // Footer
        const bottom = doc.page.height - 100;
        doc.fontSize(9).fillColor('#64748b').text('Terms & Conditions:', 50, bottom);
        doc.text('1. Please include the PO number on all invoices and shipping documents.');
        doc.text('2. All items are subject to inspection and approval upon delivery.');
        doc.text('3. This is a computer-generated document and does not require a physical signature.', { align: 'center', margin: 20 });

        doc.end();

    } catch (err) {
        console.error('PDF Gen Error:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

// GET /api/purchase/orders/:id/barcodes — Generate Printable Barcode Labels
router.get('/orders/:id/barcodes', auth, async (req, res) => {
    const { id } = req.params;
    
    try {
        const { rows: items } = await db.query(`
            SELECT pi.*, p.mrp, b.name as brand_name, var.sku
            FROM purchase_items pi
            JOIN product p ON pi.product_id = p.product_id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN variant var ON pi.variant_id = var.variant_id
            WHERE pi.purchase_id = $1
        `, [id]);

        if (!items.length) return res.status(404).send('No items found to print barcodes');

        let labelsHtml = '';
        items.forEach(itm => {
            const qty = parseInt(itm.quantity) || 1;
            const price = parseFloat(itm.mrp || itm.unit_cost || 0).toLocaleString('en-IN');
            const barcodeVal = itm.barcode || itm.sku || itm.model_no || 'NO_BARCODE';
            const brand = itm.brand_name || 'BRAND';
            const model = itm.model_no || 'MODEL';
            const color = itm.frame_color || '-';
            const size = itm.size || '-';

            for (let i = 0; i < qty; i++) {
                labelsHtml += `
                <div class="label-wrapper">
                    <div class="half left-half">
                        <div class="price">Rs. ${price}/-</div>
                        <svg class="barcode"
                             jsbarcode-format="CODE128"
                             jsbarcode-value="${barcodeVal}"
                             jsbarcode-displayValue="false"
                             jsbarcode-height="22"
                             jsbarcode-width="1.2"
                             jsbarcode-margin="0"></svg>
                        <div class="sku">${barcodeVal}</div>
                    </div>
                    <div class="half right-half">
                        <div class="brand">${brand}</div>
                        <div class="model">${model}</div>
                        <div class="details">${color}</div>
                        <div class="details">${size}</div>
                    </div>
                </div>
                `;
            }
        });

        const html = `<!DOCTYPE html>
        <html>
        <head>
            <title>Print Barcodes - PO ${id}</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
                body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; }
                @page { size: 100mm 15mm; margin: 0; }
                .label-wrapper { 
                    width: 100mm; 
                    height: 15mm; 
                    display: flex; 
                    page-break-after: always; 
                    box-sizing: border-box;
                    overflow: hidden;
                }
                .half { 
                    width: 50mm; 
                    height: 15mm; 
                    box-sizing: border-box; 
                    padding: 1.5mm 3mm; 
                    display: flex; 
                    flex-direction: column; 
                    justify-content: center;
                }
                .left-half { align-items: center; border-right: 1px dashed #e2e8f0; }
                .right-half { align-items: flex-start; padding-left: 4mm; }
                .price { font-size: 8pt; font-weight: bold; margin-bottom: 1px; color: #000; }
                .barcode { height: 6mm !important; width: 40mm !important; }
                .sku { font-size: 6.5pt; margin-top: 1px; letter-spacing: 0.5px; font-weight: bold; }
                
                .brand { font-size: 7.5pt; font-weight: bold; margin-bottom: 1px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 45mm; }
                .model { font-size: 7pt; font-weight: bold; margin-bottom: 1px; }
                .details { font-size: 6.5pt; }
            </style>
        </head>
        <body onload="JsBarcode('.barcode').init(); setTimeout(() => window.print(), 500);">
            ${labelsHtml}
        </body>
        </html>`;

        res.send(html);
    } catch (err) {
        console.error('Barcode Gen Error:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

// ── AI BILL SCANNER ──────────────────────────────────────────────────

router.post('/scan-bill', auth, rbac('Admin', 'Manager'), upload.array('bill', 10), async (req, res) => {
    if (!process.env.GEMINI_API_KEY) return res.status(400).json({ success: false, error: 'AI Scanner not configured (Missing API Key)' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, error: 'No bill file uploaded' });

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        
        const inlineDataParts = req.files.map(file => ({
            inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype }
        }));

        const prompt = `You are an expert procurement assistant. Analyze this purchase bill/invoice image(s).
        Extract the following data into a clean JSON format:
        1. vendor_name, vendor_gstin, vendor_address, vendor_city, vendor_state, vendor_pincode, vendor_pan: Supplier details.
        2. bank_name, bank_acc_no, bank_ifsc: Supplier banking info.
        3. date: Invoice date (YYYY-MM-DD).
        4. invoice_number: Invoice reference number.
        5. items: Array of objects with:
           - description: Product description as written on bill.
           - brand_name: Clean brand name ONLY (e.g., 'Ray-Ban').
           - model_no: Clean model/frame number ONLY (e.g., 'RB2140').
           - upc_code: UPC or EAN number if printed.
           - gender: 'Men', 'Women', 'Unisex', or 'Kids'.
           - category: 'Sunglasses', 'Eyeglasses', 'Contact Lens', etc.
           - shape: Frame shape (e.g., 'Aviator', 'Round').
           - size: Frame size (e.g., '52-18-140').
           - frame_color: Frame color code or name.
           - frame_material: 'Acetate', 'Metal', etc.
           - lens_material: 'CR39', 'Polycarbonate', etc.
           - lens_color: Lens tint/color.
           - quantity: Number of units.
           - unit_cost: Base price per unit (Excl. GST).
           - discount_percent: Any line-item discount percentage.
           - discount_amount: Any line-item discount value.
           - gst_rate: GST percentage (e.g., 12 or 18).
           - gst_amount: Calculated GST amount for this line.
           - total: Line total (Incl. GST).
        
        CRITICAL: Ensure 'brand_name' and 'model_no' are isolated without extra text like 'Mod.' or 'Style'.
        Return ONLY the JSON.`;

        const result = await model.generateContent([
            prompt,
            ...inlineDataParts
        ]);

        const response = await result.response;
        const text = response.text().replace(/```json|```/g, '').trim();
        const data = JSON.parse(text);

        // Try to match vendor in DB
        const vendorCheck = await db.query(
            'SELECT vendor_id, name FROM vendors WHERE (gstin = $1 OR name ILIKE $2) AND business_id = $3 LIMIT 1', 
            [data.vendor_gstin, `%${data.vendor_name}%`, req.user.business_id]
        );
        if (vendorCheck.rows.length > 0) {
            data.vendor_id = vendorCheck.rows[0].vendor_id;
            data.vendor_name = vendorCheck.rows[0].name;

            // Check for duplicate invoice
            if (data.invoice_number) {
                const dupCheck = await db.query(
                    `SELECT purchase_id FROM purchase_orders WHERE vendor_id = $1 AND notes ILIKE $2 AND business_id = $3 LIMIT 1`,
                    [data.vendor_id, `%Imported from Invoice: ${data.invoice_number}%`, req.user.business_id]
                );
                if (dupCheck.rows.length > 0) {
                    return res.json({ 
                        success: false, 
                        duplicate: true, 
                        error: `This invoice (${data.invoice_number}) has already been imported under PO: ${dupCheck.rows[0].purchase_id}. Duplicate imports are not allowed.` 
                    });
                }
            }
        }

        const totalPages = parseInt(data.total_pages) || 1;
        if (totalPages > req.files.length) {
            return res.json({ 
                success: true, 
                requireMorePages: true, 
                expectedPages: totalPages, 
                uploadedCount: req.files.length,
                data // Return partial data just in case they force proceed
            });
        }

        res.json({ success: true, data });
    } catch (err) {
        console.error('AI Scan Error:', err);
        res.status(500).json({ success: false, error: 'Failed to parse bill: ' + err.message });
    }
});

// DELETE /api/purchase/orders/:id
router.delete('/orders/:id', auth, rbac('Admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT status FROM purchase_orders WHERE purchase_id = $1 AND business_id = $2', [id, req.user.business_id]);
        if (!rows.length) return res.status(404).json({ success: false, error: 'Order not found' });
        if (rows[0].status === 'Received') return res.status(400).json({ success: false, error: 'Received orders cannot be deleted' });

        await db.query('DELETE FROM purchase_orders WHERE purchase_id = $1 AND business_id = $2', [id, req.user.business_id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
