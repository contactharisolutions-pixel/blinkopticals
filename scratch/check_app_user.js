
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
    try {
        console.log('Fetching columns for app_user...');
        const { data, error } = await supabase.from('app_user').select('*').limit(1);
        if (error) throw error;
        console.log('app_user record:', data[0]);
    } catch (err) {
        console.error('FAILED:', err.message);
    }
}

test();
