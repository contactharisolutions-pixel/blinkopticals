const express = require('express');
const router = express.Router();
const db = require('../db');
const guards = require('../middleware/roleGuards');

let cmsTablesCreated = false;
async function ensureCmsTablesExist() {
    if (cmsTablesCreated) return;
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS pages (
                id TEXT PRIMARY KEY,
                business_id TEXT NOT NULL DEFAULT 'biz_blink_001',
                page_name TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                page_type TEXT NOT NULL DEFAULT 'custom',
                status TEXT NOT NULL DEFAULT 'draft',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS page_sections (
                id TEXT PRIMARY KEY,
                page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
                section_type TEXT NOT NULL,
                section_order INTEGER NOT NULL DEFAULT 0,
                content_json JSONB NOT NULL DEFAULT '{}',
                status TEXT NOT NULL DEFAULT 'published',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS page_seo (
                page_id TEXT PRIMARY KEY REFERENCES pages(id) ON DELETE CASCADE,
                seo_title TEXT,
                seo_description TEXT,
                seo_keywords TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS cms_banners (
                banner_id VARCHAR(50) PRIMARY KEY,
                business_id VARCHAR(50),
                title VARCHAR(255),
                image VARCHAR(255),
                link VARCHAR(255),
                banner_type VARCHAR(50),
                active_status BOOLEAN DEFAULT TRUE
            );
            CREATE TABLE IF NOT EXISTS blog (
                blog_id VARCHAR(50) PRIMARY KEY,
                business_id VARCHAR(50),
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL,
                content TEXT,
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        const { rows } = await db.query('SELECT id FROM pages WHERE slug = $1', ['home']);
        if (!rows.length) {
            const homeId = 'pg_home_001';
            await db.query(`
                INSERT INTO pages (id, business_id, page_name, slug, page_type, status)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (slug) DO NOTHING
            `, [homeId, 'biz_blink_001', 'Homepage Storefront', 'home', 'home', 'published']);
            await db.query(`
                INSERT INTO page_seo (page_id, seo_title, seo_description)
                VALUES ($1, $2, $3)
                ON CONFLICT (page_id) DO NOTHING
            `, [homeId, 'BlinkOpticals — Premium Eyewear & Clinical Care', 'Discover luxury frames, custom prescription lenses, and state of the art optometry services.']);
            await db.query(`
                INSERT INTO page_sections (id, page_id, section_type, section_order, content_json, status)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, ['sec_hero_001', homeId, 'hero', 0, JSON.stringify({
                speed: 6,
                effect: 'zoom',
                slides: [{
                    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80',
                    title: 'Ultimate Vision. Unmatched Elegance.',
                    subtitle: 'Experience state-of-the-art diagnostic clarity combined with world-class designer frames.',
                    button_text: 'Explore Collection',
                    button_link: '/#/shop',
                    align: 'left',
                    text_color: '#ffffff',
                    overlay_color: '#000000',
                    accent_color: '#ec691f'
                }]
            }), 'published']);
        }
        cmsTablesCreated = true;
        console.log('[CMS] Verified & auto-provisioned resilient Website CMS data schemas successfully.');
    } catch (err) {
        console.error('[CMS Schema Init Error]', err.message);
    }
}

router.use(async (req, res, next) => {
    await ensureCmsTablesExist();
    next();
});

// ─── PAGE MANAGEMENT ──────────────────────────────────────────────────────────

// GET /api/cms/pages
router.get('/pages', guards.marketing, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM pages ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/cms/pages
router.get('/pages/:id', guards.marketing, async (req, res) => {
    try {
        const page = await db.query('SELECT * FROM pages WHERE id = $1', [req.params.id]);
        if (page.rows.length === 0) return res.status(404).json({ success: false, error: 'Page not found' });
        
        const seo = await db.query('SELECT * FROM page_seo WHERE page_id = $1', [req.params.id]);
        const sections = await db.query('SELECT * FROM page_sections WHERE page_id = $1 ORDER BY section_order ASC', [req.params.id]);
        
        res.json({ 
            success: true, 
            data: { 
                ...page.rows[0], 
                seo: seo.rows[0] || {}, 
                sections: sections.rows 
            } 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/cms/pages
router.post('/pages', guards.marketing, async (req, res) => {
    const { page_name, slug, page_type, status } = req.body;
    const id = 'pg_' + Date.now().toString(36);
    try {
        await db.query(`
            INSERT INTO pages (id, page_name, slug, page_type, status)
            VALUES ($1, $2, $3, $4, $5)
        `, [id, page_name, slug, page_type || 'custom', status || 'draft']);
        
        // Init SEO
        await db.query('INSERT INTO page_seo (page_id) VALUES ($1)', [id]);
        
        res.json({ success: true, data: { id } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/cms/pages/:id
router.put('/pages/:id', guards.marketing, async (req, res) => {
    const { page_name, slug, page_type, status, seo } = req.body;
    try {
        await db.query(`
            UPDATE pages SET page_name = $1, slug = $2, page_type = $3, status = $4, updated_at = NOW()
            WHERE id = $5
        `, [page_name, slug, page_type, status, req.params.id]);
        
        if (seo) {
            await db.query(`
                INSERT INTO page_seo (page_id, seo_title, seo_description, seo_keywords)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (page_id) DO UPDATE SET
                seo_title = EXCLUDED.seo_title,
                seo_description = EXCLUDED.seo_description,
                seo_keywords = EXCLUDED.seo_keywords,
                updated_at = NOW()
            `, [req.params.id, seo.seo_title, seo.seo_description, seo.seo_keywords]);
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/cms/pages/:id
router.delete('/pages/:id', guards.marketing, async (req, res) => {
    try {
        await db.query('DELETE FROM pages WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── SECTION MANAGEMENT ───────────────────────────────────────────────────────

// POST /api/cms/pages/:id/sections
router.post('/pages/:id/sections', guards.marketing, async (req, res) => {
    const { section_type, section_order, content_json } = req.body;
    const id = 'sec_' + Date.now().toString(36);
    try {
        await db.query(`
            INSERT INTO page_sections (id, page_id, section_type, section_order, content_json)
            VALUES ($1, $2, $3, $4, $5)
        `, [id, req.params.id, section_type, section_order || 0, JSON.stringify(content_json || {})]);
        res.json({ success: true, data: { id } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/cms/sections/:id
router.put('/sections/:id', guards.marketing, async (req, res) => {
    const { section_type, section_order, content_json, status } = req.body;
    try {
        await db.query(`
            UPDATE page_sections SET 
            section_type = COALESCE($1, section_type),
            section_order = COALESCE($2, section_order),
            content_json = COALESCE($3, content_json),
            status = COALESCE($4, status),
            updated_at = NOW()
            WHERE id = $5
        `, [section_type, section_order, content_json ? JSON.stringify(content_json) : null, status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/cms/sections/:id
router.delete('/sections/:id', guards.marketing, async (req, res) => {
    try {
        await db.query('DELETE FROM page_sections WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/cms/public/page/:slug — Fully hydrated storefront page payload with live database bindings
router.get('/public/page/:slug', async (req, res) => {
    try {
        await ensureCmsTablesExist();
        const { slug } = req.params;
        const biz = req.query.business_id || 'biz_blink_001';

        // 1. Fetch Page
        const pageRes = await db.query('SELECT * FROM pages WHERE slug = $1 AND status = $2 LIMIT 1', [slug, 'published']);
        if (!pageRes.rows.length) {
            return res.status(404).json({ success: false, error: 'Storefront page node not found or inactive' });
        }
        const page = pageRes.rows[0];

        // 2. Fetch SEO
        const seoRes = await db.query('SELECT * FROM page_seo WHERE page_id = $1 LIMIT 1', [page.id]);
        const seo = seoRes.rows[0] || {};

        // 3. Fetch Sections ordered
        const secRes = await db.query('SELECT * FROM page_sections WHERE page_id = $1 AND status = $2 ORDER BY section_order ASC', [page.id, 'published']);
        const sections = secRes.rows;

        // 4. Hydrate / Enrich dynamic live sections (e.g. products) with active stock bindings
        const enrichedSections = await Promise.all(sections.map(async (sec) => {
            let content = sec.content_json || {};
            if (typeof content === 'string') {
                try { content = JSON.parse(content); } catch (_) { content = {}; }
            }

            // Hydrate product section logic natively
            if (sec.section_type === 'product') {
                const limit = parseInt(content.limit) || 8;
                let q = 'SELECT p.product_id, p.product_name, p.model_no, p.mrp, p.selling_price, p.main_image, b.name AS brand_name FROM product p LEFT JOIN brands b ON p.brand_id = b.id WHERE p.business_id = $1 AND p.active_status = true AND p.is_published = true';
                const params = [biz];

                if (content.filter === 'category' && content.category) {
                    q += ' AND p.category_id IN (SELECT id FROM categories WHERE name ILIKE $2)';
                    params.push(content.category);
                } else if (content.filter === 'new') {
                    q += ' ORDER BY p.created_at DESC';
                } else if (content.filter === 'trending') {
                    q += ' ORDER BY p.selling_price DESC';
                } else {
                    q += ' ORDER BY p.product_name ASC';
                }

                q += ` LIMIT ${limit}`;
                try {
                    const prodRes = await db.query(q, params);
                    content.resolved_products = prodRes.rows;
                } catch (dbErr) {
                    content.resolved_products = [];
                }
            }

            return {
                id: sec.id,
                section_type: sec.section_type,
                section_order: sec.section_order,
                content
            };
        }));

        res.json({
            success: true,
            data: {
                id: page.id,
                page_name: page.page_name,
                slug: page.slug,
                page_type: page.page_type,
                seo,
                sections: enrichedSections
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
