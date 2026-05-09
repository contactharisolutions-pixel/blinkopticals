const db = require('../db');
async function test() {
    try {
        const { rows } = await db.query("SELECT * FROM product WHERE is_published=false LIMIT 1");
        if (!rows[0]) { console.log('No unpublished products'); process.exit(0); }
        const p = rows[0];
        
        const tagsArr = ['test'];
        const biz = p.business_id;
        
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
                gender_id         = COALESCE($12::text,            gender_id),
                shape_id          = COALESCE($13::text,            shape_id),
                material_id       = COALESCE($14::text,            material_id),
                frame_type_id     = COALESCE($15::text,            frame_type_id),
                main_image        = COALESCE($16::text,            main_image),
                selling_price     = COALESCE(CASE WHEN selling_price > 0 THEN selling_price ELSE NULL END, mrp, 0.00),
                is_published      = true,
                active_status     = true
            WHERE product_id=$17 AND business_id=$18
        `, [
            'Test Product', 'Short', 'Long Desc', 'SEO Title', 'SEO Desc',
            tagsArr, '55', '18', '145', 'Poly', 'Black',
            null, null, null, null, null,
            p.product_id, biz
        ]);
        
        console.log('Update Success');
    } catch (e) {
        console.error('Update Failed:', e.message);
        console.error(e.stack);
    }
    process.exit(0);
}
test();
