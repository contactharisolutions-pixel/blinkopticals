// public/admin/js/erp-invoices.js — Enterprise Invoices, Returns & Shrinkage UI View Controllers
'use strict';

// Ensure shorthand helper helpers exist in scope
window.g = window.g || (id => document.getElementById(id)?.value);
window._debounce = window._debounce || ((fn, t) => { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), t); }; });

// ── 1. INVOICES MANAGEMENT LISTING ──────────────────────────────────────────
window.load_invoices = async function() {
    const root = document.getElementById('view-invoices');
    if (!root) return;

    root.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;gap:6px;background:var(--bg);padding:4px;border-radius:8px;border:1px solid var(--border);">
                <button class="btn btn-sm inv-tab active" style="border:none;" onclick="filterInvoicesTab(this, 'All')">All Invoices</button>
                <button class="btn btn-sm inv-tab" style="background:transparent;border:none;color:var(--muted);" onclick="filterInvoicesTab(this, 'POS')">Showroom Wise (POS)</button>
                <button class="btn btn-sm inv-tab" style="background:transparent;border:none;color:var(--muted);" onclick="filterInvoicesTab(this, 'Ecommerce')">Ecommerce</button>
            </div>
            <div style="display:flex;gap:8px;">
                <input type="text" id="inv-search" class="filter-input" placeholder="Search Invoice#, Customer name, mobile..." style="width:240px;" oninput="_debounce(fetchInvoicesList, 300)()">
                <input type="date" id="inv-from" class="filter-input" onchange="fetchInvoicesList()">
                <input type="date" id="inv-to" class="filter-input" onchange="fetchInvoicesList()">
            </div>
        </div>
        <div id="invoices-table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Invoice Details</th>
                        <th>Customer Info</th>
                        <th>Showroom Branch</th>
                        <th>Order Source</th>
                        <th>Net Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="invoices-tbody">
                    ${typeof skelRows === 'function' ? skelRows(5, 6) : '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>'}
                </tbody>
            </table>
        </div>
    `;

    window.currentInvType = 'All';
    await fetchInvoicesList();
};

window.filterInvoicesTab = function(btn, type) {
    document.querySelectorAll('.inv-tab').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.color = 'var(--muted)';
    });
    btn.classList.add('active');
    btn.style.background = 'var(--accent)';
    btn.style.color = '#fff';
    window.currentInvType = type;
    fetchInvoicesList();
};

window.fetchInvoicesList = async function() {
    const tbody = document.getElementById('invoices-tbody');
    if (!tbody) return;

    const search = g('inv-search') || '';
    const from   = g('inv-from') || '';
    const to     = g('inv-to') || '';
    const sr     = sessionStorage.getItem('global_showroom') || '';

    let url = `/api/invoices?business_id=${BIZ}&type=${window.currentInvType}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (from)   url += `&from_date=${from}`;
    if (to)     url += `&to_date=${to}`;
    if (sr)     url += `&showroom_id=${sr}`;

    const r = await api(url);
    if (!r.success) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#ef4444;">Failed to load invoices</td></tr>`;
        return;
    }

    if (!r.data || !r.data.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted);">No matching invoices found</td></tr>`;
        return;
    }

    tbody.innerHTML = r.data.map(o => `
        <tr>
            <td>
                <div style="font-weight:800;color:var(--accent);">${o.invoice_number || o.order_id}</div>
                <div style="font-size:0.75rem;color:#888;">${fmtDate(o.created_at)}</div>
            </td>
            <td>
                <div style="font-weight:600;">${o.customer_name || 'Walk-in'}</div>
                <div style="font-size:0.75rem;color:#888;">${o.customer_mobile || 'N/A'}</div>
            </td>
            <td style="font-size:0.85rem;color:#555;">${o.showroom_name || '—'}</td>
            <td><span class="badge ${o.order_type==='POS'?'badge-blue':'badge-green'}">${o.order_type==='POS'?'🏪 Retail POS':'🌐 Web Digital'}</span></td>
            <td style="font-weight:800;color:#059669;">${fmt(o.total_amount)}</td>
            <td>
                <button class="btn btn-outline btn-sm" style="border-radius:6px;padding:4px 8px;font-size:0.75rem;" onclick="typeof printPosInvoice === 'function' ? printPosInvoice('${o.order_id}') : alert('Print trigger linked mapping missing')" title="Print Multi-copy Document">🖨️ Print Form</button>
            </td>
        </tr>
    `).join('');
};


