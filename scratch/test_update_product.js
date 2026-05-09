
const db = require('../db');

async function testUpdate() {
    const productId = 'prod_1777332835733_dd7q'; // Gucci 0570O
    const biz = 'biz_blink_001';
    
    console.log('--- TESTING DIRECT DB UPDATE ---');
    
    // Simulate routes/products.routes.js:524 logic
    const productFields = { shape_id: 'sh_200101' };
    const variantFields = {};
    const qty = 5;
    const showroom_id = 'show_1776319381337';

    try {
        // Update product
        const setCols = Object.keys(productFields);
        const setClause = setCols.map((c, idx) => `${c} = $${idx + 2}`).join(', ');
        await db.query(`UPDATE product SET ${setClause} WHERE product_id = $1`, [productId, ...Object.values(productFields)]);
        console.log('Product updated.');

        // Update inventory
        const { rows: vRows } = await db.query(`SELECT variant_id FROM variant WHERE product_id = $1 LIMIT 1`, [productId]);
        if (vRows[0]) {
            const vid = vRows[0].variant_id;
            await db.query(
                `UPDATE inventory SET available_qty = $1, last_updated = NOW()
                 WHERE variant_id = $2 AND showroom_id = $3`,
                [qty, vid, showroom_id]
            );
            console.log('Inventory updated.');
        }

        // Now Fetch back using the join query from products.routes.js:437
        const sql = `
            SELECT p.*,
                   b.name AS brand_name,
                   c.name AS category_name,
                   g.name AS gender_name,
                   ft.name AS frame_type_name,
                   s.name AS shape_name,
                   m.name AS material_name
            FROM product p
            LEFT JOIN brands      b   ON p.brand_id      = b.id
            LEFT JOIN categories  c   ON p.category_id   = c.id
            LEFT JOIN genders     g   ON p.gender_id     = g.id
            LEFT JOIN frame_types ft  ON p.frame_type_id = ft.id
            LEFT JOIN shapes      s   ON p.shape_id      = s.id
            LEFT JOIN materials   m   ON p.material_id   = m.id
            WHERE p.product_id = $1
        `;
        const { rows } = await db.query(sql, [productId]);
        const p = rows[0];
        
        console.log('--- RESULT ---');
        console.log('Shape ID:', p.shape_id);
        console.log('Shape Name:', p.shape_name);
        
        const { rows: variants } = await db.query(`
            SELECT v.*, 
                   COALESCE(SUM(inv.available_qty), 0) AS total_stock,
                   (SELECT showroom_id FROM inventory WHERE variant_id=v.variant_id ORDER BY last_updated DESC LIMIT 1) AS showroom_id
            FROM variant v
            LEFT JOIN inventory inv ON inv.variant_id = v.variant_id
            WHERE v.product_id = $1
            GROUP BY v.variant_id
        `, [productId]);
        
        console.log('Total Stock (Variant 0):', variants[0].total_stock);
        console.log('Showroom ID (Variant 0):', variants[0].showroom_id);

    } catch (err) {
        console.error('Test Error:', err);
    }
}

testUpdate();
