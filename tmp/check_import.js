const db = require('../db');
db.query("SELECT product_id, product_name, lens_width, bridge_size, temple_length, lens_composite, lens_colorway FROM product WHERE active_status=true ORDER BY created_at DESC LIMIT 5")
    .then(r => {
        console.log(r.rows);
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
