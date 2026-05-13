// routes/seo.routes.js — Automated AI-Powered Mass SEO Operations Controller
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper to sanitize text outputs
const cleanJsonText = (str) => {
    return str.replace(/```json|```/g, '').trim();
};

// GET /api/seo/entities — Fetch targets by taxonomy namespace
router.get('/entities', auth, async (req, res) => {
    const { type } = req.query;
    const biz = req.user?.business_id || 'biz_blink_001';

    try {
        let rows = [];
        if (type === 'pages') {
            const resData = await db.query(`
                SELECT p.id, p.page_name as name, p.slug, s.seo_title, s.seo_description, s.seo_keywords 
                FROM pages p 
                LEFT JOIN page_seo s ON p.id = s.page_id 
                WHERE p.business_id = $1
                ORDER BY p.page_name ASC
            `, [biz]);
            rows = resData.rows;
        } else if (['brands', 'categories', 'genders'].includes(type)) {
            // Ensure columns exist first
            try {
                await db.query(`
                    ALTER TABLE ${type} 
                    ADD COLUMN IF NOT EXISTS seo_title TEXT, 
                    ADD COLUMN IF NOT EXISTS seo_description TEXT, 
                    ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
                `);
            } catch(e){}

            const resData = await db.query(`
                SELECT id, name, slug, seo_title, seo_description, seo_keywords 
                FROM ${type} 
                WHERE business_id = $1 
                ORDER BY name ASC
            `, [biz]);
            rows = resData.rows;
        } else if (type === 'products') {
            const resData = await db.query(`
                SELECT product_id as id, product_name as name, model_no, seo_title, seo_description, seo_keywords 
                FROM product 
                WHERE business_id = $1 AND active_status = true
                ORDER BY product_name ASC LIMIT 300
            `, [biz]);
            rows = resData.rows;
        } else {
            return res.status(400).json({ success: false, error: 'Invalid entity type requested' });
        }

        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/seo/generate — Execute Gemini AI prompt for a selected item or commit override
router.post('/generate', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { id, type, name, context, isManualOverride, manualData } = req.body;
    const biz = req.user?.business_id || 'biz_blink_001';

    // If manual commit override
    if (isManualOverride && manualData) {
        try {
            await commitSeoData(type, id, manualData.seo_title, manualData.seo_description, manualData.seo_keywords, biz);
            return res.json({ success: true, data: manualData });
        } catch (err) { return res.status(500).json({ success: false, error: err.message }); }
    }

    // Dynamic AI Prompt generation
    let generatedObj = {
        seo_title: `${name} Premium Collection | BlinkOpticals`,
        seo_description: `Explore the premier ${name} inventory selection at BlinkOpticals. Custom fitted diagnostics, verified authentic designer finishes, and lifetime warranty assurance.`,
        seo_keywords: `${name.toLowerCase()}, buy ${name.toLowerCase()} online, premium eyewear, designer opticals`
    };

    if (process.env.GEMINI_API_KEY) {
        try {
            const modelAI = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `You are an elite SEO Specialist for BlinkOpticals, a luxury optical brand.
            Task: Compose highly impactful Meta Tags for the following asset.
            Asset Type: ${type}
            Asset Name: ${name}
            Additional Context: ${context || 'Exclusive designer collection supporting custom certified Rx prescription integrations.'}

            Return ONLY a valid, compact JSON object structured exactly like this:
            {
                "seo_title": "Optimized Title containing Brand USP (50-60 chars)",
                "seo_description": "Compelling call to action description targeting organic clicks (130-155 chars)",
                "seo_keywords": "comma separated targeted primary keywords"
            }`;

            const result = await modelAI.generateContent(prompt);
            const raw = cleanJsonText((await result.response).text());
            const parsed = JSON.parse(raw);
            if (parsed.seo_title) generatedObj = parsed;
        } catch (e) {
            console.warn('[SEO AI Generation Fallback]', e.message);
        }
    }

    // Auto-commit generated rows to appropriate database tables
    try {
        await commitSeoData(type, id, generatedObj.seo_title, generatedObj.seo_description, generatedObj.seo_keywords, biz);
        res.json({ success: true, data: generatedObj });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/seo/bulk-generate — Batch processing array handler
router.post('/bulk-generate', auth, rbac('Admin', 'Manager'), async (req, res) => {
    const { items, type } = req.body; // items is array of { id, name }
    const biz = req.user?.business_id || 'biz_blink_001';
    if (!items || !items.length) return res.status(400).json({ success: false, error: 'Target items required' });

    let successCount = 0;
    const modelAI = process.env.GEMINI_API_KEY ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

    for (const item of items) {
        let title = `${item.name} Official Selection | BlinkOpticals`;
        let desc = `Discover our curated collection of ${item.name}. Featuring premium frames, advanced UV protection coatings, and tailored fitting guides.`;
        let kw = `${item.name.toLowerCase()}, designer ${item.name.toLowerCase()}, online optical store`;

        if (modelAI) {
            try {
                const prompt = `Generate JSON meta tags for Eyewear item. Type: ${type}, Name: ${item.name}. Format JSON exactly: {"seo_title":"...","seo_description":"...","seo_keywords":"..."}`;
                const result = await modelAI.generateContent(prompt);
                const raw = cleanJsonText((await result.response).text());
                const parsed = JSON.parse(raw);
                if (parsed.seo_title) {
                    title = parsed.seo_title;
                    desc = parsed.seo_description || desc;
                    kw = parsed.seo_keywords || kw;
                }
            } catch(e){}
        }

        try {
            await commitSeoData(type, item.id, title, desc, kw, biz);
            successCount++;
        } catch(e){}
    }

    res.json({ success: true, processed: successCount, total: items.length });
});

// Central query routing switch committing directly to designated schemas
async function commitSeoData(type, id, title, desc, kw, biz) {
    if (type === 'pages') {
        await db.query(`
            INSERT INTO page_seo (page_id, seo_title, seo_description, seo_keywords, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (page_id) DO UPDATE SET
            seo_title = EXCLUDED.seo_title,
            seo_description = EXCLUDED.seo_description,
            seo_keywords = EXCLUDED.seo_keywords,
            updated_at = NOW()
        `, [id, title, desc, kw]);
    } else if (['brands', 'categories', 'genders'].includes(type)) {
        await db.query(`
            UPDATE ${type} SET 
            seo_title = $1, 
            seo_description = $2, 
            seo_keywords = $3, 
            updated_at = NOW()
            WHERE id = $4 AND business_id = $5
        `, [title, desc, kw, id, biz]);
    } else if (type === 'products') {
        await db.query(`
            UPDATE product SET 
            seo_title = $1, 
            seo_description = $2, 
            seo_keywords = $3
            WHERE product_id = $4 AND business_id = $5
        `, [title, desc, kw, id, biz]);
    } else {
        throw new Error('Unmapped database persistence tier');
    }
}

module.exports = router;
