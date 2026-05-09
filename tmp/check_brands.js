const db = require('../db');
async function check() {
    try {
        const brands = await db.query("SELECT * FROM brands LIMIT 1");
        console.log("Brands Columns:", Object.keys(brands.rows[0] || {}));
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
check();
