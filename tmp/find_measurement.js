const db = require('../db');
db.query("SELECT * FROM information_schema.columns WHERE column_name = 'measurement'")
    .then(r => {
        console.log('Columns with name "measurement":', r.rows.map(c => c.table_name));
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
