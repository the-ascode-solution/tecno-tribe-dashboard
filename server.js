const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.SERVER_PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL || "";

console.log('Environment check:');
console.log('PORT:', PORT);
console.log('DATABASE_URL:', DATABASE_URL ? 'Set' : 'Not set');

let pool;

async function connectPostgres() {
  if (pool) return pool;
  if (!DATABASE_URL) {
    throw new Error('Missing DATABASE_URL');
  }
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  return pool;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Lists tables and returns all rows from each
app.get('/api/data', async (_req, res) => {
  try {
    if (!DATABASE_URL) {
      return res.json({ 
        collections: [],
        message: "PostgreSQL not configured. Please set DATABASE_URL environment variable.",
        status: "no-db"
      });
    }
    
    const client = await connectPostgres();
    const client_pool = await client.connect();
    
    // Get all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client_pool.query(tablesQuery);
    const tables = tablesResult.rows;
    
    const result = [];
    for (const table of tables) {
      const tableName = table.table_name;
      
      // Get row count
      const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
      const countResult = await client_pool.query(countQuery);
      const count = parseInt(countResult.rows[0].count);
      
      // Get all rows via aggregation to avoid implicit row limits
      const dataQuery = `
        SELECT json_agg(row_data) AS docs
        FROM (
          SELECT *
          FROM "${tableName}"
          ORDER BY 1
        ) AS row_data;
      `;
      const dataResult = await client_pool.query(dataQuery);
      const docs = dataResult.rows[0]?.docs || [];
      console.log(`[api/data] ${tableName}: count=${count}, docsReturned=${docs.length}`);
      
      result.push({ 
        collection: tableName, 
        count: count, 
        docs: docs 
      });
    }
    
    client_pool.release();
    res.json({ collections: result, status: "connected" });
  } catch (err) {
    console.error('Database error:', err.message);
    res.json({ 
      collections: [],
      error: err.message,
      status: "error"
    });
  }
});

process.on('SIGINT', async () => {
  if (pool) await pool.end();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


