# Railway Database Setup for Lyric Art Studio

## 🚀 Quick Setup Guide

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Initialize Railway Project
```bash
railway init
```

### 4. Add PostgreSQL Database
```bash
railway add
```
Select "PostgreSQL" from the options.

### 5. Get Database URL
```bash
railway variables
```
Copy the `DATABASE_URL` value.

### 6. Set Environment Variables
```bash
railway variables set DATABASE_URL="your-database-url-here"
railway variables set SESSION_SECRET="your-super-secret-key"
railway variables set NODE_ENV="production"
```

### 7. Deploy to Railway
```bash
railway up
```

## 🔧 Manual Setup Steps

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### Step 2: Add PostgreSQL Database
1. Click "New Service"
2. Select "Database" → "PostgreSQL"
3. Wait for database to be created
4. Copy the connection URL

### Step 3: Deploy Your Application
1. Connect your GitHub repository
2. Railway will automatically detect Node.js
3. Set the start command: `node server-railway.js`
4. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A secure random string
   - `NODE_ENV`: `production`

## 🌐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `SESSION_SECRET` | Secret for session encryption | `my-super-secret-key-123` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3001` |
| `BASE_URL` | Your domain | `https://yourdomain.com` |

## 🗄️ Database Schema

The application automatically creates these tables:

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    profile JSONB DEFAULT '{}'
);
```

### Orders Table
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    items JSONB NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(100),
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Cart Items Table
```sql
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    design_id VARCHAR(255) NOT NULL,
    format VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, design_id, format)
);
```

### Sessions Table
```sql
-- Automatically created by connect-pg-simple
```

## 🔍 Troubleshooting

### Database Connection Issues
```bash
# Check database status
railway service logs

# Test connection locally
railway variables
```

### Session Issues
- Ensure `SESSION_SECRET` is set
- Check that `DATABASE_URL` is correct
- Verify SSL settings for production

### Deployment Issues
```bash
# View deployment logs
railway logs

# Restart service
railway service restart
```

## 📊 Benefits of Railway Database

✅ **Persistent Storage** - No more lost cart data
✅ **Real Database** - Proper SQL queries and indexing
✅ **Automatic Backups** - Your data is safe
✅ **Scalability** - Handles traffic spikes
✅ **SSL Support** - Secure connections
✅ **Connection Pooling** - Better performance
✅ **No File System Issues** - Eliminates caching problems

## 🎯 What This Fixes

- ❌ Cart data disappearing
- ❌ Session persistence issues
- ❌ Browser caching problems
- ❌ File system corruption
- ❌ Hard reset requirements
- ❌ Dev tools dependency

## 🚀 Next Steps

1. Deploy to Railway
2. Test cart functionality
3. Verify session persistence
4. Test payment integration
5. Monitor performance

Your payment integration will now work reliably with persistent database storage! 