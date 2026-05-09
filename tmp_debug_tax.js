require('dotenv').config({ path: '.env.development' });
const db = require('./db');
(async () => {
    const r = await db.query('SELECT id FROM tax_rules LIMIT 2');
    console.log(r.rows);
    process.exit(0);
})();
