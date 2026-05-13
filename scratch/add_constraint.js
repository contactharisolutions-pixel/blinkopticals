const db = require('../db');
async function addConstraint() {
    try {
        console.log('Attempting to add unique constraint to inventory...');
        await db.query("ALTER TABLE inventory ADD CONSTRAINT unique_inventory_pos UNIQUE (business_id, variant_id, showroom_id)");
        console.log('Constraint added successfully');
        process.exit(0);
    } catch (err) {
        console.error('Failed to add constraint:', err.message);
        process.exit(1);
    }
}
addConstraint();
