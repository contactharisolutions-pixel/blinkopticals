const db = require('../db');
async function check() {
    try {
        const brands = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'media_library' AND column_name = 'folder_id'");
        console.log("Column Info:", brands.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
check();
