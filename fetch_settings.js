const db = require('./db');
db.query("SELECT setting_value FROM business_settings WHERE setting_key = 'tax_rules'")
    .then(res => { console.log(JSON.stringify(res.rows, null, 2)); process.exit(0); })
    .catch(e => { console.error(e); process.exit(1); });
