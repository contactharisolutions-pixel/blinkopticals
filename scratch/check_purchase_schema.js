const db = require('../db');

async function check() {
    const tables = ['product', 'purchase_items'];
    for (const table of tables) {
        const { rows } = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
        `, [table]);
        console.log(`--- ${table} ---`);
        rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
    }
    process.exit(0);
}

check();
