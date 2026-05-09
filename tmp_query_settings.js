const db = require('./db');
async function check() {
    try {
        const { rows } = await db.query("SELECT setting_key, setting_value FROM business_settings WHERE setting_key IN ('general_settings', 'gst_settings')");
        console.log(JSON.stringify(rows, null, 2));
    } catch(e) { console.error(e); }
    process.exit();
}
check();
