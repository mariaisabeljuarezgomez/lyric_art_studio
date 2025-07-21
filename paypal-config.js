// PayPal Configuration
// Uses environment variables for security

const paypalConfig = {
    // Sandbox (for testing)
    sandbox: {
        clientId: process.env.PAYPAL_CLIENT_ID || 'YOUR_SANDBOX_CLIENT_ID_HERE',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'YOUR_SANDBOX_CLIENT_SECRET_HERE'
    },
    
    // Production (for live payments)
    production: {
        clientId: process.env.PAYPAL_CLIENT_ID || 'YOUR_PRODUCTION_CLIENT_ID_HERE',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'YOUR_PRODUCTION_CLIENT_SECRET_HERE'
    },
    
    // Current environment
    environment: process.env.PAYPAL_MODE || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'),
    
    // Get current client ID
    getClientId: function() {
        return this[this.environment].clientId;
    },
    
    // Get current client secret
    getClientSecret: function() {
        return this[this.environment].clientSecret;
    },
    
    // Get SDK URL with current client ID
    getSDKUrl: function() {
        const clientId = this.getClientId();
        return `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    }
};

module.exports = paypalConfig; 