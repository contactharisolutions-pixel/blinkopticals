// public/admin/js/erp-accounting.js — Enterprise Accounting Client UI & Controller Engine
'use strict';

// Shorthand helper helpers
window.g = window.g || (id => document.getElementById(id)?.value);

window.load_accounting = async function() {
    const root = document.getElementById('view-accounting');
    if (!root) return;

    root.innerHTML = `
        <div style="max-width:100%;padding:0 12px;margin:0 auto;">
            <!-- Header & Filter Banner -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;background:var(--bg);padding:16px 24px;border-radius:16px;border:1px solid var(--border);box-shadow:0 4px 20px rgba(0,0,0,0.03);">
                <div>
                    <h1 style="font-size:1.5rem;font-weight:800;color:var(--accent);display:flex;align-items:center;gap:8px;">
                        <span>💰</span> Enterprise Financial Accounting
                    </h1>
                    <p style="font-size:0.85rem;color:var(--muted);margin-top:2px;">Real-time Double-Entry Ledger, Chart of Accounts, P&L Audit suite, and automated Exports.</p>
                </div>
                <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                    <div>
                        <label style="font-size:0.7rem;font-weight:700;color:var(--muted);display:block;margin-bottom:2px;">Showroom Filter</label>
                        <select id="acc-filter-showroom" class="filter-input" style="min-width:160px;font-size:0.85rem;background:var(--bg-subtle);" onchange="refreshAccountingModule()">
                            <option value="">All Enterprise Branches</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size:0.7rem;font-weight:700;color:var(--muted);display:block;margin-bottom:2px;">Date Filter Preset</label>
                        <select id="acc-filter-preset" class="filter-input" style="font-size:0.8rem;background:var(--bg-subtle);" onchange="applyAccountingDatePreset()">
                            <option value="month">This Month</option>
                            <option value="today">Today</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="lastmonth">Last Month</option>
                            <option value="quarter">Last Quarter</option>
                            <option value="6months">Last Six Months</option>
                            <option value="year">Current Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    <div id="acc-custom-dates-wrapper" style="display:none;flex-direction:column;">
                        <label style="font-size:0.7rem;font-weight:700;color:var(--muted);display:block;margin-bottom:2px;">Custom Period Boundaries</label>
                        <div style="display:flex;gap:4px;">
                            <input type="date" id="acc-filter-start" class="filter-input" style="font-size:0.8rem;padding:4px 8px;" onchange="refreshAccountingModule()">
                            <input type="date" id="acc-filter-end" class="filter-input" style="font-size:0.8rem;padding:4px 8px;" onchange="refreshAccountingModule()">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Prominent Quick Action Buttons Suite -->
            <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;background:var(--bg-subtle);padding:10px 16px;border-radius:12px;border:1px solid var(--border);align-items:center;">
                <span style="font-size:0.75rem;font-weight:800;color:var(--muted);text-transform:uppercase;">⚡ Quick Actions:</span>
                <button class="btn btn-sm btn-primary" style="border-radius:8px;font-weight:700;background:#15803d;border:none;" onclick="switchAccTab('expenses'); setTimeout(()=>g('pay-amt')?.focus(), 100);">
                    📥 Register Incoming Revenue
                </button>
                <button class="btn btn-sm btn-primary" style="border-radius:8px;font-weight:700;background:#b91c1c;border:none;" onclick="switchAccTab('expenses'); setTimeout(()=>g('exp-amt')?.focus(), 100);">
                    💸 Record Expense
                </button>
                <button class="btn btn-sm btn-outline" style="border-radius:8px;font-weight:700;" onclick="switchAccTab('coa'); setTimeout(()=>g('coa-new-name')?.focus(), 100);">
                    ➕ Provision New Account
                </button>
                <button class="btn btn-sm btn-outline" style="border-radius:8px;font-weight:700;color:#0284c7;border-color:#0284c7;" onclick="switchAccTab('reports'); setTimeout(()=>exportAccountingCSV(), 300);">
                    📊 Direct CSV Export
                </button>
            </div>

            <!-- Tab Navigation Engine -->
            <div style="display:flex;gap:8px;margin-bottom:20px;border-b:1px solid var(--border);padding-bottom:12px;overflow-x:auto;">
                <button class="btn acc-tab-btn active" onclick="switchAccTab('dashboard')" style="border-radius:10px;font-weight:700;">📊 Financial Overview</button>
                <button class="btn acc-tab-btn btn-outline" onclick="switchAccTab('ledger')" style="border-radius:10px;font-weight:700;">📜 Journal Ledger</button>
                <button class="btn acc-tab-btn btn-outline" onclick="switchAccTab('coa')" style="border-radius:10px;font-weight:700;">🗂️ Chart of Accounts</button>
                <button class="btn acc-tab-btn btn-outline" onclick="switchAccTab('expenses')" style="border-radius:10px;font-weight:700;">💸 File Voucher / Payment</button>
                <button class="btn acc-tab-btn btn-outline" onclick="switchAccTab('reports')" style="border-radius:10px;font-weight:700;color:#059669;border-color:#059669;">📈 P&L Statement & Exports</button>
            </div>

            <!-- Tab Viewports -->
            <div id="acc-tab-dashboard" class="acc-view-pane">
                <!-- 1. Executive Cashflow KPIs -->
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:16px;">
                    <div style="background:linear-gradient(135deg, #f0fdf4, #dcfce7);padding:16px;border-radius:16px;border:1px solid #bbf7d0;">
                        <span style="font-size:0.7rem;font-weight:800;color:#166534;text-transform:uppercase;">Gross Incoming Sum</span>
                        <div id="acc-kpi-inc" style="font-size:1.5rem;font-weight:800;color:#15803d;margin-top:4px;">₹0.00</div>
                        <p style="font-size:0.65rem;color:#166534;opacity:0.8;margin-top:2px;">Revenues + Payments</p>
                    </div>
                    <div style="background:linear-gradient(135deg, #fef2f2, #fee2e2);padding:16px;border-radius:16px;border:1px solid #fecaca;">
                        <span style="font-size:0.7rem;font-weight:800;color:#991b1b;text-transform:uppercase;">Disbursed Outflow</span>
                        <div id="acc-kpi-exp" style="font-size:1.5rem;font-weight:800;color:#b91c1c;margin-top:4px;">₹0.00</div>
                        <p style="font-size:0.65rem;color:#991b1b;opacity:0.8;margin-top:2px;">Vouchers + Purchases</p>
                    </div>
                    <div style="background:linear-gradient(135deg, #fefefb, #fef9c3);padding:16px;border-radius:16px;border:1px solid #fef08a;">
                        <span style="font-size:0.7rem;font-weight:800;color:#854d0e;text-transform:uppercase;">Receivables Pending</span>
                        <div id="acc-kpi-pend" style="font-size:1.5rem;font-weight:800;color:#a16207;margin-top:4px;">₹0.00</div>
                        <p style="font-size:0.65rem;color:#854d0e;opacity:0.8;margin-top:2px;">Uncollected clinical orders</p>
                    </div>
                    <div style="background:linear-gradient(135deg, #eff6ff, #dbeafe);padding:16px;border-radius:16px;border:1px solid #bfdbfe;">
                        <span style="font-size:0.7rem;font-weight:800;color:#1e40af;text-transform:uppercase;">Evaluated Net Margin</span>
                        <div id="acc-kpi-net" style="font-size:1.5rem;font-weight:800;color:#1d4ed8;margin-top:4px;">₹0.00</div>
                        <p style="font-size:0.65rem;color:#1e40af;opacity:0.8;margin-top:2px;">Gross Inward - Outward</p>
                    </div>
                </div>

                <!-- 2. Premium Multi-Channel Payments & Sales Volume Matrix -->
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;margin-bottom:24px;">
                    <div style="background:var(--bg);padding:14px;border-radius:12px;border:1px solid #e2e8f0;border-top:3px solid #f59e0b;">
                        <span style="font-size:0.65rem;font-weight:800;color:#b45309;text-transform:uppercase;display:block;">💵 Petty Cash Drawer</span>
                        <b id="acc-kpi-petty" style="font-size:1.2rem;color:#d97706;display:block;margin-top:2px;">₹0.00</b>
                        <span style="font-size:0.6rem;color:#94a3b8;">Physical register receipts</span>
                    </div>
                    <div style="background:var(--bg);padding:14px;border-radius:12px;border:1px solid #e2e8f0;border-top:3px solid #06b6d4;">
                        <span style="font-size:0.65rem;font-weight:800;color:#0e7490;text-transform:uppercase;display:block;">🌐 Online Payment Gateway</span>
                        <b id="acc-kpi-online" style="font-size:1.2rem;color:#0891b2;display:block;margin-top:2px;">₹0.00</b>
                        <span style="font-size:0.6rem;color:#94a3b8;">UPI/Card digital routings</span>
                    </div>
                    <div style="background:var(--bg);padding:14px;border-radius:12px;border:1px solid #e2e8f0;border-top:3px solid #6366f1;">
                        <span style="font-size:0.65rem;font-weight:800;color:#4338ca;text-transform:uppercase;display:block;">📈 Total Sales (All)</span>
                        <b id="acc-kpi-sall" style="font-size:1.2rem;color:#4f46e5;display:block;margin-top:2px;">₹0.00</b>
                        <span style="font-size:0.6rem;color:#94a3b8;">Consolidated volume booked</span>
                    </div>
                    <div style="background:var(--bg);padding:14px;border-radius:12px;border:1px solid #e2e8f0;border-top:3px solid #10b981;">
                        <span style="font-size:0.65rem;font-weight:800;color:#047857;text-transform:uppercase;display:block;">🏪 Showroom Wise Sales</span>
                        <b id="acc-kpi-spos" style="font-size:1.2rem;color:#059669;display:block;margin-top:2px;">₹0.00</b>
                        <span style="font-size:0.6rem;color:#94a3b8;">POS counters direct throughput</span>
                    </div>
                    <div style="background:var(--bg);padding:14px;border-radius:12px;border:1px solid #e2e8f0;border-top:3px solid #ec4899;">
                        <span style="font-size:0.65rem;font-weight:800;color:#be185d;text-transform:uppercase;display:block;">🛒 Ecommerce Store</span>
                        <b id="acc-kpi-secom" style="font-size:1.2rem;color:#db2777;display:block;margin-top:2px;">₹0.00</b>
                        <span style="font-size:0.6rem;color:#94a3b8;">Remote API checkout carts</span>
                    </div>
                </div>

                <!-- Recent double entry preview -->
                <div style="background:var(--bg);padding:20px;border-radius:16px;border:1px solid var(--border);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                        <h3 style="font-size:1.1rem;color:var(--accent);">📜 Core Ledger Synchronization Feed</h3>
                        <button class="btn btn-outline btn-sm" style="border-radius:8px;" onclick="switchAccTab('ledger')">View Extended Audit Trail</button>
                    </div>
                    <div id="acc-dash-tx-box">Loading transactions stream...</div>
                </div>
            </div>

            <div id="acc-tab-ledger" class="acc-view-pane" style="display:none;">
                <div style="background:var(--bg);padding:20px;border-radius:16px;border:1px solid var(--border);">
                    <h3 style="font-size:1.1rem;color:var(--accent);margin-bottom:16px;">📜 Universal Journal Ledger Log</h3>
                    <div id="acc-full-ledger-area">Loading active journals...</div>
                </div>
            </div>

            <div id="acc-tab-coa" class="acc-view-pane" style="display:none;">
                <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;">
                    <div style="background:var(--bg);padding:20px;border-radius:16px;border:1px solid var(--border);">
                        <h3 style="font-size:1.1rem;color:var(--accent);margin-bottom:16px;">🗂️ Active Chart of Accounts (COA) Map</h3>
                        <div id="acc-coa-tree">Loading COA structure...</div>
                    </div>
                    <div style="background:var(--bg);padding:20px;border-radius:16px;border:1px solid var(--border);height:fit-content;">
                        <h3 style="font-size:1.05rem;color:var(--accent);margin-bottom:12px;">✨ Quick-Provision New Account</h3>
                        <div style="margin-bottom:12px;">
                            <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Account Classification</label>
                            <select id="coa-new-type" class="filter-input" style="width:100%;background:#fff;">
                                <option value="income">Income Stream</option>
                                <option value="expense">Operational Expense</option>
                                <option value="asset">Current / Fixed Asset</option>
                                <option value="liability">Liability Entity</option>
                                <option value="equity">Capital Equity</option>
                            </select>
                        </div>
                        <div style="margin-bottom:12px;">
                            <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Account Legal Name *</label>
                            <input type="text" id="coa-new-name" class="filter-input" placeholder="e.g. Courier Logistics Charge" style="width:100%;">
                        </div>
                        <div style="margin-bottom:16px;">
                            <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Ledger Index Code</label>
                            <input type="text" id="coa-new-code" class="filter-input" placeholder="e.g. EXP-LOG-004" style="width:100%;">
                        </div>
                        <button class="btn btn-primary" style="width:100%;border-radius:8px;font-weight:800;" onclick="submitCreateCOAAccount()">
                            💾 Provision Secure COA Entry
                        </button>
                    </div>
                </div>
            </div>

            <div id="acc-tab-expenses" class="acc-view-pane" style="display:none;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                    <!-- Record Expense Voucher -->
                    <div style="background:var(--bg);padding:24px;border-radius:16px;border:1px solid var(--border);">
                        <h3 style="font-size:1.15rem;color:#b91c1c;margin-bottom:16px;display:flex;align-items:center;gap:6px;">
                            <span>💸</span> Submit Expense Voucher
                        </h3>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                            <div>
                                <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Expense Account mapped *</label>
                                <select id="exp-sel-acc" class="filter-input" style="width:100%;"></select>
                            </div>
                            <div>
                                <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Payee Entity Name</label>
                                <input type="text" id="exp-payee" class="filter-input" placeholder="e.g. BlueDart Shipping" style="width:100%;">
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                            <div>
                                <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Gross Disbursed Amount *</label>
                                <input type="number" id="exp-amt" class="filter-input" placeholder="₹0.00" style="width:100%;font-weight:700;color:#b91c1c;">
                            </div>
                            <div>
                                <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Contained Tax Split</label>
                                <input type="number" id="exp-tax" class="filter-input" placeholder="₹0.00" style="width:100%;">
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                            <div>
                                <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Payment Method</label>
                                <select id="exp-mode" class="filter-input" style="width:100%;background:#fff;">
                                    <option value="Bank Transfer">Bank NEFT/RTGS</option>
                                    <option value="Cash">Petty Cash Store</option>
                                    <option value="Credit Card">Corporate Credit Card</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Invoice / Ref No</label>
                                <input type="text" id="exp-ref" class="filter-input" placeholder="e.g. INV-BD-2026" style="width:100%;">
                            </div>
                        </div>
                        <div style="margin-bottom:12px;">
                            <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Scan Receipt Bill File Attachment</label>
                            <input type="file" id="exp-file" class="filter-input" accept="image/*" style="width:100%;padding:4px;">
                            <span style="font-size:0.65rem;color:var(--muted);display:block;margin-top:2px;">Images compressed and embedded securely inside ledger voucher objects.</span>
                        </div>
                        <div style="margin-bottom:16px;">
                            <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Voucher Audit Notes</label>
                            <input type="text" id="exp-notes" class="filter-input" placeholder="Operational descriptive justification string" style="width:100%;">
                        </div>
                        <button class="btn btn-primary" style="width:100%;height:44px;font-weight:800;border-radius:8px;background:#b91c1c;border-color:#b91c1c;" onclick="submitAccountingExpense()">
                            📤 File Voucher Document & Post Auto Journal Entries
                        </button>
                    </div>

                    <!-- Record Direct Payment Revenue -->
                    <div style="background:var(--bg);padding:24px;border-radius:16px;border:1px solid var(--border);">
                        <h3 style="font-size:1.15rem;color:#15803d;margin-bottom:16px;display:flex;align-items:center;gap:6px;">
                            <span>📥</span> File Incoming Revenue Ledger
                        </h3>
                        <div style="margin-bottom:12px;">
                            <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Revenue Ledger Account mapped *</label>
                            <select id="pay-sel-acc" class="filter-input" style="width:100%;"></select>
                        </div>
                        <div style="margin-bottom:12px;">
                            <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Received Sum *</label>
                            <input type="number" id="pay-amt" class="filter-input" placeholder="₹0.00" style="width:100%;font-weight:800;color:#15803d;">
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                            <div>
                                <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Transfer Route</label>
                                <select id="pay-mode" class="filter-input" style="width:100%;background:#fff;">
                                    <option value="UPI">UPI Merchant Pay</option>
                                    <option value="Card Gateway">Card Digital Swipe</option>
                                    <option value="Bank Wire">Direct Wire Acct</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Source Entity ID</label>
                                <input type="text" id="pay-ref-id" class="filter-input" placeholder="e.g. Cust ID or Tx Ref" style="width:100%;">
                            </div>
                        </div>
                        <div style="margin-bottom:16px;">
                            <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">General Account Notes</label>
                            <input type="text" id="pay-notes" class="filter-input" placeholder="Manual external tracking note mapping" style="width:100%;">
                        </div>
                        <button class="btn btn-primary" style="width:100%;height:44px;font-weight:800;border-radius:8px;background:#15803d;border-color:#15803d;" onclick="submitAccountingPayment()">
                            📥 Register Inward Cash receipt & Synchronize Ledger
                        </button>
                    </div>
                </div>
            </div>

            <!-- Advanced Reports Engine -->
            <div id="acc-tab-reports" class="acc-view-pane" style="display:none;">
                <div style="background:var(--bg);padding:24px;border-radius:16px;border:1px solid var(--border);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
                        <div>
                            <h3 style="font-size:1.25rem;color:var(--accent);font-weight:800;">📈 Multi-Format Consolidated P&L Audit Statement</h3>
                            <p style="font-size:0.85rem;color:var(--muted);">Calculates double-entry line segments live across selected locations and periods.</p>
                        </div>
                        <!-- State of the art automated exports suite -->
                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            <button class="btn btn-sm" style="background:#0284c7;color:#fff;border-radius:8px;font-weight:700;" onclick="exportAccountingCSV()">
                                📊 Download Excel CSV
                            </button>
                            <button class="btn btn-sm" style="background:#dc2626;color:#fff;border-radius:8px;font-weight:700;" onclick="exportAccountingPDF()">
                                📄 Export Formatted PDF
                            </button>
                            <button class="btn btn-sm" style="background:#059669;color:#fff;border-radius:8px;font-weight:700;" onclick="triggerEmailReportPayload()">
                                ✉️ Email Report Statement
                            </button>
                        </div>
                    </div>

                    <!-- Dynamic Report Rendering Wrapper -->
                    <div id="acc-pl-render-canvas">Loading real-time P&L audit logs...</div>
                </div>
            </div>
        </div>
    `;

    // Populate localized active store list dropdown
    const srSel = document.getElementById('acc-filter-showroom');
    const rSr = await api(`/api/showrooms?business_id=${BIZ}`);
    if (rSr?.success && srSel) {
        srSel.innerHTML += rSr.data.map(s => `<option value="${s.showroom_id}">${s.showroom_name}</option>`).join('');
        const saved = sessionStorage.getItem('global_showroom');
        if (saved) srSel.value = saved;
    }

    // Default dates mapping
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const startInp = document.getElementById('acc-filter-start');
    const endInp   = document.getElementById('acc-filter-end');
    if (startInp) startInp.value = firstDay.toISOString().split('T')[0];
    if (endInp)   endInp.value   = now.toISOString().split('T')[0];

    // Load available accounts for the select input modals early
    await loadAccountingSelects();
    await refreshAccountingModule();
};

