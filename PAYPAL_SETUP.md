# PayPal Integration Setup Guide

## **🎯 FULL PAYPAL INTEGRATION WITH CREDIT CARD SUPPORT**

This guide will help you set up PayPal Smart Payment Buttons that accept:
- ✅ **PayPal accounts**
- ✅ **Credit cards** (Visa, Mastercard, American Express, Discover)
- ✅ **Debit cards**
- ✅ **PayPal Credit**
- ✅ **Local payment methods** (depending on region)

---

## **📋 PREREQUISITES**

1. **PayPal Business Account** (not personal)
2. **Verified PayPal account**
3. **Business information** (address, phone, etc.)

---

## **🚀 STEP-BY-STEP SETUP**

### **Step 1: Create PayPal Developer Account**

1. Go to [PayPal Developer Portal](https://developer.paypal.com/)
2. Click **"Log in to Dashboard"**
3. Sign in with your PayPal account
4. Accept the developer agreement

### **Step 2: Create App for Sandbox Testing**

1. In the developer dashboard, go to **"My Apps & Credentials"**
2. Click **"Create App"**
3. Name your app: `LyricArt Studio`
4. Select **"Business"** account type
5. Click **"Create App"**

### **Step 3: Get Sandbox Credentials**

1. Click on your newly created app
2. Copy the **Client ID** (starts with `AQ...`)
3. Copy the **Secret** (starts with `EF...`)
4. These are for **sandbox testing only**

### **Step 4: Update Configuration**

1. Open `paypal-config.js`
2. Replace the sandbox credentials:

```javascript
sandbox: {
    clientId: 'YOUR_ACTUAL_SANDBOX_CLIENT_ID',
    clientSecret: 'YOUR_ACTUAL_SANDBOX_CLIENT_SECRET'
}
```

### **Step 5: Test Sandbox Payments**

1. Start your server: `node server-enhanced.js`
2. Go to `http://localhost:3001`
3. Add items to cart and checkout
4. Use PayPal sandbox test accounts:
   - **Buyer**: `sb-buyer@business.example.com`
   - **Password**: `12345678`

---

## **🌐 PRODUCTION SETUP**

### **Step 1: Create Production App**

1. In PayPal Developer Portal, go to **"My Apps & Credentials"**
2. Click **"Create App"**
3. Name: `LyricArt Studio Production`
4. Select **"Business"** account type
5. Click **"Create App"**

### **Step 2: Get Production Credentials**

1. Click on your production app
2. Copy the **Client ID** and **Secret**
3. These are for **live payments**

### **Step 3: Update Production Config**

```javascript
production: {
    clientId: 'YOUR_ACTUAL_PRODUCTION_CLIENT_ID',
    clientSecret: 'YOUR_ACTUAL_PRODUCTION_CLIENT_SECRET'
}
```

### **Step 4: Deploy with Production Environment**

Set environment variable:
```bash
NODE_ENV=production
```

---

## **💳 CREDIT CARD SUPPORT**

### **Automatic Credit Card Support**

PayPal Smart Payment Buttons **automatically** include credit card support:
- ✅ **Visa**
- ✅ **Mastercard**
- ✅ **American Express**
- ✅ **Discover**
- ✅ **Debit cards**
- ✅ **PayPal Credit**

### **No Additional Setup Required**

The integration already includes:
- **Guest checkout** (no PayPal account required)
- **Credit card processing**
- **Secure payment handling**
- **PCI compliance** (handled by PayPal)

---

## **🔧 CONFIGURATION OPTIONS**

### **Customize Payment Button**

In `pages/checkout.html`, you can customize the PayPal button:

```javascript
paypal.Buttons({
    // Style options
    style: {
        layout: 'vertical',  // or 'horizontal'
        color: 'blue',       // or 'gold', 'silver', 'black'
        shape: 'rect',       // or 'pill'
        label: 'pay'         // or 'paypal', 'buynow', 'checkout'
    },
    
    // Your existing configuration...
}).render('#paypal-button-container');
```

### **Supported Currencies**

Currently set to USD. To support other currencies:

1. Update PayPal SDK URL:
```javascript
// In checkout.html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_ID&currency=EUR&intent=capture"></script>
```

2. Update order creation:
```javascript
currency_code: 'EUR'  // or 'GBP', 'CAD', etc.
```

---

## **🛡️ SECURITY FEATURES**

### **Built-in Security**

- ✅ **PCI DSS compliance** (PayPal handles)
- ✅ **Fraud protection**
- ✅ **Secure tokenization**
- ✅ **3D Secure support**
- ✅ **Address verification**

### **Best Practices**

1. **Never store credit card data** (PayPal handles this)
2. **Use HTTPS in production**
3. **Validate orders server-side**
4. **Implement webhook notifications**

---

## **📊 TESTING**

### **Sandbox Test Cards**

Use these test credit cards in sandbox mode:

| Card Type | Number | Expiry | CVV |
|-----------|--------|--------|-----|
| Visa | 4111111111111111 | 12/25 | 123 |
| Mastercard | 5555555555554444 | 12/25 | 123 |
| American Express | 378282246310005 | 12/25 | 1234 |
| Discover | 6011111111111117 | 12/25 | 123 |

### **Test Scenarios**

1. **Successful payment** with credit card
2. **Successful payment** with PayPal account
3. **Failed payment** (use invalid card)
4. **Cancelled payment**
5. **Network errors**

---

## **🚨 TROUBLESHOOTING**

### **Common Issues**

1. **"Client ID not found"**
   - Check your client ID in `paypal-config.js`
   - Ensure you're using the correct environment

2. **"Payment failed"**
   - Check browser console for errors
   - Verify PayPal account status
   - Test with sandbox accounts first

3. **"Button not loading"**
   - Check internet connection
   - Verify PayPal SDK URL
   - Check browser console for errors

### **Debug Mode**

Enable debug logging:
```javascript
// In checkout.html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_ID&currency=USD&intent=capture&debug=true"></script>
```

---

## **📞 SUPPORT**

- **PayPal Developer Support**: [developer.paypal.com/support](https://developer.paypal.com/support)
- **PayPal Business Support**: [paypal.com/business/contact-us](https://paypal.com/business/contact-us)

---

## **✅ VERIFICATION CHECKLIST**

- [ ] PayPal Developer account created
- [ ] Sandbox app created and credentials obtained
- [ ] `paypal-config.js` updated with sandbox credentials
- [ ] Sandbox testing completed successfully
- [ ] Production app created (when ready for live)
- [ ] Production credentials obtained and configured
- [ ] HTTPS enabled in production
- [ ] Webhook notifications configured (optional)
- [ ] Error handling tested
- [ ] Payment flow tested end-to-end

---

**🎉 Your PayPal integration is now ready to accept all major credit cards and payment methods!** 