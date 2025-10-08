const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB = process.env.MONGODB_DB;

let mongoClient;
let mongoDb;

async function connectMongo() {
  if (mongoDb) return mongoDb;
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI');
  }
  mongoClient = new MongoClient(MONGODB_URI, { ignoreUndefined: true });
  await mongoClient.connect();
  // If no db specified in URI, allow override with MONGODB_DB, otherwise default 'admin'
  const dbNameFromUri = new URL(MONGODB_URI).pathname.replace(/^\//, '');
  const dbName = dbNameFromUri || MONGODB_DB || 'admin';
  mongoDb = mongoClient.db(dbName);
  return mongoDb;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Lists collections and returns first 5 docs from each
app.get('/api/data', async (_req, res) => {
  try {
    const db = await connectMongo();
    const collections = await db.listCollections().toArray();
    const result = [];
    for (const col of collections) {
      const c = db.collection(col.name);
      const docs = await c.find({}).limit(5).toArray();
      result.push({ collection: col.name, count: docs.length, docs });
    }
    res.json({ collections: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

process.on('SIGINT', async () => {
  if (mongoClient) await mongoClient.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


