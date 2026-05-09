const db = require('../db');
db.query("SELECT tgname FROM pg_trigger WHERE tgrelid = 'product'::regclass")
    .then(r => {
        console.log(r.rows);
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
