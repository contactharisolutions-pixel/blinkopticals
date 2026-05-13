// ERP Core v2 — Async Auth Bootstrap, Navigation, API, UI helpers
// FIX: sessionStorage is NOT shared with iframes. Auth now falls back to
//      JWT cookie via /api/auth/me so the legacy panel always initialises
//      correctly whether loaded directly or embedded in the React shell.
'use strict';

const SESSION_KEY = 'erp_user';

// ── Formatters (defined early so they can be used inside the IIFE) ────
window.fmt    = n => '₹' + parseFloat(n||0).toLocaleString('en-IN',{minimumFractionDigits:2, maximumFractionDigits:2});
window.fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
window.badge  = function(s) {
    const map = {
        paid:'badge-green', success:'badge-green', Active:'badge-green', active:'badge-green', true:'badge-green', Booked:'badge-green', Completed:'badge-green',
        partial:'badge-yellow', Processing:'badge-yellow', Pending:'badge-yellow', pending:'badge-yellow', New:'badge-yellow', Draft:'badge-yellow',
        cancelled:'badge-red', failed:'badge-red', Received:'badge-blue', Shipped:'badge-blue'
    };
    const cls = map[String(s)] || 'badge-gray';
    return `<span class="badge ${cls}">${s}</span>`;
};
window.skelRows = (n, cols = 6) => Array(n).fill(`<tr>${Array(cols).fill('<td><div class="skeleton" style="height:14px; width:80%; border-radius:4px"></div></td>').join('')}</tr>`).join('');

// ── API (defined early, used during auth bootstrap) ──────────────────
window.api = async function(path, opts = {}) {
    console.log(`📡 [API]: ${path}`);
    try {
        const res = await fetch(path, { credentials:'include', headers:{'Content-Type':'application/json'}, ...opts });
        if (res.status === 401) {
            console.warn(`[API 401] Session expired. Redirecting to login.`);
            sessionStorage.clear();
            (window.self !== window.top ? window.top : window).location.href = '/admin/login';
            return { success: false, error: 'Unauthorized' };
        }
        const text = await res.text();
        try { return JSON.parse(text); }
        catch (je) {
            console.error(`[Parse Error] Non-JSON response at ${path}:`, text.slice(0, 200));
            throw new Error(`Server returned HTML instead of JSON`);
        }
    } catch (fe) {
        console.error(`[Fetch Error]`, fe);
        throw fe;
    }
};
window.postAPI  = (path, body) => api(path, { method:'POST',  body: JSON.stringify(body) });
window.putAPI   = (path, body) => api(path, { method:'PUT',   body: JSON.stringify(body) });
window.patchAPI = (path, body) => api(path, { method:'PATCH', body: JSON.stringify(body) });
window.deleteAPI= (path)       => api(path, { method:'DELETE' });

// ── Toast ─────────────────────────────────────────────────────────────
window.toast = function(msg, type='success') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = type==='error' ? '#ef4444' : type==='warn' ? '#f59e0b' : type==='info' ? '#3b82f6' : '#111';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
};

// ── Modal ─────────────────────────────────────────────────────────────
window.openModal = function(title, bodyHTML, sizeClass) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    const m = document.getElementById('modal');
    m.className = 'modal' + (sizeClass ? ' ' + sizeClass : '');
    m.classList.add('open');
    document.getElementById('modalOverlay').classList.add('open');
};
window.closeModal = function() {
    document.getElementById('modal').classList.remove('open');
    document.getElementById('modalOverlay').classList.remove('open');
};

// ── Navigation titles ─────────────────────────────────────────────────
const viewTitles = {
    dashboard:'Dashboard', pos:'POS — Point of Sale', pos_order:'🔬 POS Order — Optical Booking',
    orders:'Orders', products:'Standard Product Entry', ecommerce:'Ecommerce Product Management',
    inventory:'Inventory', showrooms:'Showrooms', business:'Business Setup', customers:'Customers',
    crm:'CRM & Leads', appointments:'Appointments', eyetests:'Eye Tests', repairs:'Repairs',
    loyalty:'Loyalty Program', offers:'Offers', coupons:'Coupons', campaigns:'Campaigns',
    reports:'Reports & Analytics', staff:'Staff Management', settings:'Settings',
    comm:'Communication & Notifications', master:'Master Data Management', media:'Media Library',
    bulk_import:'Bulk Product Import', ai_filler:'🤖 AI Intelligent Data Filler',
    accounting:'Accounting & Finance', purchase:'Purchase & Vendor Management',
    invoices:'🧾 Invoices Management', return_customer:'↩️ Return from Customer',
    return_vendor:'📤 Return to Vendor', damaged_goods:'💥 Damaged Goods Log',
    logistics:'🚚 Logistics & Shipping Management'
};

