
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkDefault() {
    console.log('--- CHECKING TABLE DEFAULTS ---');
    
    const { data, error } = await supabase.from('product').insert({
        product_id: 'test_pid_' + Date.now(),
        business_id: 'biz_temp_test',
        product_name: 'Test Default',
        brand_id: 'br_01',
        model_no: 'TEST_MODEL'
    }).select();

    if (error) {
        console.error('Insert Error:', error.message);
    } else {
        console.log('Inserted Row:', JSON.stringify(data[0]));
        await supabase.from('product').delete().eq('product_id', data[0].product_id);
    }
}

checkDefault();
