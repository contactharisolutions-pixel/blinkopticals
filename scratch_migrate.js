const db = require('./db');
async function run() {
    try {
        await db.query(`
            ALTER TABLE prescription 
            ADD COLUMN IF NOT EXISTS right_dv_sph VARCHAR(10),
            ADD COLUMN IF NOT EXISTS right_dv_cyl VARCHAR(10),
            ADD COLUMN IF NOT EXISTS right_dv_axis VARCHAR(10),
            ADD COLUMN IF NOT EXISTS right_dv_va VARCHAR(10),
            ADD COLUMN IF NOT EXISTS right_dv_add VARCHAR(10),
            ADD COLUMN IF NOT EXISTS right_nv_sph VARCHAR(10),
            ADD COLUMN IF NOT EXISTS right_nv_cyl VARCHAR(10),
            ADD COLUMN IF NOT EXISTS right_nv_axis VARCHAR(10),
            ADD COLUMN IF NOT EXISTS right_nv_va VARCHAR(10),
            ADD COLUMN IF NOT EXISTS left_dv_sph VARCHAR(10),
            ADD COLUMN IF NOT EXISTS left_dv_cyl VARCHAR(10),
            ADD COLUMN IF NOT EXISTS left_dv_axis VARCHAR(10),
            ADD COLUMN IF NOT EXISTS left_dv_va VARCHAR(10),
            ADD COLUMN IF NOT EXISTS left_dv_add VARCHAR(10),
            ADD COLUMN IF NOT EXISTS left_nv_sph VARCHAR(10),
            ADD COLUMN IF NOT EXISTS left_nv_cyl VARCHAR(10),
            ADD COLUMN IF NOT EXISTS left_nv_axis VARCHAR(10),
            ADD COLUMN IF NOT EXISTS left_nv_va VARCHAR(10),
            ADD COLUMN IF NOT EXISTS right_prism VARCHAR(10),
            ADD COLUMN IF NOT EXISTS right_pd VARCHAR(10),
            ADD COLUMN IF NOT EXISTS right_fh VARCHAR(10),
            ADD COLUMN IF NOT EXISTS left_prism VARCHAR(10),
            ADD COLUMN IF NOT EXISTS left_pd VARCHAR(10),
            ADD COLUMN IF NOT EXISTS left_fh VARCHAR(10),
            ADD COLUMN IF NOT EXISTS ipd VARCHAR(10)
        `);
        console.log('Prescription schema upgraded successfully');
    } catch(e) {
        console.log(e);
    }
    process.exit();
}
run();
