const db = require('../db');

async function checkConstraint() {
    try {
        const sql = `
            SELECT cc.check_clause
            FROM information_schema.check_constraints cc
            JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
            WHERE ccu.table_name = 'app_user' AND cc.constraint_name = 'app_user_role_check';
        `;
        const { rows } = await db.query(sql);
        console.log('Constraint clause:', rows[0]?.check_clause);
    } catch (err) {
        console.error('Error fetching constraint:', err);
    } finally {
        process.exit();
    }
}

checkConstraint();
