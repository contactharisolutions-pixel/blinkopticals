
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
    try {
        console.log('Fetching columns for brands...');
        const { data, error } = await supabase.from('brands').select('*').limit(1);
        if (error) throw error;
        console.log('Brands record:', data[0]);

        console.log('Fetching columns for product...');
        const { data: pData, error: pError } = await supabase.from('product').select('*').limit(1);
        if (pError) throw pError;
        console.log('Product record:', pData[0]);
    } catch (err) {
        console.error('FAILED:', err.message);
    }
}

test();
