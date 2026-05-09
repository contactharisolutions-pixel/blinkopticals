const db = require('./db');
async function run() {
    try {
        const r1 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'customer'");
        console.log('--- customer ---');
        console.log(r1.rows.map(x => x.column_name).sort().join('\n'));
        
        const r2 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'loyalty'");
        console.log('--- loyalty ---');
        console.log(r2.rows.map(x => x.column_name).sort().join('\n'));
    } catch (e) {
        console.error(e.message);
    } finally {
        process.exit();
    }
}
run();
