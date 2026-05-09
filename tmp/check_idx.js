const db = require('../db');
db.query("SELECT indexdef FROM pg_indexes WHERE tablename = 'product'")
    .then(r => {
        console.log(r.rows);
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