window.switchAccTab = function(paneId) {
    document.querySelectorAll('.acc-tab-btn').forEach(b => {
        b.classList.remove('active');
        b.classList.add('btn-outline');
    });
    event.currentTarget.classList.add('active');
    event.currentTarget.classList.remove('btn-outline');

    document.querySelectorAll('.acc-view-pane').forEach(p => p.style.display = 'none');
    const target = document.getElementById(`acc-tab-${paneId}`);
    if (target) target.style.display = 'block';

    // Rerender sub elements if navigating
    if (paneId === 'ledger')  loadAccountingLedgerList();
    if (paneId === 'coa')     loadAccountingCOATree();
    if (paneId === 'reports') loadAccountingPLStatement();
};

window.refreshAccountingModule = async function() {
    // 1. Refresh global metrics strip
    const sr    = g('acc-filter-showroom') || '';
    const start = g('acc-filter-start') || '';
    const end   = g('acc-filter-end') || '';

    let url = `/api/accounting/dashboard?business_id=${BIZ}`;
    if (sr)    url += `&showroom_id=${sr}`;
    if (start) url += `&start_date=${start}`;
    if (end)   url += `&end_date=${end}`;

    const r = await api(url);
    if (r?.success && r.data) {
        const f = typeof fmt === 'function' ? fmt : (v => `₹${parseFloat(v||0).toFixed(2)}`);
        document.getElementById('acc-kpi-inc').innerText  = f(r.data.total_income);
        document.getElementById('acc-kpi-exp').innerText  = f(r.data.total_expense);
        document.getElementById('acc-kpi-pend').innerText = f(r.data.outstanding_receivables);
        document.getElementById('acc-kpi-net').innerText  = f(r.data.net_position);

        // Populate premium auxiliary split streams
        const eP = document.getElementById('acc-kpi-petty');
        const eO = document.getElementById('acc-kpi-online');
        const eA = document.getElementById('acc-kpi-sall');
        const eS = document.getElementById('acc-kpi-spos');
        const eE = document.getElementById('acc-kpi-secom');

        if (eP) eP.innerText = f(r.data.petty_cash_amount);
        if (eO) eO.innerText = f(r.data.online_payment_amount);
        if (eA) eA.innerText = f(r.data.total_sales_all);
        if (eS) eS.innerText = f(r.data.total_sales_pos);
        if (eE) eE.innerText = f(r.data.total_sales_ecommerce);
    }

    // 2. Refresh initial preview tx box
    const txBox = document.getElementById('acc-dash-tx-box');
    if (txBox) {
        let txUrl = `/api/accounting/transactions?business_id=${BIZ}`;
        if (sr) txUrl += `&showroom_id=${sr}`;
        const txR = await api(txUrl);
        if (txR?.success && txR.data?.length) {
            txBox.innerHTML = `
                <table class="data-table" style="margin:0;font-size:0.8rem;">
                    <thead>
                        <tr style="background:var(--bg-subtle);">
                            <th>Timestamp</th>
                            <th>Reference Document</th>
                            <th>Showroom Location</th>
                            <th>Ledger Flow Split</th>
                            <th style="text-align:right;">Booked Net Sum</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${txR.data.slice(0, 5).map(t => `
                            <tr>
                                <td style="color:var(--muted);font-size:0.75rem;">${typeof fmtDate === 'function' ? fmtDate(t.date) : t.date}</td>
                                <td>
                                    <b style="color:var(--accent);text-transform:capitalize;">${t.reference_type || 'Journal'}</b>
                                    <div style="font-size:0.7rem;color:var(--muted);">${t.notes || 'N/A'}</div>
                                </td>
                                <td>${t.showroom_name || 'Central Head-Office'}</td>
                                <td style="font-size:0.75rem;color:#059669;">Synchronized Double Lines</td>
                                <td style="text-align:right;font-weight:800;color:${t.reference_type==='expense'?'#dc2626':'#16a34a'};">
                                    ${t.reference_type==='expense'?'-':'+'}${typeof fmt === 'function' ? fmt(t.total_amount) : t.total_amount}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            txBox.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted);">No journal sequences found matching parameters</div>`;
        }
    }

    // Refresh reactive sub-panes if currently displayed
    loadAccountingLedgerList();
    loadAccountingCOATree();
    loadAccountingPLStatement();
};