// ── Attach nav-item click handlers (synchronous — no USER dependency) ──
document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
        const view = el.dataset.view;
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(`view-${view}`);
        if (target) target.classList.add('active');
        const pt = document.getElementById('pageTitle');
        if (pt) pt.textContent = viewTitles[view] || view;
        if (window[`load_${view}`]) window[`load_${view}`]();
    });
});

// ── Listen for SWITCH_VIEW postMessage from React shell ───────────────
window.switchView = function(view) {
    const el = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (el) el.click();
};
window.addEventListener('message', (event) => {
    if (!event.data) return;
    
    if (event.data.type === 'SWITCH_VIEW') {
        window.switchView(event.data.view);
    }
    
    if (event.data.type === 'SYNC_AUTH' && event.data.user) {
        console.log('[ERP Auth] Syncing session from parent window...');
        const user = event.data.user;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        window.USER = user;
        window.BIZ  = user.business_id || 'biz_blink_001';
        
        // Hydrate UI if bootstrap hasn't finished or needs update
        ['sideName','topName'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = user.name; });
        ['sideAva','topAva'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = (user.name||'A')[0].toUpperCase(); });
        const sr = document.getElementById('sideRole'); if(sr) sr.textContent = user.role || '';
        
        filterSidebar(user);
    }

    if (event.data.type === 'SYNC_SHOWROOM' && event.data.showroom_id !== undefined) {
        console.log('[ERP Showroom] Syncing showroom from parent window:', event.data.showroom_id);
        const showroom_id = event.data.showroom_id;
        if (showroom_id) sessionStorage.setItem('global_showroom', showroom_id);
        else sessionStorage.removeItem('global_showroom');
        
        // Update the local dropdown if it exists (even if hidden)
        const sel = document.getElementById('globalShowroom');
        if (sel) sel.value = showroom_id || '';
        
        // Trigger view refresh if active
        const active = document.querySelector('.nav-item.active');
        if (active && window[`load_${active.dataset.view}`]) {
            window[`load_${active.dataset.view}`]();
        }
    }
});

// ── Async Auth Bootstrap ───────────────────────────────────────────────
// sessionStorage is NOT shared across browsing contexts (iframes get their
// own empty storage). This IIFE first tries sessionStorage (fast path for
// direct access), then falls back to the JWT httpOnly cookie via /api/auth/me
// (which works in iframes because cookies are sent same-origin).
(async function bootstrap() {
    let USER = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');

    if (!USER) {
        console.log('[ERP Auth] sessionStorage empty — attempting cookie-based restore...');
        try {
            const [meRes, permRes] = await Promise.all([
                fetch('/api/auth/me', { credentials: 'include' }),
                fetch('/api/auth/permissions', { credentials: 'include' })
            ]);
            if (meRes.ok) {
                const me = await meRes.json();
                const perms = permRes.ok ? await permRes.json() : { permissions: [] };
                if (me.success && me.user) {
                    USER = {
                        id: me.user.id,
                        name: me.user.name || 'Admin',
                        role: me.user.role,
                        business_id: me.user.business_id,
                        showroom_id: me.user.showroom_id,
                        permissions: perms.permissions || []
                    };
                    sessionStorage.setItem(SESSION_KEY, JSON.stringify(USER));
                    console.log('[ERP Auth] Session restored from JWT cookie ✅');
                }
            }
        } catch (e) {
            console.warn('[ERP Auth] Cookie restore failed:', e.message);
        }
    }

    // If still no USER → redirect to login
    if (!USER) {
        console.warn('[ERP Auth] No valid session — redirecting to login.');
        (window.self !== window.top ? window.top : window).location.href = '/admin/login';
        return;
    }

    // ── Expose globals ────────────────────────────────────────────────
    window.USER = USER;
    window.BIZ  = USER.business_id || 'biz_blink_001';

    // ── Hydrate UI ────────────────────────────────────────────────────
    ['sideName','topName'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = USER.name; });
    ['sideAva','topAva'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = (USER.name||'A')[0].toUpperCase(); });
    const sr = document.getElementById('sideRole'); if(sr) sr.textContent = USER.role || '';
    const pd = document.getElementById('pageDate'); if(pd) pd.textContent = new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

    // ── Sidebar permission filter ─────────────────────────────────────
    await filterSidebar(USER);

    // ── Global filters (showroom selector) ───────────────────────────
    initFilters();

    // ── Apply theme preferences ───────────────────────────────────────
    applyGlobalPreferences();

    // ── Trigger active view ───────────────────────────────────────────
    setTimeout(() => {
        const active = document.querySelector('.nav-item.active');
        if (active) active.click();
    }, 150);

})(); // end bootstrap

