const db = require('../db');
async function check() {
    try {
        const folders = await db.query("SELECT id, folder_name FROM media_folders");
        console.log("Folders:", folders.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
check();
