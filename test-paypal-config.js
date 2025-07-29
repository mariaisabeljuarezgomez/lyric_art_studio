require('dotenv').config();

console.log('🔧 PayPal Configuration Test');
console.log('============================');

// Check environment variables
console.log('PAYPAL_MODE:', process.env.PAYPAL_MODE);
console.log('PAYPAL_CLIENT_ID exists:', !!process.env.PAYPAL_CLIENT_ID);
console.log('PAYPAL_CLIENT_SECRET exists:', !!process.env.PAYPAL_CLIENT_SECRET);
console.log('PAYPAL_WEBHOOK_ID exists:', !!process.env.PAYPAL_WEBHOOK_ID);

// Determine PayPal environment
const paypalMode = process.env.PAYPAL_MODE || 'sandbox';
const isProduction = paypalMode === 'production' || paypalMode === 'live';

console.log('\n📊 Environment Analysis:');
console.log('========================');
console.log('Mode from env:', paypalMode);
console.log('Is Production:', isProduction);

if (isProduction) {
    console.log('✅ PRODUCTION MODE - Ready for live payments!');
    console.log('🌐 PayPal Base URL: https://api-m.paypal.com');
} else {
    console.log('⚠️ SANDBOX MODE - Test payments only');
    console.log('🌐 PayPal Base URL: https://api-m.sandbox.paypal.com');
}

console.log('\n🔗 Webhook Configuration:');
console.log('========================');
console.log('Webhook URL: https://lyricartstudio.shop/api/paypal/webhook');
console.log('Webhook ID:', process.env.PAYPAL_WEBHOOK_ID || 'Not set');

console.log('\n🎯 Summary:');
console.log('===========');
if (isProduction) {
    console.log('✅ Your site is configured for LIVE PayPal payments!');
    console.log('✅ All real payments will be processed');
    console.log('✅ Webhook notifications will be sent to your live PayPal account');
} else {
    console.log('⚠️ Your site is still in SANDBOX mode');
    console.log('⚠️ Only test payments will work');
    console.log('⚠️ No real money will be processed');
} 