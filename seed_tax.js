const db = require('./db');

async function seed() {
    const business_id = 'biz_blink_001';
    try {
        console.log('--- Refining Default GST Rules ---');
        await db.query('BEGIN');

        // 1. Get Rule IDs
        let r18 = await db.query(`SELECT id FROM tax_rules WHERE business_id = $1 AND tax_percentage = 18.00 LIMIT 1`, [business_id]);
        let r12 = await db.query(`SELECT id FROM tax_rules WHERE business_id = $1 AND tax_percentage = 12.00 LIMIT 1`, [business_id]);
        
        if (!r18.rows.length || !r12.rows.length) throw new Error('Rules not found. Run previous seed first.');

        const rule18Id = r18.rows[0].id;
        const rule12Id = r12.rows[0].id;

        // 2. Fetch Categories
        const catsRes = await db.query(`SELECT * FROM category WHERE business_id = $1`, [business_id]);
        const cats = catsRes.rows.map(c => ({
            id: c.category_id || c.id,
            name: c.category_name || c.name
        }));

        // 3. Precise Mapping
        for (const cat of cats) {
            const n = cat.name.toLowerCase();
            // 12% for Frames, Lenses, Eyeglasses, Spectacles
            const is12 = /lens|frame|glass|spectacle|contact/i.test(n) && !/sun/i.test(n);
            const ruleId = is12 ? rule12Id : rule18Id;
            
            await db.query(`DELETE FROM category_tax_mapping WHERE category_id = $1 AND business_id = $2`, [cat.id, business_id]);
            await db.query(
                `INSERT INTO category_tax_mapping (category_id, business_id, tax_rule_id)
                 VALUES ($1, $2, $3)`,
                [cat.id, business_id, ruleId]
            );
            console.log(`Mapped ${cat.name} to ${is12 ? '12%' : '18%'}`);
        }

        await db.query('COMMIT');
        console.log('Success: Tax rules refined.');
        process.exit(0);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Seeding failed:', err.message);
        process.exit(1);
    }
}

seed();
