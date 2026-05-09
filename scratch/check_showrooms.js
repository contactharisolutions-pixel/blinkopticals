
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: `.env.development` });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    console.log('Checking showroom table...');
    const { data, error } = await supabase.from('showroom').select('*');
    if (error) console.error('Error:', error);
    else console.log('Showrooms:', data);
}

check();
