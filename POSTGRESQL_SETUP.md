# PostgreSQL Setup Guide

## Quick Setup

1. **Create a `.env` file** in the root directory with the following content:

```
DATABASE_URL=postgresql://neondb_owner:npg_pq5rcGTSYwM1@ep-lively-scene-aekjllu5-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
PORT=5000
```

2. **For Neon PostgreSQL** (recommended):
   - Sign up at: https://neon.tech
   - Create a new project
   - Copy the connection string from the dashboard
   - Use the provided connection string in your `.env` file

3. **For local PostgreSQL**:
   - Install PostgreSQL locally
   - Create a database
   - Use format: `postgresql://username:password@localhost:5432/database_name`

## Running the Application

1. **Start the server**:
   ```bash
   npm run server
   ```

2. **Start the frontend** (in another terminal):
   ```bash
   npm start
   ```

3. **Or run both together**:
   ```bash
   npm run dev
   ```

## Troubleshooting

- If you see "No DB Config" status, create the `.env` file with DATABASE_URL
- If you see "Error" status, check your PostgreSQL connection string
- Make sure PostgreSQL is running and accessible
- For Neon, ensure your connection string includes SSL parameters
