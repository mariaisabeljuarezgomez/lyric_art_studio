# 🔐 Security Setup Guide - Lyric Art Studio

## Overview
This guide explains the new security features implemented for your admin dashboard and newsletter subscription system.

## 🛡️ Security Features Implemented

### 1. **Admin Authentication System**
- **Session-based authentication** instead of insecure key-based system
- **IP whitelisting** to restrict admin access to authorized IPs
- **Rate limiting** to prevent brute force attacks
- **Audit logging** to track all admin access attempts
- **Automatic session expiration** (24 hours)

### 2. **Newsletter Subscription Protection**
- **Google reCAPTCHA v3** (invisible, no user interaction required)
- **Bot and spam detection** using Google's advanced algorithms
- **Rate limiting** on subscription attempts
- **IP tracking** for security monitoring

## 🔧 Environment Variables Required

Add these to your Railway environment variables:

### Admin Authentication
```bash
# Admin credentials (change these!)
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_admin_password

# IP whitelist (comma-separated, use * for any IP)
ADMIN_IP_WHITELIST=127.0.0.1,::1,your_ip_address_here

# Legacy admin key (for backward compatibility)
ADMIN_KEY=lyric-admin-secure-2025
```

### Google reCAPTCHA v3
```bash
# Get these from https://www.google.com/recaptcha/admin
RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here
```

## 🚀 How to Set Up

### 1. **Get Google reCAPTCHA v3 Keys**
1. Go to https://www.google.com/recaptcha/admin
2. Click "Create" to add a new site
3. Choose "reCAPTCHA v3"
4. Add your domain: `lyricartstudio.shop`
5. Copy the Site Key and Secret Key

### 2. **Update Railway Environment Variables**
1. Go to your Railway dashboard
2. Navigate to your project → Variables
3. Add all the environment variables listed above
4. Replace placeholder values with your actual credentials

### 3. **Update reCAPTCHA Site Key in HTML**
Replace the placeholder in `pages/homepage.html`:
```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_ACTUAL_SITE_KEY"></script>
```

And in the JavaScript:
```javascript
const recaptchaToken = await grecaptcha.execute('YOUR_ACTUAL_SITE_KEY', {action: 'newsletter_subscribe'});
```

## 🔐 Admin Access

### New Secure Login
- **URL**: `https://lyricartstudio.shop/admin/login`
- **Username**: Set in `ADMIN_USERNAME` environment variable
- **Password**: Set in `ADMIN_PASSWORD` environment variable
- **2FA**: Optional (can be enabled later)

### Security Features
- ✅ **IP Whitelisting**: Only authorized IPs can access admin
- ✅ **Rate Limiting**: 5 attempts per 15 minutes
- ✅ **Session Management**: 24-hour sessions
- ✅ **Audit Logging**: All access attempts logged
- ✅ **Automatic Logout**: Sessions expire automatically

## 📧 Newsletter Security

### reCAPTCHA v3 Protection
- **Invisible**: No user interaction required
- **Smart Detection**: Automatically detects bots and spam
- **Score-based**: Google provides a score (0.0-1.0)
- **Threshold**: Set to 0.5 (medium security)

### Additional Protection
- ✅ **Email Validation**: Proper email format checking
- ✅ **IP Tracking**: All subscriptions logged with IP
- ✅ **Rate Limiting**: Prevents spam submissions
- ✅ **Duplicate Prevention**: Handles existing subscribers gracefully

## 🔍 Monitoring & Logs

### Admin Audit Logs
All admin access attempts are logged with:
- Timestamp
- IP Address
- User Agent
- Action (login, logout, access denied, etc.)
- Success/Failure status

### Newsletter Security Logs
- reCAPTCHA scores
- Failed verification attempts
- Spam detection results

## 🚨 Security Recommendations

### 1. **Strong Passwords**
- Use a strong, unique password for admin access
- Consider using a password manager
- Change passwords regularly

### 2. **IP Whitelisting**
- Only whitelist IPs you control
- Use your home/work IP addresses
- Consider using a VPN for consistent IP

### 3. **Regular Monitoring**
- Check admin audit logs regularly
- Monitor newsletter subscription patterns
- Review failed login attempts

### 4. **Backup Security**
- Keep your environment variables secure
- Don't share admin credentials
- Use HTTPS for all admin access

## 🔄 Migration from Old System

The new system is **backward compatible**:
- Old admin key still works as fallback
- Existing admin sessions will be migrated
- No data loss during transition

## 📞 Support

If you encounter any issues:
1. Check the server logs for error messages
2. Verify environment variables are set correctly
3. Ensure your IP is in the whitelist
4. Test reCAPTCHA keys are working

## 🔒 Additional Security Features (Future)

Consider implementing these additional features:
- **Two-Factor Authentication (2FA)** for admin login
- **Database audit logging** for admin actions
- **Email notifications** for suspicious activity
- **Advanced IP geolocation** restrictions
- **Session timeout** warnings
- **Failed login** email alerts

---

**⚠️ Important**: Change all default passwords and keys before going live! 