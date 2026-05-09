const db = require('../db');
const fs = require('fs');
db.query("SELECT * FROM product LIMIT 0")
    .then(r => {
        const cols = r.fields.map(f => f.name).join(', ');
        fs.writeFileSync('g:/My Projects/BlinkOpticals/tmp/cols.txt', cols);
        console.log("Done");
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
