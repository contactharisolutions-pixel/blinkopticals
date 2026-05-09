
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
    try {
        console.log('Attempting RPC exec_sql...');
        const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1 as val' });
        if (error) throw error;
        console.log('RPC SUCCESS:', data);
    } catch (err) {
        console.error('RPC FAILED:', err.message);
    }
}

test();
