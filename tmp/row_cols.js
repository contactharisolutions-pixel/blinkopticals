const db = require('../db');
db.query("SELECT * FROM product LIMIT 1")
    .then(r => {
        console.log(Object.keys(r.rows[0]));
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
