const db = require('../db');
db.query("SELECT proname FROM pg_proc WHERE prosrc ILIKE '%measurement%'")
    .then(r => {
        console.log(r.rows);
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
