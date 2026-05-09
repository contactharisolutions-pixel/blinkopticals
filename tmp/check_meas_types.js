const db = require('../db');
db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='product' AND column_name IN ('lens_width', 'bridge_size', 'temple_length')")
    .then(r => {
        console.log(r.rows);
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
