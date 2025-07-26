const http = require('http');

console.log('🧪 Testing Discount Code System with New Users');
console.log('==============================================\n');

function testDiscountCode(email, name) {
    console.log(`📧 Testing with email: ${email}`);
    console.log(`👤 Name: ${name}\n`);

    // Test 1: Newsletter subscription
    console.log('1️⃣ Testing Newsletter Subscription...');
    const subscriptionData = JSON.stringify({
        email: email,
        name: name
    });

    const subscriptionOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/subscription/create',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(subscriptionData)
        }
    };

    const subscriptionReq = http.request(subscriptionOptions, (res) => {
        console.log(`📡 Subscription Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                if (jsonData.success) {
                    console.log('✅ Newsletter subscription successful!');
                    console.log(`📧 Welcome email sent to: ${email}\n`);
                    
                    // Test 2: Discount code validation
                    setTimeout(() => {
                        testDiscountValidation(email);
                    }, 1000);
                } else {
                    console.log('❌ Newsletter subscription failed:', jsonData.error);
                }
            } catch (e) {
                console.log('❌ Could not parse subscription response');
            }
        });
    });

    subscriptionReq.on('error', (e) => {
        console.error(`❌ Subscription request error: ${e.message}`);
    });

    subscriptionReq.write(subscriptionData);
    subscriptionReq.end();
}

function testDiscountValidation(email) {
    console.log('2️⃣ Testing Discount Code Validation...');
    
    const discountData = JSON.stringify({
        code: 'WELCOME100',
        orderTotal: 10.00,
        orderType: 'downloadable'
    });

    const discountOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/discount/validate',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(discountData)
        }
    };

    const discountReq = http.request(discountOptions, (res) => {
        console.log(`📡 Discount Validation Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                if (jsonData.valid) {
                    console.log('✅ Discount code validation successful!');
                    console.log(`💰 Discount amount: $${jsonData.discountAmount}`);
                    console.log(`📝 Description: ${jsonData.description}`);
                    console.log(`🎯 This discount can be used by: ${email}\n`);
                } else {
                    console.log('❌ Discount code validation failed:', jsonData.reason);
                }
            } catch (e) {
                console.log('❌ Could not parse discount response');
            }
        });
    });

    discountReq.on('error', (e) => {
        console.error(`❌ Discount request error: ${e.message}`);
    });

    discountReq.write(discountData);
    discountReq.end();
}

// Test with different email addresses
const testUsers = [
    { email: 'test1@example.com', name: 'Test User 1' },
    { email: 'test2@example.com', name: 'Test User 2' },
    { email: 'test3@example.com', name: 'Test User 3' }
];

console.log('🚀 Starting tests...\n');

// Test each user with a delay
testUsers.forEach((user, index) => {
    setTimeout(() => {
        console.log(`\n🧪 Test ${index + 1}/${testUsers.length}`);
        console.log('='.repeat(50));
        testDiscountCode(user.email, user.name);
    }, index * 3000); // 3 second delay between tests
});

console.log('\n📋 Test Summary:');
console.log('• Each test will subscribe a new email to the newsletter');
console.log('• Each test will validate the WELCOME100 discount code');
console.log('• The discount should work for each new email address');
console.log('• Check your email for welcome messages');
console.log('• Check the server logs for detailed information\n'); 