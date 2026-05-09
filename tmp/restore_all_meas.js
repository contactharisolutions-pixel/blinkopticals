const db = require('../db');
const sql = `
ALTER TABLE product ADD COLUMN IF NOT EXISTS measurements_h VARCHAR(50);
ALTER TABLE product ADD COLUMN IF NOT EXISTS measurements_w VARCHAR(50);
ALTER TABLE product ADD COLUMN IF NOT EXISTS measurements_l VARCHAR(50);
`;
db.query(sql)
    .then(r => {
        console.log('Measurement components restored.');
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