window.applyAccountingDatePreset = function() {
    const val = document.getElementById('acc-filter-preset')?.value;
    const w = document.getElementById('acc-custom-dates-wrapper');
    const st = document.getElementById('acc-filter-start');
    const en = document.getElementById('acc-filter-end');
    if (!st || !en) return;

    if (w) w.style.display = val === 'custom' ? 'flex' : 'none';

    const now = new Date();
    const fmtStr = d => {
        const yr = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        return `${yr}-${mo}-${da}`;
    };

    if (val === 'today') {
        st.value = fmtStr(now);
        en.value = fmtStr(now);
    } else if (val === '7days') {
        const d = new Date();
        d.setDate(now.getDate() - 7);
        st.value = fmtStr(d);
        en.value = fmtStr(now);
    } else if (val === 'month') {
        st.value = fmtStr(new Date(now.getFullYear(), now.getMonth(), 1));
        en.value = fmtStr(now);
    } else if (val === 'lastmonth') {
        const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last  = new Date(now.getFullYear(), now.getMonth(), 0);
        st.value = fmtStr(first);
        en.value = fmtStr(last);
    } else if (val === 'quarter') {
        const qtrMonth = Math.floor(now.getMonth() / 3) * 3;
        const first = new Date(now.getFullYear(), qtrMonth - 3, 1);
        const last  = new Date(now.getFullYear(), qtrMonth, 0);
        st.value = fmtStr(first);
        en.value = fmtStr(last);
    } else if (val === '6months') {
        const first = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        st.value = fmtStr(first);
        en.value = fmtStr(now);
    } else if (val === 'year') {
        st.value = fmtStr(new Date(now.getFullYear(), 0, 1));
        en.value = fmtStr(now);
    }

    refreshAccountingModule();
};

