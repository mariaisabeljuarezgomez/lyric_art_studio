// Modern PayPal Configuration for REST API
// Uses environment variables for security

const paypalConfig = {
    // Sandbox (for testing)
    sandbox: {
        clientId: process.env.PAYPAL_CLIENT_ID || 'YOUR_SANDBOX_CLIENT_ID_HERE',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'YOUR_SANDBOX_CLIENT_SECRET_HERE',
        baseUrl: 'https://api-m.sandbox.paypal.com'
    },
    
    // Production (for live payments)
    production: {
        clientId: process.env.PAYPAL_CLIENT_ID || 'YOUR_PRODUCTION_CLIENT_ID_HERE',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'YOUR_PRODUCTION_CLIENT_SECRET_HERE',
        baseUrl: 'https://api-m.paypal.com'
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
    
    // Get current base URL
    getBaseUrl: function() {
        return this[this.environment].baseUrl;
    },
    
    // Get SDK URL with current client ID for frontend
    getSDKUrl: function() {
        const clientId = this.getClientId();
        return `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&disable-funding=credit,card`;
    },
    
    // Get SDK URL with credit card support
    getSDKUrlWithCards: function() {
        const clientId = this.getClientId();
        return `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons,marks&enable-funding=venmo,paylater`;
    }
};

module.exports = paypalConfig; 