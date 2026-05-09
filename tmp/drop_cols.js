const db = require('../db');
const sql = `
ALTER TABLE product DROP COLUMN IF EXISTS measurement;
ALTER TABLE product DROP COLUMN IF EXISTS measurements_h;
ALTER TABLE product DROP COLUMN IF EXISTS measurements_w;
ALTER TABLE product DROP COLUMN IF EXISTS measurements_l;
`;
db.query(sql)
    .then(r => {
        console.log('Redundant measurement columns dropped.');
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
