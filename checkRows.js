const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    for (const row of tables.rows) {
      const tableName = row.table_name;
      const count = await pool.query(`SELECT COUNT(*)::int FROM "${tableName}";`);
      const data = await pool.query(`SELECT * FROM "${tableName}";`);
      const agg = await pool.query(`
        SELECT json_agg(row_data) AS docs
        FROM (
          SELECT *
          FROM "${tableName}"
          ORDER BY 1
        ) AS row_data;
      `);
      const docsLength = Array.isArray(agg.rows[0]?.docs) ? agg.rows[0].docs.length : 0;
      console.log(`${tableName}: count=${count.rows[0].count}, rows=${data.rows.length}, agg=${docsLength}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
