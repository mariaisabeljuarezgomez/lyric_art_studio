# RAILWAY SANDBOX SETUP INSTRUCTIONS

## 🔧 How to Enable PayPal Sandbox Testing on Live Site

### Step 1: Add Environment Variable to Railway

1. Go to your Railway Dashboard: https://railway.app/dashboard
2. Select your Lyric Art Studio project
3. Click on the "Variables" tab
4. Add a new environment variable:

**Variable Name:** `FORCE_PAYPAL_SANDBOX`  
**Value:** `true`

### Step 2: Verify Other Environment Variables

Make sure these are set correctly:

**Required for PayPal Sandbox:**
- `PAYPAL_CLIENT_ID` = Your sandbox client ID
- `PAYPAL_CLIENT_SECRET` = Your sandbox client secret
- `NODE_ENV` = `production` (keep this as production)
- `FORCE_PAYPAL_SANDBOX` = `true` (NEW - this enables sandbox on live site)

**Required for OAuth:**
- `GOOGLE_CLIENT_ID` = Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` = Your Google OAuth client secret
- `GITHUB_CLIENT_ID` = Your GitHub OAuth client ID (optional)
- `GITHUB_CLIENT_SECRET` = Your GitHub OAuth client secret (optional)

**Required for Database:**
- `DATABASE_URL` = Your PostgreSQL connection string

**Required for Email:**
- `EMAIL_HOST` = Your SMTP host
- `EMAIL_USER` = Your email username
- `EMAIL_PASS` = Your email password

### Step 3: Redeploy

After adding the environment variable:
1. Railway will automatically redeploy
2. Check the deployment logs to confirm it's using SANDBOX
3. You should see: `⚠️  SANDBOX FORCED for testing on live site`

### Step 4: Test Payments

1. Go to your live site: https://lyricartstudio.shop
2. Try to make a test purchase
3. Use PayPal sandbox test accounts for payment
4. Payments should now work with sandbox credentials

### Step 5: When Ready for Live Payments

To switch back to live payments:
1. Remove the `FORCE_PAYPAL_SANDBOX` variable OR set it to `false`
2. Replace PayPal credentials with LIVE credentials (not sandbox)
3. Redeploy

## 🧪 Testing with PayPal Sandbox

Use these test accounts for sandbox testing:

**Buyer Account:**
- Email: sb-owt43p25797336@personal.example.com
- Password: (check your PayPal Developer Dashboard)

**Seller Account:**
- Email: sb-owt43p25797336@business.example.com
- Password: (check your PayPal Developer Dashboard)

## 🔍 Verification

After deployment, check the server logs. You should see:
```
🔧 PayPal Environment Check:
   NODE_ENV: production
   PORT: (your railway port)
   PAYPAL_CLIENT_ID exists: true
   PAYPAL_CLIENT_SECRET exists: true
   Using environment: SANDBOX
   ⚠️  SANDBOX FORCED for testing on live site
   PayPal Base URL: https://api-m.sandbox.paypal.com
✅ PayPal configuration ready
```

## 🚨 Important Notes

- **This is for TESTING ONLY** - don't use this for real customers
- **Sandbox payments are fake** - no real money is charged
- **Test thoroughly** before switching to live payments
- **Remember to switch back** when ready for production

## 📞 If Issues Persist

1. Check Railway deployment logs for errors
2. Verify all environment variables are set correctly
3. Test PayPal sandbox credentials separately
4. Check that the server is starting without OAuth errors 