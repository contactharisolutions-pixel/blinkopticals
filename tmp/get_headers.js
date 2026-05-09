const db = require('../db');
db.query("SELECT * FROM product LIMIT 0")
    .then(r => {
        console.log(Object.keys(r.fields).map(i => r.fields[i].name).join(', '));
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
