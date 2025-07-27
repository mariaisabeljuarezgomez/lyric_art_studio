const fetch = require('node-fetch');

async function testApiRoute() {
    try {
        console.log('🧪 Testing API route...');
        
        // Test the health endpoint first
        const healthResponse = await fetch('https://lyricartstudio.shop/api/health');
        console.log('🏥 Health endpoint status:', healthResponse.status);
        
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('🏥 Health endpoint data:', healthData);
        }
        
        // Test the payment capture endpoint
        const captureResponse = await fetch('https://lyricartstudio.shop/api/payment/capture-paypal-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderId: 'test-order-id'
            })
        });
        
        console.log('💳 Payment capture endpoint status:', captureResponse.status);
        console.log('💳 Payment capture endpoint headers:', Object.fromEntries(captureResponse.headers.entries()));
        
        const captureText = await captureResponse.text();
        console.log('💳 Payment capture endpoint response:', captureText.substring(0, 200) + '...');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testApiRoute(); 