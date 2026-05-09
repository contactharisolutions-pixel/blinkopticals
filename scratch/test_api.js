
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
    try {
        console.log('Testing Supabase API connection...');
        // Try to list tables or something simple
        const { data, error } = await supabase.from('business').select('count', { count: 'exact' });
        if (error) throw error;
        console.log('API SUCCESS: Found business records count:', data);
    } catch (err) {
        console.error('API FAILED:', err.message);
    }
}

test();
