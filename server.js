/**
 * BlinkOpticals — Production API Server
 * Architecture: Modular Express, Connection Pooling (pg), JWT Auth
 */
'use strict';
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const path         = require('path');
const express      = require('express');
const helmet       = require('helmet');
const compression  = require('compression');
const morgan       = require('morgan');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');

// ─── App ──────────────────────────────────────────────────────────────────────
const app  = express();
app.use((req, res, next) => {
    if (!req.url.startsWith('/api')) return next(); // Quiet for assets
    console.log(`[ROUTE] ${req.method} ${req.url}`);
    next();
});
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(body) {
        if (req.url.startsWith('/api')) {
            console.log(`[RES] ${req.method} ${req.url} -> ${res.get('Content-Type')} (${res.statusCode})`);
        }
        return originalSend.apply(this, arguments);
    };
    next();
});
const PORT = process.env.PORT || 5174;

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 2000, // 2000 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Try again in 1 minute.' }
});
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: { success: false, error: 'Too many login attempts. Wait 10 minutes.' }
});
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// ─── API Routes ────────────────────────────────────────────────────────────────
const guards = require('./middleware/roleGuards');

app.use('/api/public',     require('./routes/public.routes')); 
app.use('/api/auth',       require('./routes/auth.routes'));
app.use('/api/media',      require('./routes/media.routes'));
app.use('/api/store-account', require('./routes/storefront_account.routes.js')); 
app.use('/api/master',     require('./routes/master.routes')); 

app.use('/api/products',   guards.products, require('./routes/products.routes'));
app.use('/api/orders',     guards.orders,   require('./routes/orders.routes'));
app.use('/api/customers',  guards.customers, require('./routes/customers.routes'));
app.use('/api/inventory',  guards.inventory, require('./routes/inventory.routes'));
app.use('/api/accounting', guards.accounting,require('./routes/accounting.routes'));
app.use('/api/purchase',   guards.purchase,  require('./routes/purchase.routes'));
app.use('/api/reports',    guards.reports,   require('./routes/reports.routes'));
app.use('/api/ai-filler',  require('./routes/ai_filler.routes'));
app.use('/api/ai',         require('./routes/ai.routes'));
app.use('/api/payment',    guards.payment,   require('./routes/payment.routes'));
app.use('/api/email',      guards.email,     require('./routes/email.routes'));
app.use('/api/showrooms',  guards.showrooms, require('./routes/showrooms.routes'));
app.use('/api/catalog',    guards.products,  require('./routes/catalog.routes'));
app.use('/api/crm',        guards.crm,       require('./routes/crm.routes'));
app.use('/api/marketing',  guards.marketing, require('./routes/marketing.routes'));
app.use('/api/cms',        guards.marketing, require('./routes/cms.routes'));
app.use('/api/clinic',     guards.clinic,    require('./routes/clinic.routes'));
app.use('/api/staff',      guards.staff,     require('./routes/staff.routes'));
app.use('/api/business',   guards.staff,     require('./routes/business.routes')); 
app.use('/api/settings',   require('./routes/settings.routes')); 
app.use('/api/tax',        require('./routes/tax.routes')); 
app.use('/api/invoice',    require('./routes/invoice.routes')); 
app.use('/api/invoices',   guards.orders, require('./routes/invoices.routes'));
app.use('/api/comm',       require('./routes/communication.routes')); 
app.use('/api/logistics',  require('./routes/logistics.routes')); 
app.use('/api/access',     require('./routes/access.routes')); 
app.use('/api/transfers',  guards.inventory, require('./routes/transfers.routes')); 
app.use('/api/chat',       require('./routes/chat.routes'));
app.use('/api/seo',        require('./routes/seo.routes'));

app.get('/api/debug-db-counts', async (req, res) => {
    try {
        const db = require('./db');
        const TABLES = ['brands', 'categories', 'genders', 'frame_types', 'shapes', 'materials'];
        const counts = {};
        for (const t of TABLES) {
            const r = await db.query(`SELECT COUNT(*) as count FROM ${t} WHERE business_id = 'biz_blink_001'`);
            counts[t] = r.rows[0].count;
        }
        res.json({ success: true, counts });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── Admin HTML Routes (MUST be before static middleware) ────────────────────
// 1. Admin login page (static mapping handles /admin/login and /admin/login/index.html)
app.use('/admin/login', express.static(path.join(__dirname, 'public/admin/login')));

// 2. Serve admin static assets (CSS, JS, images) BEFORE the catch-all so iframes work
//    This MUST come before app.use('/admin') otherwise erp.css/erp-core.js return admin.html
app.use('/admin/css', express.static(path.join(__dirname, 'public/admin/css')));
app.use('/admin/js',  express.static(path.join(__dirname, 'public/admin/js')));
app.use('/admin/img', express.static(path.join(__dirname, 'public/admin/img')));

// 3. Legacy Vanilla JS dashboard → served for iframe-based modules
//    LegacyModuleWrapper loads: /legacy/admin/dashboard?iframe=true
app.use('/legacy', (req, res) => res.sendFile(path.join(__dirname, 'public/admin/dashboard/index.html')));

// 4. ALL /admin/* routes → clean React SPA (admin.html has ONLY React, no storefront HTML)
app.use('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// ─── Static Public Assets ───────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '.'), { index: false }));

// 404 Handler for API
app.use('/api', (req, res) => {
    console.warn(`[404] API Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ success: false, error: `API route not found: ${req.originalUrl}` });
});

// SPA fallback → storefront for all non-admin, non-api routes
app.get(/^(?!\/api)(?!\/admin).*/, (req, res) =>
    res.sendFile(path.join(__dirname, 'index.html'))
);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(`[UNHANDLED ERROR] ${req.method} ${req.url}:`, err);
    res.status(err.status || 500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// ─── Unhandled rejections ─────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => console.error('[UNHANDLED REJECTION]', reason));
process.on('uncaughtException',  (err)    => { console.error('[UNCAUGHT EXCEPTION]', err); process.exit(1); });

// ─── Start ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`
    ╔═══════════════════════════════════════╗
    ║  BlinkOpticals API v3.0 — PORT ${PORT}  ║
    ║  ENV: ${(process.env.NODE_ENV || 'development').padEnd(28)}║
    ║  Routes: Public, Auth, Master,        ║
    ║          Products, Orders, Customers  ║
    ║          Inventory, CRM, AI Filler    ║
    ╚═══════════════════════════════════════╝`);
    });
}

module.exports = app;