window.loadAccountingSelects = async function() {
    const rAcc = await api(`/api/accounting/accounts?business_id=${BIZ}`);
    const expSel = document.getElementById('exp-sel-acc');
    const paySel = document.getElementById('pay-sel-acc');
    if (rAcc?.success && rAcc.data) {
        window.activeAccountingAccountsMap = rAcc.data;
        const expOptions = rAcc.data.filter(a => a.account_type === 'expense').map(a => `<option value="${a.account_id}">${a.account_name} [${a.code || 'N/A'}]</option>`).join('');
        const payOptions = rAcc.data.filter(a => a.account_type === 'income' || a.account_type === 'asset').map(a => `<option value="${a.account_id}">${a.account_name} [${a.code || 'N/A'}]</option>`).join('');
        if (expSel) expSel.innerHTML = expOptions;
        if (paySel) paySel.innerHTML = payOptions;
    }
};

window.loadAccountingLedgerList = async function() {
    const box = document.getElementById('acc-full-ledger-area');
    if (!box) return;

    const sr = g('acc-filter-showroom') || '';
    let url = `/api/accounting/transactions?business_id=${BIZ}`;
    if (sr) url += `&showroom_id=${sr}`;

    const r = await api(url);
    if (!r?.success || !r.data?.length) {
        box.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted);">Ledger journal stream is completely empty</div>`;
        return;
    }

    box.innerHTML = `
        <table class="data-table" style="font-size:0.8rem;margin:0;">
            <thead>
                <tr>
                    <th>Journal Base GUID</th>
                    <th>Date Logged</th>
                    <th>Source Map</th>
                    <th>Showroom Target</th>
                    <th>Double Entry Legs Tracking</th>
                    <th style="text-align:right;">Gross Amount</th>
                </tr>
            </thead>
            <tbody>
                ${r.data.map(j => `
                    <tr>
                        <td style="font-family:monospace;font-size:0.75rem;color:var(--accent);">${j.journal_id}</td>
                        <td style="color:#666;">${typeof fmtDate === 'function' ? fmtDate(j.date) : j.date}</td>
                        <td>
                            <b style="text-transform:capitalize;">${j.reference_type}</b>
                            <div style="font-size:0.7rem;color:#888;">${j.notes || ''}</div>
                        </td>
                        <td>${j.showroom_name || 'Central Base'}</td>
                        <td>
                            <div style="font-size:0.7rem;background:#f8fafc;padding:4px;border-radius:4px;border:1px solid #e2e8f0;">
                                ${(j.lines || []).map(l => `
                                    <div style="display:flex;justify-content:space-between;">
                                        <span style="color:#475569;">${l.account_name || l.account_id}</span>
                                        <b style="color:${l.debit_amount > 0 ? '#b91c1c':'#15803d'};">
                                            ${l.debit_amount > 0 ? 'DR ' + l.debit_amount : 'CR ' + l.credit_amount}
                                        </b>
                                    </div>
                                `).join('')}
                            </div>
                        </td>
                        <td style="text-align:right;font-weight:800;color:#0f172a;">${typeof fmt === 'function' ? fmt(j.total_amount) : j.total_amount}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
};

