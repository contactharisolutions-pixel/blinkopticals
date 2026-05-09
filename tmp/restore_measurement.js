const db = require('../db');
db.query("ALTER TABLE product ADD COLUMN IF NOT EXISTS measurement VARCHAR(50)")
    .then(r => {
        console.log('Column "measurement" restored.');
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
