// test-paypal.js
const fetch = require('node-fetch');

async function testPayPal() {
    console.log('🧪 Testing PayPal integration...');
    
    try {
        // Test 1: Health endpoint
        console.log('\n📡 Testing health endpoint...');
        const healthResponse = await fetch('http://localhost:8080/api/health');
        console.log('🏥 Health status:', healthResponse.status);
        
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('🏥 Health data:', healthData);
        }
        
        // Test 2: PayPal order creation
        console.log('\n📡 Testing PayPal order creation...');
        const createResponse = await fetch('http://localhost:8080/api/payment/create-paypal-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [{ itemId: "test", designName: "Test Design", price: 3.00, quantity: 1 }],
                total: 3.24
            })
        });
        
        console.log('💳 Create order status:', createResponse.status);
        
        if (createResponse.ok) {
            const createData = await createResponse.json();
            console.log('✅ Create order result:', createData);
            
            // Test 3: PayPal order capture (if order was created)
            if (createData.success && createData.order && createData.order.id) {
                console.log('\n📡 Testing PayPal order capture...');
                const captureResponse = await fetch('http://localhost:8080/api/payment/capture-paypal-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: createData.order.id
                    })
                });
                
                console.log('💳 Capture status:', captureResponse.status);
                
                if (captureResponse.ok) {
                    const captureData = await captureResponse.json();
                    console.log('✅ Capture result:', captureData);
                } else {
                    const errorData = await captureResponse.text();
                    console.log('❌ Capture error:', errorData);
                }
            }
        } else {
            const errorData = await createResponse.text();
            console.log('❌ Create order error:', errorData);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testPayPal(); 