window.loadAccountingCOATree = async function() {
    const box = document.getElementById('acc-coa-tree');
    if (!box) return;

    const r = await api(`/api/accounting/accounts?business_id=${BIZ}`);
    if (!r?.success || !r.data) {
        box.innerHTML = `<div style="padding:20px;color:#ef4444;">Failed to fetch Chart of Accounts payload structure</div>`;
        return;
    }

    const groups = { income: [], expense: [], asset: [], liability: [], equity: [] };
    r.data.forEach(a => { if (groups[a.account_type]) groups[a.account_type].push(a); });

    box.innerHTML = Object.keys(groups).map(typeKey => `
        <div style="margin-bottom:16px;border:1px solid var(--border);border-radius:12px;overflow:hidden;">
            <div style="background:var(--bg-subtle);padding:10px 16px;font-weight:800;color:var(--accent);text-transform:uppercase;font-size:0.8rem;border-b:1px solid var(--border);">
                📂 ${typeKey} Classification Accounts (${groups[typeKey].length})
            </div>
            <div style="padding:12px;">
                ${groups[typeKey].length ? `
                    <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:10px;">
                        ${groups[typeKey].map(acc => `
                            <div style="background:var(--bg);padding:10px;border-radius:8px;border:1px solid var(--border);border-left:4px solid ${typeKey==='income'||typeKey==='asset'?'#16a34a':'#dc2626'};">
                                <b style="font-size:0.85rem;color:var(--foreground);display:block;">${acc.account_name}</b>
                                <span style="font-size:0.7rem;color:var(--muted);font-family:monospace;">${acc.code || 'NO-CODE'}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : `<span style="font-size:0.75rem;color:var(--muted);">No specific accounts provisioned under this layer yet</span>`}
            </div>
        </div>
    `).join('');
};

window.submitCreateCOAAccount = async function() {
    const name = g('coa-new-name')?.trim();
    const type = g('coa-new-type');
    const code = g('coa-new-code')?.trim();

    if (!name) return toast('Please specify secure account legal name string', 'warn');

    const payload = { account_name: name, account_type: type, code: code || `ACC-${type.toUpperCase().slice(0,3)}-${Date.now().toString().slice(-4)}` };
    const r = await postAPI('/api/accounting/accounts', payload);
    if (!r?.success) return toast(r.error || 'Failed provisioning account node', 'error');

    toast('✨ Secured COA node integrated automatically into global maps', 'success');
    g('coa-new-name').value = '';
    g('coa-new-code').value = '';
    loadAccountingSelects();
    loadAccountingCOATree();
};

window.submitAccountingExpense = async function() {
    const accId = g('exp-sel-acc');
    const amt   = parseFloat(g('exp-amt') || 0);
    if (!accId || amt <= 0) return toast('Please bind suitable cost center account and gross outward amount', 'warn');

    let base64Image = null;
    const fileInp = document.getElementById('exp-file');
    if (fileInp?.files?.[0]) {
        base64Image = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(fileInp.files[0]);
        });
    }

    const payload = {
        account_id:   accId,
        amount:       amt,
        tax_amount:   parseFloat(g('exp-tax') || 0),
        payee:        g('exp-payee'),
        payment_mode: g('exp-mode'),
        reference_no: g('exp-ref'),
        notes:        g('exp-notes'),
        bill_image:   base64Image,
        showroom_id:  g('acc-filter-showroom') || null
    };

    const r = await postAPI('/api/accounting/expenses', payload);
    if (!r?.success) return toast(r.error || 'Voucher commitment failure', 'error');

    toast('💸 Outward expense filed cleanly. Double journal synchronization legs executed!', 'success');
    g('exp-amt').value   = '';
    g('exp-tax').value   = '';
    g('exp-payee').value = '';
    g('exp-ref').value   = '';
    g('exp-notes').value = '';
    if (fileInp) fileInp.value = '';
    refreshAccountingModule();
};

