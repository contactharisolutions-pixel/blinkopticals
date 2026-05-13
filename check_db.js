const db = require('./db');
db.query("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'product' AND column_name IN ('active_status', 'is_published')")
  .then(res => { console.log(res.rows); process.exit(0); });
