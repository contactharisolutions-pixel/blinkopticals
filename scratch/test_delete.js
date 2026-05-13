const db = require('../db');

async function testDelete() {
    const productId = 'prod_1778480200808'; // Example ID from logs if I had them, or just try a dummy
    console.log(`Testing delete for: ${productId}`);
    try {
        await db.query('BEGIN');
        const { rows: variants } = await db.query(`SELECT variant_id FROM variant WHERE product_id=$1`, [productId]);
        console.log(`Found ${variants.length} variants`);
        for (const v of variants) {
            console.log(`Deleting inventory for variant: ${v.variant_id}`);
            await db.query(`DELETE FROM inventory WHERE variant_id=$1`, [v.variant_id]);
        }
        console.log(`Deleting variants...`);
        await db.query(`DELETE FROM variant WHERE product_id=$1`, [productId]);
        console.log(`Deleting product...`);
        const res = await db.query(`DELETE FROM product WHERE product_id=$1`, [productId]);
        console.log(`Result:`, res);
        await db.query('COMMIT');
        console.log('✅ Success');
    } catch (err) {
        await db.query('ROLLBACK');
        console.log('❌ Failed:', err.message);
    } finally {
        process.exit();
    }
}

testDelete();