window.submitAccountingPayment = async function() {
    const accId = g('pay-sel-acc');
    const amt   = parseFloat(g('pay-amt') || 0);
    if (!accId || amt <= 0) return toast('Please bind target incoming asset account and non-zero positive numeric sum', 'warn');

    const payload = {
        payment_type:   'incoming',
        amount:         amt,
        payment_mode:   g('pay-mode'),
        reference_type: 'direct_revenue',
        reference_id:   g('pay-ref-id'),
        account_id:     accId,
        notes:          g('pay-notes'),
        showroom_id:    g('acc-filter-showroom') || null
    };

    const r = await postAPI('/api/accounting/payments', payload);
    if (!r?.success) return toast(r.error || 'Revenue commitment failure', 'error');

    toast('📥 Revenue registered securely. Chart maps tracking state updated!', 'success');
    g('pay-amt').value    = '';
    g('pay-ref-id').value = '';
    g('pay-notes').value  = '';
    refreshAccountingModule();
};

window.loadAccountingPLStatement = async function() {
    const canvas = document.getElementById('acc-pl-render-canvas');
    if (!canvas) return;

    const sr    = g('acc-filter-showroom') || '';
    const start = g('acc-filter-start') || '';
    const end   = g('acc-filter-end') || '';

    let url = `/api/accounting/reports/pl?business_id=${BIZ}`;
    if (sr)    url += `&showroom_id=${sr}`;
    if (start) url += `&start_date=${start}`;
    if (end)   url += `&end_date=${end}`;

    const r = await api(url);
    if (!r?.success || !r.data) {
        canvas.innerHTML = `<div style="padding:20px;color:#ef4444;">P&L audit driver processing exception</div>`;
        return;
    }

    window.activePLReportData = r.data;
    const pl = r.data;

    canvas.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
            <!-- Revenues strip -->
            <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:12px;padding:16px;">
                <h4 style="font-size:0.95rem;font-weight:800;color:#166534;border-b:1px solid #dcfce7;padding-bottom:8px;margin-bottom:12px;display:flex;justify-content:space-between;">
                    <span>Revenues & Direct Incomes</span>
                    <span>Total: ₹${parseFloat(pl.total_income||0).toFixed(2)}</span>
                </h4>
                ${pl.income.length ? pl.income.map(i => `
                    <div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:6px 0;border-bottom:1px dashed #dcfce7;">
                        <span style="color:#15803d;">${i.name}</span>
                        <b style="color:#166534;">₹${parseFloat(i.amount).toFixed(2)}</b>
                    </div>
                `).join('') : `<span style="font-size:0.75rem;color:#166534;opacity:0.6;">No classified operational revenue strings loaded</span>`}
            </div>

            <!-- Outflows strip -->
            <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:12px;padding:16px;">
                <h4 style="font-size:0.95rem;font-weight:800;color:#991b1b;border-b:1px solid #fee2e2;padding-bottom:8px;margin-bottom:12px;display:flex;justify-content:space-between;">
                    <span>Operational Expenditures</span>
                    <span>Total: ₹${parseFloat(pl.total_expense||0).toFixed(2)}</span>
                </h4>
                ${pl.expense.length ? pl.expense.map(e => `
                    <div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:6px 0;border-bottom:1px dashed #fee2e2;">
                        <span style="color:#b91c1c;">${e.name}</span>
                        <b style="color:#991b1b;">₹${parseFloat(e.amount).toFixed(2)}</b>
                    </div>
                `).join('') : `<span style="font-size:0.75rem;color:#991b1b;opacity:0.6;">No classified cost vouchers resolved</span>`}
            </div>
        </div>

        <!-- Consolidated bottom bar -->
        <div style="background:${pl.net_profit >= 0 ? '#15803d':'#b91c1c'};color:#fff;padding:16px 24px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 6px 16px rgba(0,0,0,0.15);">
            <div>
                <span style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;opacity:0.8;display:block;">Calculated Final Position</span>
                <b style="font-size:1.4rem;">Consolidated Net ${pl.net_profit >= 0 ? 'Profit Margin':'Loss Accrued'}</b>
            </div>
            <div style="font-size:2rem;font-weight:900;">
                ₹${parseFloat(pl.net_profit||0).toFixed(2)}
            </div>
        </div>
    `;
};

// State of the art exports suite execution modules
window.exportAccountingCSV = function() {
    const pl = window.activePLReportData;
    if (!pl) return toast('No report data stream cached', 'warn');

    let csv = '\uFEFF'; // UTF-8 BOM ensuring explicit rupee character support
    csv += 'Enterprise P&L Summary Audit Statement\n';
    csv += `Export timestamp: ${new Date().toISOString()}\n\n`;

    csv += 'REVENUE CHANNELS,AMOUNT\n';
    (pl.income || []).forEach(i => csv += `"${i.name.replace(/"/g, '""')}",${i.amount}\n`);
    csv += `TOTAL GROSS INCOME,${pl.total_income}\n\n`;

    csv += 'DISBURSED OPERATING EXPENSES,AMOUNT\n';
    (pl.expense || []).forEach(e => csv += `"${e.name.replace(/"/g, '""')}",${e.amount}\n`);
    csv += `TOTAL GROSS OUTFLOW,${pl.total_expense}\n\n`;

    csv += `CALCULATED NET ACCRUED POSITION,${pl.net_profit}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `BlinkOpticals_Accounting_Audit_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('📊 Excel CSV data export compilation downloaded successfully', 'success');
};