// ── 2. RETURN FROM CUSTOMER WORKFLOW ─────────────────────────────────────────
window.load_return_customer = function() {
    const root = document.getElementById('view-return_customer');
    if (!root) return;

    root.innerHTML = `
        <div style="max-width:800px;margin:0 auto;background:var(--bg);padding:24px;border-radius:12px;border:1px solid var(--border);">
            <h2 style="font-size:1.2rem;margin-bottom:8px;color:var(--accent);">↩️ Record Delivered Customer Goods Return</h2>
            <p style="font-size:0.85rem;color:var(--muted);margin-bottom:20px;">Lookup an active customer invoice to accept product pullbacks, compute immediate financial returns, and replenish showroom store stock.</p>

            <div style="display:flex;gap:10px;margin-bottom:20px;">
                <input type="text" id="ret-cust-inv" class="filter-input" style="flex:1;font-size:1rem;font-weight:700;" placeholder="Enter complete Invoice# (e.g. POS-177...)">
                <button class="btn btn-primary" onclick="lookupCustomerReturnInv()">🔍 Lookup Invoice</button>
            </div>

            <div id="ret-cust-items-area" style="margin-top:16px;">
                <div style="text-align:center;padding:40px;color:#aaa;border:1px dashed var(--border);border-radius:8px;font-size:0.85rem;">Input source invoice string above to load fulfilled line items.</div>
            </div>
        </div>
    `;
};

