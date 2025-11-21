const { Pool } = require('pg');

let pool;

async function connectPostgres() {
  if (pool) return pool;
  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    throw new Error('Missing DATABASE_URL');
  }
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  return pool;
}

exports.handler = async () => {
  try {
    const { DATABASE_URL } = process.env;
    if (!DATABASE_URL) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collections: [],
          message: 'PostgreSQL not configured. Please set DATABASE_URL.',
          status: 'no-db',
        }),
      };
    }

    const client = await connectPostgres();
    const connection = await client.connect();

    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const tablesResult = await connection.query(tablesQuery);
    const tables = tablesResult.rows;

    const result = [];
    for (const table of tables) {
      const tableName = table.table_name;

      const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
      const countResult = await connection.query(countQuery);
      const count = parseInt(countResult.rows[0].count, 10);

      const dataQuery = `
        SELECT json_agg(row_data) AS docs
        FROM (
          SELECT *
          FROM "${tableName}"
          ORDER BY 1
        ) AS row_data;
      `;
      const dataResult = await connection.query(dataQuery);
      const docs = dataResult.rows[0]?.docs || [];

      result.push({ collection: tableName, count, docs });
    }

    connection.release();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collections: result, status: 'connected' }),
    };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collections: [], error: err.message, status: 'error' }),
    };
  }
};
