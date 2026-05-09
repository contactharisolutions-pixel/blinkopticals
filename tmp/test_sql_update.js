const db = require('../db');

async function testUpdate() {
    const biz = 'blink_opticals_hq'; // or whatever the business ID is
    // Let's get one product ID first
    const { rows: pRows } = await db.query('SELECT product_id FROM product LIMIT 1');
    if (pRows.length === 0) { console.log('No products found'); process.exit(1); }
    const pid = pRows[0].product_id;
    console.log('Testing update for PID:', pid);

    try {
        await db.query(`
            UPDATE product SET
                product_name      = COALESCE(NULLIF($1::text,''),  product_name),
                short_description = COALESCE(NULLIF($2::text,''),  short_description),
                description       = COALESCE(NULLIF($3::text,''),  description),
                seo_title         = COALESCE(NULLIF($4::text,''),  seo_title),
                seo_description   = COALESCE(NULLIF($5::text,''),  seo_description),
                tags              = COALESCE($6::text[],           tags),
                lens_width        = COALESCE(NULLIF($7::text,''),  lens_width),
                bridge_size       = COALESCE(NULLIF($8::text,''),  bridge_size),
                temple_length     = COALESCE(NULLIF($9::text,''),  temple_length),
                lens_composite    = COALESCE(NULLIF($10::text,''), lens_composite),
                lens_colorway     = COALESCE(NULLIF($11::text,''), lens_colorway),
                gender_id         = COALESCE($12::int,             gender_id),
                shape_id          = COALESCE($13::int,             shape_id),
                material_id       = COALESCE($14::int,             material_id),
                main_image        = COALESCE($15::text,            main_image),
                selling_price     = COALESCE(CASE WHEN selling_price > 0 THEN selling_price ELSE NULL END, mrp, 0),
                is_published      = true,
                active_status     = true
            WHERE product_id=$16
        `, [
            'Test Name', null, null, null, null, null,
            '52', '18', '140', 'Testing', 'Test Color',
            null, null, null, null, pid
        ]);
        console.log('SQL UPDATE SUCCESS');
    } catch (e) {
        console.error('SQL UPDATE FAILED:', e.message);
    }
    process.exit(0);
}
testUpdate();