window.exportAccountingPDF = function() {
    const pl = window.activePLReportData;
    if (!pl) return toast('No report data stream available to generate layout', 'warn');

    // Create an invisible printable frame document to format high quality PDF output via print preview
    const printWin = window.open('', '_blank');
    if (!printWin) return toast('Popup blocker stopped printable layout window generation', 'error');

    const html = `
        <html>
            <head>
                <title>Enterprise Accounting Report</title>
                <style>
                    body { font-family: 'Inter', sans-serif, Arial; color: #1e293b; padding: 40px; margin: 0; }
                    .hdr { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 32px; }
                    h1 { font-size: 24px; margin: 0; color: #0f172a; }
                    .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
                    .tbl { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 13px; }
                    .tbl th { background: #f1f5f9; padding: 10px; text-align: left; border-bottom: 1px solid #cbd5e1; }
                    .tbl td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
                    .tot { font-weight: bold; background: #f8fafc; }
                    .final { background: #0f172a; color: #fff; padding: 16px; font-size: 18px; text-align: right; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="hdr">
                    <h1>BlinkOpticals Enterprise ERP</h1>
                    <div class="meta">Official Double-Entry Accounting P&L Consolidated Statement | Timestamp: ${new Date().toLocaleString()}</div>
                </div>

                <h3>Gross Revenue Classifications</h3>
                <table class="tbl">
                    <thead><tr><th>Income Account Category Name</th><th style="text-align:right;">Booked Value (INR)</th></tr></thead>
                    <tbody>
                        ${pl.income.map(i => `<tr><td>${i.name}</td><td style="text-align:right;">₹${parseFloat(i.amount).toFixed(2)}</td></tr>`).join('')}
                        <tr class="tot"><td>Gross Revenue Inward Sum</td><td style="text-align:right;">₹${parseFloat(pl.total_income).toFixed(2)}</td></tr>
                    </tbody>
                </table>

                <h3>Disbursed Operational Expenses</h3>
                <table class="tbl">
                    <thead><tr><th>Cost Voucher Category Name</th><th style="text-align:right;">Disbursed Value (INR)</th></tr></thead>
                    <tbody>
                        ${pl.expense.map(e => `<tr><td>${e.name}</td><td style="text-align:right;">₹${parseFloat(e.amount).toFixed(2)}</td></tr>`).join('')}
                        <tr class="tot"><td>Gross Expended Outflow Sum</td><td style="text-align:right;">₹${parseFloat(pl.total_expense).toFixed(2)}</td></tr>
                    </tbody>
                </table>

                <div class="final">
                    Consolidated Net Position Margin: ₹${parseFloat(pl.net_profit).toFixed(2)}
                </div>
                
                <script>
                    window.onload = function() { window.print(); };
                </script>
            </body>
        </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
    toast('📄 Formatted PDF printable buffer compiled successfully', 'success');
};

window.triggerEmailReportPayload = async function() {
    const pl = window.activePLReportData;
    if (!pl) return toast('No report loaded to dispatch via email payload', 'warn');

    const emailTarget = prompt('Enter authorized destination auditor/manager email address:', 'auditor@blinkopticals.enterprise');
    if (!emailTarget) return;

    toast('✉️ Compiling secure multi-format payload bytes and dispatching via mail channels...', 'info');

    const payload = {
        recipient: emailTarget,
        statement_data: pl,
        generated_timestamp: new Date().toISOString()
    };

    const r = await postAPI('/api/accounting/export/email', payload);
    if (!r?.success) return toast(r.error || 'SMTP delivery interface connection failure', 'error');

    toast(`🎉 Secure Accounting Report attachment dispatched directly to: ${emailTarget}`, 'success');
};
