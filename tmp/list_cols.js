const db = require('../db');
db.query("SELECT column_name FROM information_schema.columns WHERE table_name='product'")
    .then(r => {
        console.log(r.rows.map(c => c.column_name).join(', '));
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
