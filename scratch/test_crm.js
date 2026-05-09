const db = require('../db');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.development' });

async function main() {
    // 1. Check raw lead table directly via Supabase
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data: rawLeads, error } = await supabase.from('lead').select('*').limit(2);
    console.log('--- RAW LEAD TABLE (Supabase) ---');
    if (error) console.log('ERROR:', error.message);
    else {
        console.log('Columns:', JSON.stringify(Object.keys(rawLeads[0] || {})));
        console.log('First row:', JSON.stringify(rawLeads[0], null, 2));
    }

    // 2. Test through db proxy
    console.log('\n--- PROXY OUTPUT ---');
    try {
        const r = await db.query(
            `SELECT * FROM "lead" WHERE business_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            ['biz_blink_001', 10, 0]
        );
        console.log('Rows:', r.rows.length);
        if (r.rows[0]) {
            console.log('Keys:', JSON.stringify(Object.keys(r.rows[0])));
            console.log('First:', JSON.stringify(r.rows[0], null, 2));
        }
    } catch(e) {
        console.log('Proxy error:', e.message);
    }
}

main();
