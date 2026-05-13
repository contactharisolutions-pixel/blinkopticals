const db = require('../db');
async function checkAccountingTables() {
    try {
        const res = await db.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        console.log('Tables:', res.rows.map(r => r.tablename));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkAccountingTables();
