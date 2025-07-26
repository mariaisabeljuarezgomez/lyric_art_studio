# PayPal Testing Guide - Resolving CAPTURE_FAILED Issues

## 🚨 Current Issue: CAPTURE_FAILED Error

You're experiencing a "CAPTURE_FAILED" error when testing PayPal payments in sandbox mode. This guide will help you resolve this issue.

## 🔍 Root Cause Analysis

Based on your console errors, the main issues are:

1. **Browser Extensions Blocking PayPal**: Ad blockers and privacy extensions are blocking PayPal's tracking requests
2. **Content Security Policy Conflicts**: PayPal scripts are being blocked from executing
3. **Network Communication Issues**: PayPal's logging and analytics requests are failing

## 🛠️ Immediate Solutions

### **Solution 1: Disable Browser Extensions (Recommended)**

**For Chrome/Edge:**
1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Uncheck **"Blocked by client"** filter
4. Or temporarily disable ad blocker for `sandbox.paypal.com`

**Alternative - Use Incognito Mode:**
1. Open incognito/private browser window
2. Navigate to your site
3. Test payment flow (extensions are usually disabled)

### **Solution 2: Browser Extension Whitelist**

Add these domains to your ad blocker whitelist:
- `*.paypal.com`
- `*.paypalobjects.com`
- `*.sandbox.paypal.com`
- `www.google-analytics.com`
- `www.facebook.com`
- `px.ads.linkedin.com`

### **Solution 3: Network Troubleshooting**

1. **Clear Browser Cache**: Clear all browser data
2. **Try Different Browser**: Test in Firefox or Safari
3. **Check Network**: Ensure stable internet connection
4. **VPN Issues**: Disable VPN if using one

## 🧪 Step-by-Step Testing Process

### **Step 1: Environment Verification**

Check your PayPal configuration:

```bash
# Verify environment variables are set
echo $PAYPAL_CLIENT_ID
echo $PAYPAL_CLIENT_SECRET
echo $NODE_ENV
```

**Expected Values:**
- `PAYPAL_CLIENT_ID`: Should start with `Ae...` (sandbox) or `AQ...` (live)
- `PAYPAL_CLIENT_SECRET`: Should be a long string
- `NODE_ENV`: Should be `development` for sandbox testing

### **Step 2: PayPal Sandbox Account Setup**

1. **Create Sandbox Business Account:**
   - Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
   - Navigate to "Sandbox" → "Accounts"
   - Create a new business account

2. **Create Sandbox Personal Account:**
   - Create a personal account for testing purchases
   - Note the email and password

3. **Verify Account Status:**
   - Ensure both accounts are "Verified" status
   - Add funds to business account if needed

### **Step 3: Test Payment Flow**

1. **Start Fresh:**
   ```bash
   # Clear any existing sessions
   rm -rf sessions/*
   ```

2. **Test Order Creation:**
   ```bash
   curl -X POST http://localhost:3001/api/payment/create-paypal-order \
     -H "Content-Type: application/json" \
     -d '{
       "items": [
         {
           "title": "Test Design",
           "format": "SVG",
           "price": 3.00,
           "quantity": 1
         }
       ],
       "total": 3.00
     }'
   ```

3. **Expected Response:**
   ```json
   {
     "success": true,
     "order": {
       "id": "EC-123456789",
       "status": "CREATED",
       "links": [
         {
           "href": "https://www.sandbox.paypal.com/checkoutnow?token=EC-123456789",
           "rel": "approve",
           "method": "GET"
         }
       ]
     }
   }
   ```

### **Step 4: Complete Test Payment**

1. **Use Test Credentials:**
   - **Email**: `sb-buyer@business.example.com`
   - **Password**: (from your sandbox personal account)
   - **Card**: `4032030000000000` (Visa)
   - **Expiry**: Any future date
   - **CVV**: Any 3 digits

2. **Payment Process:**
   - Add item to cart
   - Proceed to checkout
   - Click "Pay with PayPal"
   - Complete payment with test credentials
   - Should redirect to success page

### **Step 5: Monitor Server Logs**

Watch for these log messages:

**Successful Flow:**
```
✅ PayPal order created: EC-123456789
✅ PayPal access token obtained
✅ PayPal order captured successfully: PAY-987654321
✅ Payment completed successfully
```

**Error Flow:**
```
❌ PayPal capture failed: 422 Unprocessable Entity
❌ PayPal order capture error: Order cannot be captured
```

## 🔧 Advanced Troubleshooting

### **Issue 1: 422 Unprocessable Entity**

**Cause:** Order already captured or in invalid state

