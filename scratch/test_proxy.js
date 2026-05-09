const db = require('../db');
const biz = 'biz_blink_001';
const tests = [
  ['Orders list', 'SELECT * FROM customer_order WHERE business_id = $1 ORDER BY created_at DESC', [biz]],
  ['Customer list', 'SELECT * FROM customer WHERE business_id = $1 ORDER BY created_at DESC', [biz]],
  ['Inventory list', 'SELECT * FROM inventory WHERE business_id = $1', [biz]],
  ['Showrooms', 'SELECT * FROM showroom WHERE business_id = $1 ORDER BY created_at DESC', [biz]],
  ['CRM Leads', 'SELECT l.*, (SELECT COUNT(*) FROM follow_up WHERE lead_id = l.lead_id) as follow_up_count FROM "lead" l WHERE l.business_id = $1 ORDER BY l.created_at DESC LIMIT $2 OFFSET $3', [biz, 50, 0]],
  ['Eye Tests', 'SELECT COUNT(*), COUNT(DISTINCT customer_id) FROM eye_test WHERE business_id = $1', [biz]],
  ['Repairs', 'SELECT * FROM repair WHERE business_id = $1', [biz]],
];

Promise.all(tests.map(async ([name, sql, params]) => {
  try {
    const r = await db.query(sql, params);
    const first = r.rows[0];
    if (first) {
      const preview = Object.entries(first).slice(0,3).map(([k,v]) => `${k}=${v}`).join(', ');
      return `✅ ${name}: ${r.rows.length} rows | ${preview}`;
    }
    return `✅ ${name}: ${r.rows.length} rows (empty)`;
  } catch(e) { return `❌ ${name}: ERROR ${e.message}`; }
})).then(results => console.log('\n' + results.join('\n') + '\n'));
