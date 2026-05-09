const db = require('../db');
db.query("SELECT table_name, column_name FROM information_schema.columns WHERE column_name IN ('mrp', 'selling_price') AND table_name IN ('product', 'variant')")
    .then(r => {
        console.log(r.rows);
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
