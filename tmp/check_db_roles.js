const db = require('../db');

async function checkRoles() {
    try {
        const { rows } = await db.query('SELECT DISTINCT role FROM app_user');
        console.log('Current roles in DB:', rows);
    } catch (err) {
        console.error('Error fetching roles:', err);
    } finally {
        process.exit();
    }
}

checkRoles();
