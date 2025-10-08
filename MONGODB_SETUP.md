# MongoDB Setup Guide

## Quick Setup

1. **Create a `.env` file** in the root directory with the following content:

```
MONGODB_URI=mongodb://localhost:27017/tecnotribe
MONGODB_DB=tecnotribe
PORT=5000
```

2. **Install and start MongoDB** (if not already installed):
   - Download from: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas

3. **For local MongoDB**:
   - Start MongoDB service
   - Default connection: `mongodb://localhost:27017/tecnotribe`

4. **For MongoDB Atlas**:
   - Create a cluster
   - Get connection string
   - Use format: `mongodb+srv://username:password@cluster.mongodb.net/tecnotribe`

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

- If you see "No DB Config" status, create the `.env` file
- If you see "Error" status, check your MongoDB connection string
- Make sure MongoDB is running and accessible
