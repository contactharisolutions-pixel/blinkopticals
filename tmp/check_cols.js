const db = require('../db');
async function run() {
    try {
        const { rows } = await db.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('product', 'brands')
            ORDER BY table_name, ordinal_position
        `);
        rows.forEach(r => console.log(`${r.table_name}.${r.column_name} (${r.data_type})`));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
run();
