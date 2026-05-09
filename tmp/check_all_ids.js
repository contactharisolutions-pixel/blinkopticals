const db = require('../db');
db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='product' AND column_name IN ('gender_id', 'shape_id', 'material_id', 'frame_type_id')")
    .then(r => {
        console.log(r.rows);
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
