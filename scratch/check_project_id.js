
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
    try {
        console.log('Fetching buckets...');
        const { data, error } = await supabase.storage.listBuckets();
        if (error) throw error;
        console.log('Buckets:', data);
        
        console.log('Fetching session info...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('Session project:', session?.user?.aud);
    } catch (err) {
        console.error('FAILED:', err.message);
    }
}

test();
