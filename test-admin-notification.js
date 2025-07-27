const fetch = require('node-fetch');

async function testAdminNotification() {
    console.log('🧪 Testing Admin Notification System...');
    
    const testData = {
        email: 'fresh-test-subscriber@example.com',
        name: 'Fresh Test User',
        recaptchaToken: 'test-token' // Placeholder, server is lenient for debugging
    };
    
    try {
        console.log('📧 Sending test subscription request...');
        console.log('📧 Test data:', testData);
        
        const response = await fetch('http://localhost:3001/api/subscription/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        console.log('📧 Response status:', response.status);
        console.log('📧 Response data:', result);
        
        if (response.ok && result.success) {
            console.log('✅ Test subscription successful!');
            console.log('📧 Check your email at mariaisabeljuarezgomez85@gmail.com for the admin notification');
        } else {
            console.log('❌ Test subscription failed:', result.error || result.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testAdminNotification(); 