const db = require('../db');
db.query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'product'::regclass")
    .then(r => {
        console.log(r.rows);
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
