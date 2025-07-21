// PayPal Configuration
// Replace these with your actual PayPal client IDs

const paypalConfig = {
    // Sandbox (for testing)
    sandbox: {
        clientId: 'YOUR_SANDBOX_CLIENT_ID_HERE',
        clientSecret: 'YOUR_SANDBOX_CLIENT_SECRET_HERE'
    },
    
    // Production (for live payments)
    production: {
        clientId: 'YOUR_PRODUCTION_CLIENT_ID_HERE',
        clientSecret: 'YOUR_PRODUCTION_CLIENT_SECRET_HERE'
    },
    
    // Current environment
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    
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