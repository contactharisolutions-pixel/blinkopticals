const db = require('./db');
async function check() {
    const { rows } = await db.query("SELECT setting_value FROM business_settings WHERE setting_key = 'gst_settings'");
    console.log(JSON.stringify(rows[0]?.setting_value, null, 2));
    process.exit();
}
check();
