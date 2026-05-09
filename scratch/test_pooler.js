const { Client } = require('pg');
const connectionString = "postgresql://postgres.mtoslybnnywmsmpwjphv:Life@20242526@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log("Connecting to pooler...");
    await client.connect();
    console.log("Connected!");
    const res = await client.query('SELECT NOW()');
    console.log("Query result:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
}

test();
