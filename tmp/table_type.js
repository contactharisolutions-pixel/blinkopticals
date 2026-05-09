const db = require('../db');
db.query("SELECT table_type FROM information_schema.tables WHERE table_name = 'product'")
    .then(r => {
        console.log(r.rows);
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