**Solution:**
1. Check order status in PayPal Developer Dashboard
2. Create new test order
3. Ensure order is in "APPROVED" state before capture

### **Issue 2: 401 Unauthorized**

**Cause:** Invalid PayPal credentials

**Solution:**
1. Verify `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
2. Ensure using sandbox credentials for testing
3. Check if credentials are expired

### **Issue 3: 404 Not Found**

**Cause:** Order ID doesn't exist

**Solution:**
1. Verify order was created successfully
2. Check order ID format (should start with "EC-")
3. Ensure order hasn't expired

### **Issue 4: Network Errors**

**Cause:** Connection issues or blocked requests

**Solution:**
1. Disable browser extensions
2. Check firewall settings
3. Try different network connection
4. Use incognito mode

## 📊 Debugging Tools

### **1. PayPal Developer Dashboard**

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Navigate to "Sandbox" → "Orders"
3. View order details and status
4. Check webhook events

### **2. Browser DevTools**

1. **Network Tab:**
   - Monitor API requests
   - Check for blocked requests
   - Verify response status codes

2. **Console Tab:**
   - Look for JavaScript errors
   - Check PayPal SDK messages
   - Monitor custom log messages

### **3. Server Logs**

Monitor these log patterns:

```bash
# Watch server logs in real-time
tail -f server-railway-production.js.log

# Search for PayPal-related logs
grep -i paypal server-railway-production.js.log

# Search for error patterns
grep -i "capture\|error\|failed" server-railway-production.js.log
```

## 🎯 Testing Checklist

### **Pre-Testing Setup**
- [ ] PayPal sandbox accounts created
- [ ] Environment variables configured
- [ ] Browser extensions disabled
- [ ] Server running and accessible
- [ ] Database connection working

### **Payment Flow Testing**
- [ ] Order creation successful
- [ ] PayPal redirect works
- [ ] Payment completion successful
- [ ] Capture API call successful
- [ ] Success page displays correctly
- [ ] Order saved to database
- [ ] Email sent successfully

### **Error Handling Testing**
- [ ] Invalid order ID handling
- [ ] Network error handling
- [ ] PayPal API error handling
- [ ] User cancellation handling
- [ ] Retry mechanism working

## 🚀 Production Deployment

### **Before Going Live**

1. **Switch to Live Credentials:**
   ```bash
   export PAYPAL_CLIENT_ID=your_live_client_id
   export PAYPAL_CLIENT_SECRET=your_live_client_secret
   export NODE_ENV=production
   ```

2. **Update Webhook URL:**
   - Change from sandbox to live webhook
   - Verify webhook signature validation

3. **Test with Small Amounts:**
   - Start with $1 test transactions
   - Verify all flows work correctly
   - Monitor webhook events

### **Monitoring**

1. **Success Rate Tracking:**
   - Monitor payment success rates
   - Track capture failure rates
   - Alert on unusual patterns

2. **Error Monitoring:**
   - Log all PayPal API errors
   - Monitor webhook delivery
   - Track user-reported issues

## 📞 Support Resources

### **PayPal Developer Support**
- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Developer Community](https://developer.paypal.com/community/)
- [PayPal Support](https://www.paypal.com/support/)

### **Common Error Codes**

| Error Code | Description | Solution |
|------------|-------------|----------|
| `CAPTURE_FAILED` | Payment capture failed | Check order status, retry |
| `ORDER_NOT_FOUND` | Order doesn't exist | Verify order ID, create new order |
| `INVALID_CREDENTIALS` | Wrong API credentials | Check client ID/secret |
| `ORDER_ALREADY_CAPTURED` | Order already processed | Check order status |
| `INSUFFICIENT_FUNDS` | Not enough funds | Add funds to test account |

## 🔄 Quick Fix Commands

### **Reset PayPal Configuration**
```bash
# Restart server with fresh environment
pkill -f "node.*server"
export PAYPAL_CLIENT_ID=your_sandbox_client_id
export PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
export NODE_ENV=development
node server-railway-production.js
```

### **Clear Test Data**
```bash
# Clear sessions and test orders
rm -rf sessions/*
rm -rf temp/*
```

### **Test PayPal Connection**
```bash
# Test PayPal API connectivity
curl -X GET "https://api-m.sandbox.paypal.com/v1/identity/oauth2/userinfo" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📝 Notes

- **Always test in sandbox first** before going live
- **Keep browser extensions disabled** during testing
- **Monitor server logs** for detailed error information
- **Use incognito mode** to avoid extension conflicts
- **Test with small amounts** to minimize risk

This guide should help you resolve the CAPTURE_FAILED issue and successfully test your PayPal integration. 