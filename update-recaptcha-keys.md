# Update reCAPTCHA Keys in Railway

## Current Issue
The reCAPTCHA 401 Unauthorized error is occurring because the Railway environment variables are missing or incorrect.

## Solution
Add these environment variables to your Railway project:

### 1. Go to Railway Dashboard
- Navigate to your Lyric Art Studio project
- Click on the "Variables" tab

### 2. Add/Update These Variables

**RECAPTCHA_SITE_KEY**
```
6LdJ4JArAAAAAJRNqSjSec6dqyB3Zf-CqQ3WyzQb
```

**RECAPTCHA_SECRET_KEY**
```
6LdJ4JArAAAAAlhl92UZvLOF2yrq_4LSDlq93t6c
```

### 3. Save and Redeploy
- Click "Save" to update the variables
- Railway will automatically redeploy your application

## Verification
After updating, the reCAPTCHA errors should disappear and the newsletter subscription should work without the 401 errors.

## Newsletter Email Status
✅ **GOOD NEWS**: The logs show that newsletter welcome emails ARE being sent successfully to subscribers. The issue might be:

1. **Spam/Junk Folder**: Check if emails are going to spam
2. **Email Delivery Delay**: Sometimes there's a delay
3. **Email Client Filtering**: Gmail might be filtering the emails

The admin is receiving notifications correctly, which confirms the email system is working.

## Test Steps
1. Update the reCAPTCHA keys in Railway
2. Test newsletter subscription again
3. Check both inbox and spam folder for the welcome email
4. The reCAPTCHA errors should be resolved 