window.lookupCustomerReturnInv = async function() {
    const invNo = g('ret-cust-inv')?.trim();
    if (!invNo) return toast('Please enter a valid invoice number', 'warn');

    const area = document.getElementById('ret-cust-items-area');
    area.innerHTML = `<div style="text-align:center;padding:20px;">Loading invoice records...</div>`;

    const rAll = await api(`/api/invoices?business_id=${BIZ}&search=${encodeURIComponent(invNo)}`);
    const ord = rAll?.data?.find(o => o.invoice_number?.toLowerCase() === invNo.toLowerCase() || o.order_id === invNo);

    if (!ord) {
        area.innerHTML = `<div style="padding:20px;color:#ef4444;text-align:center;">Invoice metadata not resolved or order not finalized yet.</div>`;
        return;
    }

    const rDetails = await api(`/api/orders/${ord.order_id}`);
    const items = rDetails?.data?.items || [];

    if (!items.length) {
        area.innerHTML = `<div style="padding:20px;color:#ef4444;text-align:center;">No linked operational items found inside invoice.</div>`;
        return;
    }

    window.currentReturnOrder = ord;
    window.currentReturnItems = items;

    let itemsHtml = `
        <label style="font-size:0.75rem;font-weight:800;color:#555;display:block;margin-bottom:6px;">Select Lines Returning to Shelf Stock</label>
        <table class="data-table" style="font-size:0.8rem;margin-bottom:16px;">
            <thead>
                <tr>
                    <th style="width:40px;">Select</th>
                    <th>Product Type</th>
                    <th>Subtotal Value</th>
                    <th style="width:100px;">Return Qty</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((it, idx) => `
                    <tr>
                        <td><input type="checkbox" class="ret-line-cb" data-idx="${idx}" onchange="calcCustomerReturnTotals()" checked style="width:16px;height:16px;"></td>
                        <td>
                            <b style="color:var(--accent);text-transform:capitalize;">${it.item_type || 'optical unit'}</b>
                            <div style="font-size:0.7rem;color:#888;">Price: ₹${parseFloat(it.unit_price||0).toFixed(2)}</div>
                        </td>
                        <td style="font-weight:700;">₹${parseFloat(it.total_price||0).toFixed(2)}</td>
                        <td><input type="number" id="ret-qty-${idx}" class="filter-input" value="${it.quantity||1}" min="1" max="${it.quantity||1}" style="width:70px;padding:2px 6px;text-align:center;" oninput="calcCustomerReturnTotals()"></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-size:0.85rem;font-weight:700;color:#334155;">Computed Refund Payout</span>
                <b id="ret-computed-amt" style="font-size:1.3rem;color:#dc2626;">₹0.00</b>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div>
                    <label style="font-size:0.75rem;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">Refund Method</label>
                    <select id="ret-refund-mode" class="filter-input" style="width:100%;background:#fff;">
                        <option value="Cash Return">Cash Over Counter</option>
                        <option value="Original Payment Mode">Original Mode Transfer</option>
                        <option value="Store Credit Wallet">Store Credit Adjustment</option>
                    </select>
                </div>
                <div>
                    <label style="font-size:0.75rem;font-weight:700;color:#64748b;display:block;margin-bottom:4px;">Audit Note</label>
                    <input type="text" id="ret-audit-notes" class="filter-input" placeholder="e.g. Scratched lens / frame sizing tight" style="width:100%;">
                </div>
            </div>
        </div>

        <button class="btn btn-primary" style="width:100%;height:46px;font-size:1rem;font-weight:800;border-radius:8px;background:#dc2626;border-color:#dc2626;" onclick="submitCustomerReturnProcess()">
            💾 Commit Goods Return & Record Refund Sleep
        </button>
    `;

    area.innerHTML = itemsHtml;
    calcCustomerReturnTotals();
};

window.calcCustomerReturnTotals = function() {
    let refundSum = 0;
    document.querySelectorAll('.ret-line-cb').forEach(cb => {
        if (cb.checked) {
            const idx = cb.dataset.idx;
            const it = window.currentReturnItems[idx];
            const q = parseInt(g(`ret-qty-${idx}`) || 1);
            const uPrice = parseFloat(it.unit_price || 0);
            refundSum += (q * uPrice);
        }
    });

    const label = document.getElementById('ret-computed-amt');
    if (label) label.innerText = `₹${refundSum.toFixed(2)}`;
    window.computedCustomerRefundAmt = refundSum;
};

window.submitCustomerReturnProcess = async function() {
    const selectedItems = [];
    document.querySelectorAll('.ret-line-cb').forEach(cb => {
        if (cb.checked) {
            const idx = cb.dataset.idx;
            const it = window.currentReturnItems[idx];
            const q = parseInt(g(`ret-qty-${idx}`) || 1);
            selectedItems.push({
                item_id: it.item_id,
                variant_id: it.variant_id || null,
                product_id: it.product_id || null,
                return_qty: q
            });
        }
    });

    if (!selectedItems.length) return toast('Please select at least one item line to return', 'warn');

    const payload = {
        invoice_number: window.currentReturnOrder.invoice_number || window.currentReturnOrder.order_id,
        items: selectedItems,
        refund_amount: window.computedCustomerRefundAmt,
        payment_mode: g('ret-refund-mode'),
        notes: g('ret-audit-notes')
    };

    const r = await postAPI('/api/invoices/return-customer', payload);
    if (!r.success) return toast(r.error || 'Failed to file return transaction', 'error');

    toast('🎉 Goods returned to inventory! Return payment refund sleep recorded successfully.', 'success');
    load_return_customer();
};


// ── 3. RETURN TO VENDOR WORKFLOW ─────────────────────────────────────────────
window.load_return_vendor = function() {
    const root = document.getElementById('view-return_vendor');
    if (!root) return;

    root.innerHTML = `
        <div style="max-width:800px;margin:0 auto;background:var(--bg);padding:24px;border-radius:12px;border:1px solid var(--border);">
            <h2 style="font-size:1.2rem;margin-bottom:8px;color:var(--accent);">📤 Return Procurement Stock to Vendor Supplier</h2>
            <p style="font-size:0.85rem;color:var(--muted);margin-bottom:20px;">Lookup an inbound purchase order invoice string to deduct incoming frame quantities from inventory shelves and record supplier credit notes.</p>

            <div style="display:flex;gap:10px;margin-bottom:20px;">
                <input type="text" id="rtv-po-id" class="filter-input" style="flex:1;font-size:1rem;font-weight:700;" placeholder="Scan Barcode / Enter Model No / Purchase Order#">
                <button class="btn btn-primary" style="border-radius:8px;padding:0 20px;font-weight:800;" onclick="lookupVendorReturnPO()">🔍 Universal Lookup</button>
            </div>

            <div id="rtv-items-area" style="margin-top:16px;">
                <div style="text-align:center;padding:40px;color:#aaa;border:1px dashed var(--border);border-radius:8px;font-size:0.85rem;">Input source Purchase Order string above to fetch procurement items.</div>
            </div>
        </div>
    `;
};

window.lookupVendorReturnPO = async function() {
    const poId = g('rtv-po-id')?.trim();
    if (!poId) return toast('Please enter a valid purchase order ID', 'warn');

    const area = document.getElementById('rtv-items-area');
    area.innerHTML = `<div style="text-align:center;padding:20px;">Fetching vendor order items...</div>`;

    const r = await api(`/api/purchase/orders/${poId}`);
    if (!r.success || !r.data) {
        area.innerHTML = `<div style="padding:20px;color:#ef4444;text-align:center;">Purchase Order not resolved or missing stock inbound ledger trails.</div>`;
        return;
    }

    const items = r.data.items || [];
    if (!items.length) {
        area.innerHTML = `<div style="padding:20px;color:#ef4444;text-align:center;">No valid stock line items found inside target PO.</div>`;
        return;
    }

    window.currentRtvPO = r.data;
    window.currentRtvItems = items;

    area.innerHTML = `
        <div style="font-size:0.85rem;margin-bottom:12px;color:#059669;font-weight:700;">📦 Supplier Mapped: ${r.data.vendor_name || poId}</div>
        <table class="data-table" style="font-size:0.8rem;margin-bottom:16px;">
            <thead>
                <tr>
                    <th style="width:40px;">Select</th>
                    <th>Model Info / Spec</th>
                    <th>Inward Cost</th>
                    <th style="width:100px;">Outward Qty</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((it, idx) => `
                    <tr>
                        <td><input type="checkbox" class="rtv-line-cb" data-idx="${idx}" checked style="width:16px;height:16px;"></td>
                        <td>
                            <b style="color:var(--accent);">${it.model_no || 'Standard Variant'}</b>
                            <div style="font-size:0.7rem;color:#888;">Color: ${it.frame_color || 'N/A'} | Size: ${it.size || 'N/A'}</div>
                        </td>
                        <td style="font-weight:700;">₹${parseFloat(it.unit_cost||0).toFixed(2)}</td>
                        <td><input type="number" id="rtv-qty-${idx}" class="filter-input" value="${it.quantity||1}" min="1" max="${it.quantity||1}" style="width:70px;padding:2px 6px;text-align:center;"></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;">
            <div>
                <label style="font-size:0.75rem;font-weight:700;color:#555;">Credit Note Ref ID *</label>
                <input type="text" id="rtv-credit-note" class="filter-input" placeholder="e.g. CN-VND-2026-09" style="width:100%;">
            </div>
            <div>
                <label style="font-size:0.75rem;font-weight:700;color:#555;">RTV Reason</label>
                <select id="rtv-reason" class="filter-input" style="width:100%;background:#fff;">
                    <option value="Defective Manufacturing">Defective Manufacturing Frame</option>
                    <option value="Excess Inventory Overstock">Excess Inventory Overstock</option>
                    <option value="Wrong Specification Shipped">Wrong Specification Shipped</option>
                </select>
            </div>
        </div>

        <button class="btn btn-primary" style="width:100%;height:46px;font-size:1rem;font-weight:800;border-radius:8px;" onclick="submitVendorReturnProcess()">
            📤 Execute Return to Vendor & Subtract Physical Inventories
        </button>
    `;
};

window.submitVendorReturnProcess = async function() {
    const creditNote = g('rtv-credit-note')?.trim();
    if (!creditNote) return toast('Please specify target Credit Note Reference ID', 'warn');

    const selectedItems = [];
    document.querySelectorAll('.rtv-line-cb').forEach(cb => {
        if (cb.checked) {
            const idx = cb.dataset.idx;
            const it = window.currentRtvItems[idx];
            const q = parseInt(g(`rtv-qty-${idx}`) || 1);
            selectedItems.push({
                item_id: it.item_id,
                variant_id: it.variant_id,
                product_id: it.product_id,
                unit_cost: parseFloat(it.unit_cost || 0),
                return_qty: q
            });
        }
    });

    if (!selectedItems.length) return toast('Please select item rows to outward', 'warn');

    const payload = {
        purchase_id: window.currentRtvPO.purchase_id,
        items: selectedItems,
        credit_note_ref: creditNote,
        return_reason: g('rtv-reason')
    };

    const r = await postAPI('/api/invoices/return-vendor', payload);
    if (!r.success) return toast(r.error || 'RTV processing error', 'error');

    toast('✅ Return goods subtracted from warehouse records cleanly!', 'success');
    load_return_vendor();
};


// ── 4. DAMAGED GOODS SHRINKAGE LOGGING ───────────────────────────────────────
window.load_damaged_goods = async function() {
    const root = document.getElementById('view-damaged_goods');
    if (!root) return;

    root.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 2fr;gap:20px;">
            <div style="background:var(--bg);padding:20px;border-radius:12px;border:1px solid var(--border);height:fit-content;">
                <h3 style="font-size:1.05rem;margin-bottom:16px;color:var(--accent);">💥 File Damaged Unit</h3>
                
                <div style="margin-bottom:12px;">
                    <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Showroom Location</label>
                    <select id="dmg-showroom" class="filter-input" style="width:100%;"></select>
                </div>

                <div style="margin-bottom:12px;">
                    <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Product Variant SKU *</label>
                    <input type="text" id="dmg-variant-sku" class="filter-input" placeholder="Scan/Type distinct Variant ID or SKU" style="width:100%;" onchange="lookupDamageVariant(this.value)">
                    <div id="dmg-variant-res" style="font-size:0.7rem;color:#059669;margin-top:4px;"></div>
                </div>

                <div style="margin-bottom:12px;">
                    <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Damaged Quantity</label>
                    <input type="number" id="dmg-qty" class="filter-input" value="1" min="1" style="width:100%;">
                </div>

                <div style="margin-bottom:16px;">
                    <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Damage Rationale Category</label>
                    <select id="dmg-reason" class="filter-input" style="width:100%;background:#fff;">
                        <option value="Accidental Frame Snap">Accidental Frame Structural Snap</option>
                        <option value="Lens Surface Scratching">Lens Surface Severe Scratching</option>
                        <option value="Contact Lens Expiry">Contact Lens Inventory Expiry</option>
                        <option value="Inbound Transit Smash">Inbound Transit Container Smash</option>
                    </select>
                </div>

                <button class="btn btn-primary" style="width:100%;border-radius:8px;font-weight:800;" onclick="submitDamagedGoodsLog()">
                    ⚠️ Commit Damage & Decrement Count
                </button>
            </div>

            <div>
                <h3 style="font-size:1.05rem;margin-bottom:12px;color:#555;">📋 Reported Shrinkage & Audit Logs</h3>
                <div id="damaged-list-container" style="background:var(--bg);border-radius:12px;border:1px solid var(--border);overflow:hidden;">
                    <div style="padding:40px;text-align:center;color:#aaa;">Loading shrinkage entries...</div>
                </div>
            </div>
        </div>
    `;

    // Populate localized showrooms dropdown
    const srSel = document.getElementById('dmg-showroom');
    const rSr = await api(`/api/showrooms?business_id=${BIZ}`);
    if (rSr?.success && srSel) {
        srSel.innerHTML = rSr.data.map(s => `<option value="${s.showroom_id}">${s.showroom_name}</option>`).join('');
        const saved = sessionStorage.getItem('global_showroom');
        if (saved) srSel.value = saved;
    }

    await reloadDamagedGoodsTable();
};

window.lookupDamageVariant = async function(sku) {
    if (!sku) return;
    const resEl = document.getElementById('dmg-variant-res');
    const r = await api(`/api/inventory?business_id=${BIZ}&q=${encodeURIComponent(sku)}`);
    const found = r?.data?.[0];
    if (found) {
        window.resolvedDamageVariantId = found.variant_id;
        resEl.innerText = `✓ Resolved: ${found.product_name || found.sku} (Available: ${found.available_qty || 0})`;
        resEl.style.color = '#059669';
    } else {
        window.resolvedDamageVariantId = sku; // use typed id fallback
        resEl.innerText = `⚠️ SKU lookup text fallback triggered`;
        resEl.style.color = '#d97706';
    }
};

window.submitDamagedGoodsLog = async function() {
    const vId = window.resolvedDamageVariantId || g('dmg-variant-sku')?.trim();
    if (!vId) return toast('Please specify target product variant SKU string', 'warn');

    const payload = {
        showroom_id: g('dmg-showroom'),
        variant_id:  vId,
        damaged_qty: g('dmg-qty'),
        damage_reason: g('dmg-reason')
    };

    const r = await postAPI('/api/invoices/damaged-goods', payload);
    if (!r.success) return toast(r.error || 'Failed updating shrinkage counts', 'error');

    toast('💥 Damaged unit filed successfully. Available stock counts adjusted cleanly.', 'success');
    g('dmg-variant-sku').value = '';
    document.getElementById('dmg-variant-res').innerText = '';
    reloadDamagedGoodsTable();
};

window.reloadDamagedGoodsTable = async function() {
    const box = document.getElementById('damaged-list-container');
    if (!box) return;

    const r = await api(`/api/invoices/damaged-list?business_id=${BIZ}`);
    if (!r.success || !r.data?.length) {
        box.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted);font-size:0.85rem;">No damaged stock items reported yet</div>`;
        return;
    }

    box.innerHTML = `
        <table class="data-table" style="margin:0;font-size:0.8rem;">
            <thead>
                <tr style="background:#f1f5f9;">
                    <th>Timestamp</th>
                    <th>Product Item Info</th>
                    <th>Showroom Location</th>
                    <th style="width:80px;text-align:center;">Shrink Qty</th>
                </tr>
            </thead>
            <tbody>
                ${r.data.map(sm => `
                    <tr>
                        <td style="color:#888;font-size:0.75rem;">${fmtDate(sm.created_at)}</td>
                        <td>
                            <b style="color:var(--accent);">${sm.product_name || sm.variant_id || 'Retail Frame'}</b>
                            <div style="font-size:0.7rem;color:#888;">SKU: ${sm.sku || 'N/A'}</div>
                        </td>
                        <td>${sm.showroom_name || 'Central Store'}</td>
                        <td style="text-align:center;font-weight:800;color:#dc2626;">-${sm.quantity}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
};
