
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
    try {
        console.log('Fetching products...');
        const { data, error, count } = await supabase.from('product').select('*', { count: 'exact' });
        if (error) throw error;
        console.log('Products found:', count);
        console.log('First product:', data[0]);
    } catch (err) {
        console.error('FAILED:', err.message);
    }
}

test();
