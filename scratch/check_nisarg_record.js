const db = require('../db');

async function check() {
    try {
        const { rows } = await db.query(`
            SELECT u.name, u.showroom_id, s.showroom_name 
            FROM app_user u 
            LEFT JOIN showroom s ON u.showroom_id = s.showroom_id 
            WHERE u.name LIKE '%Nisarg%'
        `);
        console.log('Nisarg DB Record:', rows);
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

check();