// ── filterSidebar ─────────────────────────────────────────────────────
async function filterSidebar(USER) {
    const PERMS = USER?.permissions || [];

    // Refresh stale permissions or force injection if new modules missing from cached session
    if (USER && (!PERMS || PERMS.length === 0 || (USER.role && ['Admin','Manager','Showroom Manager'].includes(USER.role) && !PERMS.includes('invoices')))) {
        const r = await api('/api/auth/permissions');
        if (r && r.success) {
            USER.permissions = r.permissions;
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(USER));
            window.location.reload();
            return;
        }
    }

    document.querySelectorAll('.nav-item').forEach(el => {
        const view = el.dataset.view;
        let hasPerm = PERMS.includes(view);
        if (['eyetests','repairs','loyalty'].includes(view)) hasPerm = PERMS.includes('clinic');
        if (['offers','coupons','campaigns','comm'].includes(view)) hasPerm = PERMS.includes('marketing');
        if (view === 'pos_order') hasPerm = PERMS.includes('pos') || PERMS.includes('pos_order');
        
        // Auto-grant Returns & Invoices if staff role allows basic operations
        if (['invoices','return_customer','damaged_goods'].includes(view)) {
            hasPerm = hasPerm || ['Admin','Manager','Showroom Manager'].includes(USER?.role) || PERMS.includes('orders') || PERMS.includes('inventory');
        }
        if (view === 'return_vendor') {
            hasPerm = hasPerm || ['Admin','Manager','Warehouse Staff'].includes(USER?.role) || PERMS.includes('purchase');
        }
        if (['business','master','media','bulk_import','ecommerce','accounting','purchase','reports','ai_filler'].includes(view)) {
            hasPerm = hasPerm || USER?.role === 'Admin' || USER?.role === 'Manager';
        }
        el.style.display = hasPerm ? 'flex' : 'none';
    });

    document.querySelectorAll('.nav-group').forEach(group => {
        let next = group.nextElementSibling;
        let hasVisible = false;
        while (next && next.classList.contains('nav-item')) {
            if (next.style.display !== 'none') hasVisible = true;
            next = next.nextElementSibling;
        }
        group.style.display = hasVisible ? 'block' : 'none';
    });

    // Redirect away from an inactive view if permission missing
    const activeItem  = document.querySelector('.nav-item.active');
    const activeView  = activeItem ? activeItem.dataset.view : 'dashboard';
    let   initialPerm = PERMS.includes(activeView);
    if (['eyetests','repairs','loyalty'].includes(activeView)) initialPerm = PERMS.includes('clinic');
    if (activeView === 'settings') initialPerm = true;
    if (!initialPerm) {
        const firstAllowed = document.querySelector('.nav-item:not([style*="display: none"])');
        if (firstAllowed) firstAllowed.click();
    }
}

// ── initFilters (showroom dropdown) ──────────────────────────────────
async function initFilters() {
    const sel = document.getElementById('globalShowroom');
    if (!sel) return;
    const d = await api(`/api/showrooms?business_id=${window.BIZ}`);
    if (d.success) {
        d.data.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.showroom_id;
            opt.textContent = s.showroom_name;
            sel.appendChild(opt);
        });
        const saved = sessionStorage.getItem('global_showroom');
        if (saved) sel.value = saved;
    }
    sel.addEventListener('change', () => {
        sessionStorage.setItem('global_showroom', sel.value);
        const active = document.querySelector('.nav-item.active');
        if (active) active.click();
    });
}

// ── applyGlobalPreferences ────────────────────────────────────────────
async function applyGlobalPreferences() {
    try {
        const r = await api('/api/settings');
        if (r.success && r.data?.preferences) {
            if (r.data.preferences.dark_mode) document.body.classList.add('dark-mode');
            window.SYSTEM_PREFS = r.data.preferences;
        }
    } catch (e) { console.error('Failed to apply global prefs', e); }
}

// ── Logout ────────────────────────────────────────────────────────────
window.logout = async function() {
    await fetch('/api/auth/logout', { method:'POST', credentials:'include' });
    sessionStorage.clear();
    (window.self !== window.top ? window.top : window).location.href = '/admin/login';
};

window.getGlobalFilters = () => {
    const sr = document.getElementById('globalShowroom')?.value || '';
    return sr ? `&showroom_id=${sr}` : '';
};
