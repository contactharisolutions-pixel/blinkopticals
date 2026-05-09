const db = require('../db');
db.query("SELECT * FROM pg_trigger t JOIN pg_proc p ON t.tgfoid = p.oid WHERE p.prosrc ILIKE '%measurement%'")
    .then(r => {
        console.log(r.rows);
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
