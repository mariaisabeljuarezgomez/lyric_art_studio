# RAILWAY ENVIRONMENT VARIABLE SETUP

## 🚨 CRITICAL: Add Missing NODE_ENV Variable

You need to add `NODE_ENV=production` to your Railway environment variables. This is **essential** for the server to work properly in production.

### Step 1: Go to Railway Dashboard
1. Visit: https://railway.app/dashboard
2. Select your "Lyric Art Studio" project
3. Click on the "Variables" tab

### Step 2: Add NODE_ENV Variable
1. Click the "+" button to add a new variable
2. **Variable Name:** `NODE_ENV`
3. **Value:** `production`
4. Click "Save"

### Step 3: Verify All Required Variables
Make sure you have these variables set:

**Required for Production:**
- `NODE_ENV` = `production` ← **ADD THIS ONE**
- `PAYPAL_MODE` = `sandbox` (you already have this)
- `PAYPAL_CLIENT_ID` = your sandbox client ID
- `PAYPAL_CLIENT_SECRET` = your sandbox client secret
- `DATABASE_URL` = your PostgreSQL connection string
- `SESSION_SECRET` = a secure random string

**Optional (for OAuth):**
- `GOOGLE_CLIENT_ID` = your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` = your Google OAuth client secret
- `GITHUB_CLIENT_ID` = your GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` = your GitHub OAuth client secret

### Step 4: Redeploy
After adding the variables, Railway will automatically redeploy your application.

## 🎯 What This Fixes

1. **Server Startup** - Prevents OAuth crashes on startup
2. **PayPal Configuration** - Ensures correct PayPal environment detection
3. **Security Settings** - Enables production security features
4. **Performance** - Optimizes the server for production

## ✅ Expected Result

After adding `NODE_ENV=production`, you should see in the logs:
```
🚀 STARTUP: NODE_ENV = production
🔧 PayPal Environment Check:
   PAYPAL_MODE from env: sandbox
   Using environment: SANDBOX
   ✅ Using SANDBOX mode from PAYPAL_MODE environment variable
```

And **NO MORE** OAuth crashes on startup! 