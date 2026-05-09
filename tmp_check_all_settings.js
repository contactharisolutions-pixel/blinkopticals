const db = require('./db');
async function check() {
    const { rows } = await db.query("SELECT setting_key, setting_value FROM business_settings");
    rows.forEach(r => {
        console.log(`--- ${r.setting_key} ---`);
        console.log(JSON.stringify(r.setting_value, null, 2));
    });
    process.exit();
}
check();
