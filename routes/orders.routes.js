// routes/orders.routes.js — POS + Ecommerce Order Management (Supabase direct)
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');




// GET /api/orders — list orders for a business
router.get('/', auth, async (req, res) => {
    const { order_type, order_status, payment_status, showroom_id, from_date, to_date, limit = 50, offset = 0 } = req.query;
    const biz = req.query.business_id || req.user.business_id;
    const supabase = require('../supabase_client');
    try {
        // Fetch orders
        const { data: orders, error } = await supabase
            .from('customer_order').select('*')
            .eq('business_id', biz)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);

        // Enrich with customer names
        const custIds = [...new Set((orders||[]).map(o => o.customer_id).filter(Boolean))];
        let custMap = {};
        if (custIds.length) {
            const { data: custs } = await supabase.from('customer').select('customer_id,name,mobile').in('customer_id', custIds);
            custMap = Object.fromEntries((custs||[]).map(c => [c.customer_id, c]));
        }
        const { data: showrooms } = await supabase.from('showroom').select('showroom_id,showroom_name').eq('business_id', biz);
        const showroomMap = Object.fromEntries((showrooms||[]).map(s => [s.showroom_id, s.showroom_name]));

        let rows = (orders||[]).map(o => ({
            ...o,
            customer_name:  custMap[o.customer_id]?.name   || 'Walk-in',
            customer_mobile: custMap[o.customer_id]?.mobile || '',
            showroom_name:  showroomMap[o.showroom_id]     || ''
        }));

        // JS-side filters
        if (order_type === 'POS-ORDER') {
            const { data: optItems } = await supabase.from('order_item').select('order_id, item_type, lens_type, product_id').in('item_type', ['frame', 'lens', 'contact_lens']);
            const optOrderIds = new Set((optItems || []).map(i => i.order_id));
            rows = rows.filter(o => optOrderIds.has(o.order_id) || (o.invoice_number && o.invoice_number.startsWith('BKG-')));

            const pIds = [...new Set((optItems || []).map(i => i.product_id).filter(Boolean))];
            let pMap = {};
            if (pIds.length) {
                const { data: pData } = await supabase.from('product').select('product_id, product_name').in('product_id', pIds);
                pMap = Object.fromEntries((pData || []).map(p => [p.product_id, p.product_name]));
            }

            let itemGroups = {};
            (optItems || []).forEach(it => {
                if (!itemGroups[it.order_id]) itemGroups[it.order_id] = [];
                itemGroups[it.order_id].push(it);
            });

            rows = rows.map(o => {
                const myItems = itemGroups[o.order_id] || [];
                let detailsArr = [];
                const frameItem = myItems.find(i => i.item_type === 'frame');
                const lensItem  = myItems.find(i => i.item_type === 'lens');
                const clItem    = myItems.find(i => i.item_type === 'contact_lens');

                if (clItem) {
                    detailsArr.push(`🖲️ CL: ${pMap[clItem.product_id] || 'Contact Lens'}`);
                } else {
                    if (frameItem) detailsArr.push(`👓 Frame: ${pMap[frameItem.product_id] || 'Selected Frame'}`);
                    if (lensItem)  detailsArr.push(`🔘 Lens: ${lensItem.lens_type || 'Custom Vision'}`);
                }

                let delDate = o.shipping_ref;
                if (!delDate && o.created_at) {
                    const d = new Date(o.created_at);
                    d.setDate(d.getDate() + 5);
                    delDate = d.toISOString().split('T')[0];
                }

                return {
                    ...o,
                    frame_details: detailsArr.join(' | ') || o.showroom_name,
                    delivery_date: delDate
                };
            });
        } else if (order_type) {
            rows = rows.filter(o => o.order_type === order_type);
        }
        if (order_status)   rows = rows.filter(o => o.order_status   === order_status);
        if (payment_status) rows = rows.filter(o => o.payment_status === payment_status);
        if (showroom_id)    rows = rows.filter(o => o.showroom_id    === showroom_id);
        if (from_date)      rows = rows.filter(o => new Date(o.created_at) >= new Date(from_date));
        if (to_date)        rows = rows.filter(o => new Date(o.created_at) <= new Date(to_date));

        const lim = parseInt(limit), off = parseInt(offset);
        res.json({ success: true, data: rows.slice(off, off + lim), total: rows.length });
    } catch (err) {
        console.error('[orders list error]', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id — order detail with items and payments
router.get('/:id', auth, async (req, res) => {
    const supabase = require('../supabase_client');
    try {
        const { data: orders, error: oErr } = await supabase
            .from('customer_order').select('*').eq('order_id', req.params.id).limit(1);
        if (oErr) throw new Error(oErr.message);
        if (!orders?.[0]) return res.status(404).json({ success: false, error: 'Order not found' });
        const order = orders[0];

        // Enrich customer
        let customer = {};
        if (order.customer_id) {
            const { data: custs } = await supabase.from('customer').select('name,mobile,email').eq('customer_id', order.customer_id).limit(1);
            customer = custs?.[0] || {};
        }

        // Fetch items
        const { data: rawItems } = await supabase.from('order_item').select('*').eq('order_id', req.params.id);
        const items = rawItems || [];

        // Enrich items with product names and variant SKU
        const prodIds = [...new Set(items.map(i => i.product_id).filter(Boolean))];
        const varIds  = [...new Set(items.map(i => i.variant_id).filter(Boolean))];
        let prodMap = {}, varMap = {};
        if (prodIds.length) {
            const { data: prods } = await supabase.from('product').select('product_id,product_name,hsn_code').in('product_id', prodIds);
            prodMap = Object.fromEntries((prods||[]).map(p => [p.product_id, p]));
        }
        if (varIds.length) {
            const { data: vars } = await supabase.from('variant').select('variant_id,sku,color_code').in('variant_id', varIds);
            varMap = Object.fromEntries((vars||[]).map(v => [v.variant_id, v]));
        }
        const enrichedItems = items.map(i => ({
            ...i,
            product_name: prodMap[i.product_id]?.product_name || '',
            hsn_code:     prodMap[i.product_id]?.hsn_code     || '',
            sku:          varMap[i.variant_id]?.sku           || '',
            color:        varMap[i.variant_id]?.color_code    || ''
        }));

        // Fetch payments
        const { data: payments } = await supabase.from('payment').select('*').eq('order_id', req.params.id);

        // Fetch prescription if present
        let prescription = null;
        const rxId = items.find(i => i.prescription_id)?.prescription_id;
        if (rxId) {
            const { data: rxData } = await supabase.from('prescription').select('*').eq('prescription_id', rxId).limit(1);
            prescription = rxData?.[0] || null;
        }

        res.json({ 
            success: true, 
            data: { 
                ...order, 
                customer_name: customer.name || 'Walk-in', 
                customer_mobile: customer.mobile || '', 
                items: enrichedItems, 
                payments: payments || [],
                prescription
            } 
        });
    } catch (err) {
        console.error('[order detail error]', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch order' });
    }
});

// POST /api/orders — Create POS or ecommerce order
router.post('/', auth, async (req, res) => {
    const {
        business_id, customer_id, showroom_id, order_type, items,
        payment_mode, amount_paid, discount_amount = 0,
        subtotal: passedSubtotal, tax_amount: passedTax, total_amount: passedTotal
    } = req.body;

    if (!items || !items.length)
        return res.status(400).json({ success: false, error: 'Order must have at least one item' });

    const supabase = require('../supabase_client');
    const biz = business_id || req.user?.business_id;

    try {
        const { data: setts } = await supabase.from('business_settings').select('setting_value').eq('business_id', biz).eq('setting_key', 'prefix_rules');
        const prefixRules = setts?.[0]?.setting_value || {};
        
        let prefix = 'INV';
        if (order_type === 'POS' || !order_type) {
            prefix = prefixRules?.showroom_rules?.[showroom_id]?.pos_prefix || prefixRules?.global_pos_prefix || 'POS';
        } else if (order_type === 'ECOMMERCE') {
            prefix = prefixRules?.showroom_rules?.[showroom_id]?.ecom_prefix || prefixRules?.global_ecom_prefix || 'ECOM';
        }

        const order_id = `ord_${Date.now()}`;
        const invoice_number = `${prefix}-${Date.now()}`;
        
        // 1. Fetch GST rates for all items to ensure accurate tax calculation
        const productIds = [...new Set(items.map(i => i.product_id))];
        const { data: taxData } = await supabase
            .from('product')
            .select('product_id, gst_rate, categories(gst_rate)')
            .in('product_id', productIds);
        
        const taxMap = {};
        (taxData || []).forEach(p => {
            taxMap[p.product_id] = p.gst_rate || p.categories?.gst_rate || 12;
        });

        const calculatedSubtotal = Math.round(items.reduce((sum, item) => sum + (parseFloat(item.unit_price) * parseInt(item.quantity)), 0));
        const subtotal    = passedSubtotal !== undefined ? passedSubtotal : calculatedSubtotal;
        const netAmount   = Math.round(subtotal - parseFloat(discount_amount || 0));
        
        // 2. Calculate tax based on individual item rates
        let calculatedTax = 0;
        items.forEach(item => {
            const rate = taxMap[item.product_id] || 12;
            const itemNet = (parseFloat(item.unit_price) * parseInt(item.quantity)) - (parseFloat(item.discount || 0));
            calculatedTax += Math.round(itemNet - (itemNet / (1 + rate / 100)));
        });

        const tax_amount  = passedTax !== undefined ? passedTax : calculatedTax;
        const total_amount = passedTotal !== undefined ? passedTotal : netAmount;
        const balance_amount = Math.round(total_amount - parseFloat(amount_paid || 0));
        const payment_status = balance_amount <= 0 ? 'paid' : (parseFloat(amount_paid || 0) > 0 ? 'partial' : 'pending');

        // 1. Insert order
        const { error: oErr } = await supabase.from('customer_order').insert({
            order_id, business_id, customer_id: customer_id || null,
            showroom_id: showroom_id || null, order_type: order_type || 'POS',
            subtotal, discount_amount, tax_amount, total_amount,
            total_paid: amount_paid || 0, balance_amount, payment_status,
            order_status: 'Completed', invoice_number
        });
        if (oErr) throw new Error('Order insert: ' + oErr.message);

        // 2. Insert items + deduct inventory
        for (const item of items) {
            const v_id = (item.variant_id && item.variant_id !== 'null' && item.variant_id !== 'undefined') ? item.variant_id : null;
            const item_id = `item_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
            const total_price = Math.round((parseFloat(item.unit_price) * parseInt(item.quantity)) - parseFloat(item.discount || 0));

            const { error: iErr } = await supabase.from('order_item').insert({
                item_id, order_id,
                product_id: item.product_id,
                variant_id: v_id,
                item_type:  item.item_type  || 'frame',
                lens_type:  item.lens_type  || null,
                prescription_id: item.prescription_id || null,
                quantity:   parseInt(item.quantity),
                unit_price: parseFloat(item.unit_price),
                discount:   parseFloat(item.discount || 0),
                total_price
            });
            if (iErr) console.error('[order_item insert error]', iErr.message);

            // Deduct inventory
            if (v_id && showroom_id) {
                const { data: inv } = await supabase.from('inventory')
                    .select('inventory_id,available_qty').eq('variant_id', v_id).eq('showroom_id', showroom_id).limit(1);
                if (inv?.[0]) {
                    await supabase.from('inventory').update({
                        available_qty: Math.max(0, inv[0].available_qty - parseInt(item.quantity))
                    }).eq('inventory_id', inv[0].inventory_id);
                }
            }
        }

        // 3. Log payment
        if (parseFloat(amount_paid || 0) > 0) {
            await supabase.from('payment').insert({
                payment_id: `pay_${Date.now()}`,
                order_id, business_id,
                amount:       parseFloat(amount_paid),
                payment_mode: payment_mode || 'Cash',
                status:       'success'
            });
        }

        // 4. Auto send WhatsApp/Email transactional alert via Communication Hub
        setTimeout(async () => {
            let custData = { name: 'Customer', mobile: '', email: '' };
            if (customer_id) {
                const { data: cRes } = await supabase.from('customer').select('name,mobile,email').eq('customer_id', customer_id).limit(1);
                if (cRes?.[0]) custData = cRes[0];
            }
            const comm = require('./communication.routes.js');
            if (typeof comm.dispatchNotification === 'function') {
                await comm.dispatchNotification(biz, 'Order Confirmation', {
                    ...custData,
                    order_id,
                    total_amount,
                    balance_amount,
                    customer_id
                });
            }
        }, 100);

        res.status(201).json({ success: true, order_id, invoice_number, total_amount, balance_amount });
    } catch (err) {
        console.error('[create order error]', err.message);
        res.status(500).json({ success: false, error: 'Order creation failed: ' + err.message });
    }
});

// POST /api/orders/:id/payment — Record additional payment
router.post('/:id/payment', auth, async (req, res) => {
    const { amount, payment_mode, business_id } = req.body;
    const supabase = require('../supabase_client');
    try {
        await supabase.from('payment').insert({
            payment_id:   `pay_${Date.now()}`,
            order_id:     req.params.id,
            business_id,
            amount:       parseFloat(amount),
            payment_mode: payment_mode || 'Cash',
            status:       'success'
        });
        // Update order totals
        const { data: ord } = await supabase.from('customer_order').select('total_paid,balance_amount,total_amount').eq('order_id', req.params.id).limit(1);
        if (ord?.[0]) {
            const newPaid    = parseFloat(ord[0].total_paid || 0) + parseFloat(amount);
            const newBalance = parseFloat(ord[0].total_amount) - newPaid;
            await supabase.from('customer_order').update({
                total_paid:     newPaid,
                balance_amount: Math.max(0, newBalance),
                payment_status: newBalance <= 0 ? 'paid' : 'partial'
            }).eq('order_id', req.params.id);
        }

        // Auto send WhatsApp/Email transactional alert via Communication Hub
        setTimeout(async () => {
            const { data: oRes } = await supabase.from('customer_order').select('customer_id,balance_amount').eq('order_id', req.params.id).limit(1);
            let custData = { name: 'Customer', mobile: '', email: '' };
            if (oRes?.[0]?.customer_id) {
                const { data: cRes } = await supabase.from('customer').select('name,mobile,email').eq('customer_id', oRes[0].customer_id).limit(1);
                if (cRes?.[0]) custData = cRes[0];
            }
            const comm = require('./communication.routes.js');
            if (typeof comm.dispatchNotification === 'function') {
                await comm.dispatchNotification(business_id, 'Payment Successful', {
                    ...custData,
                    order_id: req.params.id,
                    amount_paid: amount,
                    balance_amount: oRes?.[0]?.balance_amount || 0,
                    customer_id: oRes?.[0]?.customer_id
                });
            }
        }, 100);

        res.json({ success: true });
    } catch (err) {
        console.error('[payment record error]', err.message);
        res.status(500).json({ success: false, error: 'Payment recording failed' });
    }
});

// PATCH /api/orders/:id — Update order status / notes
router.patch('/:id', auth, async (req, res) => {
    const { order_status, notes } = req.body;
    const supabase = require('../supabase_client');
    try {
        const update = {};
        if (order_status) update.order_status = order_status;
        if (notes !== undefined) update.notes = notes;
        const { error } = await supabase.from('customer_order').update(update).eq('order_id', req.params.id).eq('business_id', req.user.business_id);
        if (error) throw new Error(error.message);
        res.json({ success: true });
    } catch (err) {
        console.error('[update order error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/orders/pos-order — Create Optical POS Order (frame + lens booking with advance payment)
// MUST be registered BEFORE /:id routes
router.post('/pos-order', auth, async (req, res) => {
    const {
        business_id, customer_id, showroom_id,
        frame_product_id, frame_variant_id, frame_price, frame_mrp,
        lens_type, lens_price = 0,
        right_dv_sph, right_dv_cyl, right_dv_axis, right_dv_va, right_dv_add,
        right_nv_sph, right_nv_cyl, right_nv_axis, right_nv_va,
        left_dv_sph, left_dv_cyl, left_dv_axis, left_dv_va, left_dv_add,
        left_nv_sph, left_nv_cyl, left_nv_axis, left_nv_va,
        right_prism, right_pd, right_fh,
        left_prism, left_pd, left_fh,
        ipd, notes,
        advance_amount = 0, payment_mode = 'Cash',
        delivery_date, order_for = 'Glasses'
    } = req.body;

    if (order_for === 'Glasses' && !frame_product_id) {
        return res.status(400).json({ success: false, error: 'Frame product is required for Glasses order' });
    }
    if (!customer_id) return res.status(400).json({ success: false, error: 'Customer is required for POS Order' });

    const supabase = require('../supabase_client');
    const order_id    = `ord_${Date.now()}`;
    const booking_no  = `BKG-${Date.now()}`;  // Booking number (not final invoice)
    const ts          = Date.now();

    try {
        // 1. Save prescription
        const prescription_id = `rx_${ts}`;
        const { error: rxErr } = await supabase.from('prescription').insert({
            prescription_id,
            business_id,
            customer_id,
            prescription_for: order_for || 'Glasses',
            right_dv_sph: right_dv_sph || null,
            right_dv_cyl: right_dv_cyl || null,
            right_dv_axis: right_dv_axis || null,
            right_dv_va: right_dv_va || null,
            right_dv_add: right_dv_add || null,
            right_nv_sph: right_nv_sph || null,
            right_nv_cyl: right_nv_cyl || null,
            right_nv_axis: right_nv_axis || null,
            right_nv_va: right_nv_va || null,
            left_dv_sph: left_dv_sph || null,
            left_dv_cyl: left_dv_cyl || null,
            left_dv_axis: left_dv_axis || null,
            left_dv_va: left_dv_va || null,
            left_dv_add: left_dv_add || null,
            left_nv_sph: left_nv_sph || null,
            left_nv_cyl: left_nv_cyl || null,
            left_nv_axis: left_nv_axis || null,
            left_nv_va: left_nv_va || null,
            right_prism: right_prism || null,
            right_pd: right_pd || null,
            right_fh: right_fh || null,
            left_prism: left_prism || null,
            left_pd: left_pd || null,
            left_fh: left_fh || null,
            ipd: ipd || null,
            notes: notes || null
        });
        if (rxErr) console.error('[prescription insert]', rxErr.message); // Non-fatal

        // 2. Calculate totals with dynamic GST rate
        let taxRate = 12;
        const eff_pid = order_for === 'Contact Lens' ? frame_product_id : (frame_product_id || `custom_${ts}`);
        if (eff_pid && !eff_pid.startsWith('custom_') && !eff_pid.startsWith('cl_')) {
            const { data: frameData } = await supabase.from('product').select('gst_rate, categories(gst_rate)').eq('product_id', eff_pid).single();
            if (frameData) {
                taxRate = frameData.gst_rate || frameData.categories?.gst_rate || 12;
            }
        }

        const frameMrp    = order_for === 'Contact Lens' ? 0 : parseFloat(frame_mrp   || frame_price || 0);
        const framePrice  = order_for === 'Contact Lens' ? 0 : parseFloat(frame_price || 0);
        const lensAmount  = parseFloat(lens_price   || 0);
        const subtotal    = order_for === 'Contact Lens' ? lensAmount : (frameMrp + lensAmount);
        const discount    = order_for === 'Contact Lens' ? 0 : Math.max(0, frameMrp - framePrice);
        const netAmount   = subtotal - discount;
        const tax_amount  = Math.round(netAmount - (netAmount / (1 + taxRate / 100)));
        const total_amount = Math.round(netAmount);
        const adv         = parseFloat(advance_amount || 0);
        const balance_amount = Math.max(0, total_amount - adv);
        const payment_status = adv >= total_amount ? 'paid' : adv > 0 ? 'partial' : 'pending';

        // 3. Insert order (Processing = in-lab)
        const { error: oErr } = await supabase.from('customer_order').insert({
            order_id,
            business_id,
            customer_id,
            showroom_id:    showroom_id || null,
            order_type:     'POS',    // Must match database check constraint
            subtotal,
            discount_amount: discount,
            tax_amount,
            total_amount,
            total_paid:     adv,
            balance_amount,
            payment_status,
            order_status:   'Processing',  // Frame+lens being prepared
            invoice_number: booking_no,    // Booking # only; final INV generated on delivery
            shipping_ref:   delivery_date || null
        });
        if (oErr) throw new Error('Order insert: ' + oErr.message);

        // 4. Insert items
        const v_id = (frame_variant_id && frame_variant_id !== 'null') ? frame_variant_id : null;
        
        if (order_for === 'Glasses') {
            await supabase.from('order_item').insert({
                item_id:         `item_${ts}_frame`,
                order_id,
                product_id:      eff_pid,
                variant_id:      v_id,
                item_type:       'frame',
                lens_type:       lens_type || null,
                prescription_id: rxErr ? null : prescription_id,
                quantity:        1,
                unit_price:      frameMrp,
                discount:        discount,
                total_price:     framePrice
            });

            if (lensAmount > 0) {
                await supabase.from('order_item').insert({
                    item_id:         `item_${ts}_lens`,
                    order_id,
                    product_id:      eff_pid, // linked to same frame for report grouping
                    item_type:       'lens',
                    lens_type:       lens_type || 'Single Vision',
                    prescription_id: rxErr ? null : prescription_id,
                    quantity:        1,
                    unit_price:      lensAmount,
                    discount:        0,
                    total_price:     lensAmount
                });
            }
        } else {
            // Contact Lens order
            await supabase.from('order_item').insert({
                item_id:         `item_${ts}_cl`,
                order_id,
                product_id:      eff_pid || `cl_${ts}`,
                variant_id:      v_id,
                item_type:       'contact_lens',
                lens_type:       lens_type || 'Contact Lens',
                prescription_id: rxErr ? null : prescription_id,
                quantity:        1,
                unit_price:      lensAmount,
                discount:        0,
                total_price:     lensAmount
            });
        }

        // 6. Deduct Inventory (Critical for stock accuracy)
        if (v_id && showroom_id) {
            const { data: inv } = await supabase.from('inventory')
                .select('inventory_id,available_qty').eq('variant_id', v_id).eq('showroom_id', showroom_id).limit(1);
            if (inv?.[0]) {
                await supabase.from('inventory').update({
                    available_qty: Math.max(0, inv[0].available_qty - 1)
                }).eq('inventory_id', inv[0].inventory_id);
            }
        }

        // 7. Record advance payment
        if (adv > 0) {
            await supabase.from('payment').insert({
                payment_id:   `pay_${ts}`,
                order_id,
                business_id,
                amount:       adv,
                payment_mode: payment_mode || 'Cash',
                status:       'success',
                notes:        'Advance / Booking Payment'
            });
        }

        res.status(201).json({
            success: true,
            order_id,
            booking_no,
            total_amount,
            advance_paid: adv,
            balance_amount,
            message: `Order booked. Balance due on delivery: ₹${balance_amount}`
        });
    } catch (err) {
        console.error('[pos-order error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH /api/orders/:id/update-details — Edit order details, prices, delivery date, and prescription
router.patch('/:id/update-details', auth, async (req, res) => {
    const supabase = require('../supabase_client');
    const {
        frame_price, lens_price, delivery_date, notes,
        right_dv_sph, right_dv_cyl, right_dv_axis, right_dv_va, right_dv_add,
        right_nv_sph, right_nv_cyl, right_nv_axis, right_nv_va,
        left_dv_sph, left_dv_cyl, left_dv_axis, left_dv_va, left_dv_add,
        left_nv_sph, left_nv_cyl, left_nv_axis, left_nv_va,
        right_prism, right_pd, right_fh, left_prism, left_pd, left_fh, ipd
    } = req.body;

    try {
        // Fetch current order
        const { data: ord } = await supabase.from('customer_order').select('*').eq('order_id', req.params.id).limit(1);
        if (!ord?.[0]) return res.status(404).json({ success: false, error: 'Order not found' });
        const order = ord[0];

        const fPrice = parseFloat(frame_price || 0);
        const lPrice = parseFloat(lens_price || 0);
        const newTotal = fPrice + lPrice;
        const paid = parseFloat(order.total_paid || 0);
        const newBalance = Math.max(0, newTotal - paid);
        const pyStatus = paid >= newTotal ? 'paid' : paid > 0 ? 'partial' : 'pending';

        // Update customer_order table
        await supabase.from('customer_order').update({
            total_amount:   newTotal,
            subtotal:       newTotal,
            balance_amount: newBalance,
            payment_status: pyStatus,
            shipping_ref:   delivery_date || null
        }).eq('order_id', req.params.id);

        // Update item prices
        const { data: items } = await supabase.from('order_item').select('*').eq('order_id', req.params.id);
        let rxId = null;
        for (const it of (items || [])) {
            if (it.prescription_id) rxId = it.prescription_id;
            if (it.item_type === 'frame' || it.item_type === 'contact_lens') {
                await supabase.from('order_item').update({ unit_price: fPrice, total_price: fPrice }).eq('item_id', it.item_id);
            } else if (it.item_type === 'lens') {
                await supabase.from('order_item').update({ unit_price: lPrice, total_price: lPrice }).eq('item_id', it.item_id);
            }
        }

        // Update prescription
        if (rxId) {
            await supabase.from('prescription').update({
                right_dv_sph: right_dv_sph || null, right_dv_cyl: right_dv_cyl || null, right_dv_axis: right_dv_axis || null, right_dv_va: right_dv_va || null, right_dv_add: right_dv_add || null,
                right_nv_sph: right_nv_sph || null, right_nv_cyl: right_nv_cyl || null, right_nv_axis: right_nv_axis || null, right_nv_va: right_nv_va || null,
                left_dv_sph: left_dv_sph || null, left_dv_cyl: left_dv_cyl || null, left_dv_axis: left_dv_axis || null, left_dv_va: left_dv_va || null, left_dv_add: left_dv_add || null,
                left_nv_sph: left_nv_sph || null, left_nv_cyl: left_nv_cyl || null, left_nv_axis: left_nv_axis || null, left_nv_va: left_nv_va || null,
                right_prism: right_prism || null, right_pd: right_pd || null, right_fh: right_fh || null,
                left_prism: left_prism || null, left_pd: left_pd || null, left_fh: left_fh || null,
                ipd: ipd || null, notes: notes || null
            }).eq('prescription_id', rxId);
        }

        res.json({ success: true, message: 'Order details updated successfully' });
    } catch (err) {
        console.error('[edit order error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/orders/:id/cancel — Cancel order with reason and refund
router.post('/:id/cancel', auth, async (req, res) => {
    const supabase = require('../supabase_client');
    const { cancel_reason, refund_amount, payment_mode = 'Cash' } = req.body;
    try {
        const { data: ord } = await supabase.from('customer_order').select('*').eq('order_id', req.params.id).limit(1);
        if (!ord?.[0]) return res.status(404).json({ success: false, error: 'Order not found' });
        const order = ord[0];

        const rAmt = parseFloat(refund_amount || 0);
        if (rAmt > 0) {
            await supabase.from('payment').insert({
                payment_id:   `refund_${Date.now()}`,
                order_id:     req.params.id,
                business_id:  order.business_id,
                amount:       -rAmt,
                payment_mode: payment_mode,
                status:       'refunded',
                notes:        `Refund: ${cancel_reason || 'Order Canceled'}`
            });
        }

        await supabase.from('customer_order').update({
            order_status: 'Canceled',
            balance_amount: 0
        }).eq('order_id', req.params.id);

        const { data: items } = await supabase.from('order_item').select('variant_id,quantity').eq('order_id', req.params.id);
        for (const item of (items || [])) {
            if (item.variant_id && order.showroom_id) {
                const { data: inv } = await supabase.from('inventory').select('inventory_id,available_qty').eq('variant_id', item.variant_id).eq('showroom_id', order.showroom_id).limit(1);
                if (inv?.[0]) {
                    await supabase.from('inventory').update({ available_qty: inv[0].available_qty + parseInt(item.quantity) }).eq('inventory_id', inv[0].inventory_id);
                }
            }
        }

        res.json({ success: true, message: 'Order canceled and refunded successfully' });
    } catch (err) {
        console.error('[cancel order error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/orders/:id/deliver — Mark order delivered: record final payment + generate final invoice
router.post('/:id/deliver', auth, async (req, res) => {
    const { final_amount_paid, payment_mode = 'Cash', business_id } = req.body;
    const supabase = require('../supabase_client');
    const biz = business_id || req.user.business_id;
    try {
        // Fetch current order
        const { data: ord } = await supabase.from('customer_order').select('*').eq('order_id', req.params.id).eq('business_id', biz).limit(1);
        if (!ord?.[0]) return res.status(404).json({ success: false, error: 'Order not found' });
        const order = ord[0];

        const finalPmt   = parseFloat(final_amount_paid || 0);
        const newPaid    = parseFloat(order.total_paid  || 0) + finalPmt;
        const newBalance = Math.max(0, parseFloat(order.total_amount) - newPaid);
        const pyStatus   = newBalance <= 0 ? 'paid' : 'partial';

        const { data: setts } = await supabase.from('business_settings').select('setting_value').eq('business_id', biz).eq('setting_key', 'prefix_rules');
        const prefixRules = setts?.[0]?.setting_value || {};
        const prefix = prefixRules?.showroom_rules?.[order.showroom_id]?.pos_prefix || prefixRules?.global_pos_prefix || 'POS';
        
        const final_invoice = `${prefix}-${Date.now()}`;  // Real invoice on delivery

        // Record final payment
        if (finalPmt > 0) {
            await supabase.from('payment').insert({
                payment_id:   `pay_${Date.now()}`,
                order_id:     req.params.id,
                business_id:  biz,
                amount:       finalPmt,
                payment_mode: payment_mode,
                status:       'success',
                notes:        'Final Payment on Delivery'
            });
        }

        // Update order to Delivered
        await supabase.from('customer_order').update({
            order_status:   'Delivered',
            payment_status: pyStatus,
            total_paid:     newPaid,
            balance_amount: newBalance,
            invoice_number: final_invoice  // Replace booking# with real invoice#
        }).eq('order_id', req.params.id);

        res.json({
            success: true,
            invoice_number: final_invoice,
            balance_amount: newBalance,
            payment_status: pyStatus,
            message: 'Order delivered and final invoice generated'
        });
    } catch (err) {
        console.error('[deliver order error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


// DELETE /api/orders/:id — Delete order and restore stock
router.delete('/:id', auth, async (req, res) => {
    const supabase = require('../supabase_client');
    try {
        // 1. Get items to restore stock
        const { data: order } = await supabase.from('customer_order').select('showroom_id,business_id').eq('order_id', req.params.id).eq('business_id', req.user.business_id).limit(1);
        if (!order?.[0]) return res.status(404).json({ success: false, error: 'Order not found' });

        const { data: items } = await supabase.from('order_item').select('variant_id,quantity').eq('order_id', req.params.id);
        for (const item of (items || [])) {
            if (item.variant_id && order[0].showroom_id) {
                const { data: inv } = await supabase.from('inventory').select('inventory_id,available_qty').eq('variant_id', item.variant_id).eq('showroom_id', order[0].showroom_id).limit(1);
                if (inv?.[0]) {
                    await supabase.from('inventory').update({ available_qty: inv[0].available_qty + parseInt(item.quantity) }).eq('inventory_id', inv[0].inventory_id);
                }
            }
        }

        // 2. Delete related records
        await supabase.from('payment').delete().eq('order_id', req.params.id);
        await supabase.from('order_item').delete().eq('order_id', req.params.id);
        await supabase.from('customer_order').delete().eq('order_id', req.params.id).eq('business_id', req.user.business_id);

        res.json({ success: true, message: 'Order deleted and stock restored' });
    } catch (err) {
        console.error('[delete order error]', err.message);
        res.status(500).json({ success: false, error: 'Failed to delete order: ' + err.message });
    }
});

module.exports = router;

