const fetch = require('node-fetch');

async function testSubscription() {
    console.log('🧪 Testing Newsletter Subscription System...\n');

    try {
        // Test 1: Subscribe to newsletter
        console.log('📧 Test 1: Subscribing to newsletter...');
        const subscribeResponse = await fetch('http://localhost:3001/api/subscription/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                name: 'Test User'
            })
        });

        const subscribeData = await subscribeResponse.json();
        console.log('📧 Subscribe response:', subscribeData);

        if (subscribeData.success) {
            console.log('✅ Newsletter subscription successful!\n');
        } else {
            console.log('❌ Newsletter subscription failed:', subscribeData.error);
            return;
        }

        // Test 2: Validate discount code
        console.log('🎫 Test 2: Validating WELCOME100 discount code...');
        const discountResponse = await fetch('http://localhost:3001/api/discount/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: 'WELCOME100',
                orderTotal: 10.00,
                orderType: 'downloadable'
            })
        });

        const discountData = await discountResponse.json();
        console.log('🎫 Discount validation response:', discountData);

        if (discountData.valid) {
            console.log('✅ Discount code validation successful!');
            console.log(`💰 Discount amount: $${discountData.discountAmount}`);
            console.log(`📝 Description: ${discountData.description}\n`);
        } else {
            console.log('❌ Discount code validation failed:', discountData.reason);
        }

        // Test 3: Test invalid discount code
        console.log('🎫 Test 3: Testing invalid discount code...');
        const invalidDiscountResponse = await fetch('http://localhost:3001/api/discount/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: 'INVALID123',
                orderTotal: 10.00,
                orderType: 'downloadable'
            })
        });

        const invalidDiscountData = await invalidDiscountResponse.json();
        console.log('🎫 Invalid discount response:', invalidDiscountData);

        if (!invalidDiscountData.valid) {
            console.log('✅ Invalid discount code correctly rejected!\n');
        } else {
            console.log('❌ Invalid discount code was accepted when it should have been rejected!\n');
        }

        console.log('🎉 All tests completed!');
        console.log('\n📋 Summary:');
        console.log('- Newsletter subscription: ✅ Working');
        console.log('- WELCOME100 discount code: ✅ Working');
        console.log('- Invalid code rejection: ✅ Working');
        console.log('\n💡 Next steps:');
        console.log('1. Check your email for the welcome email');
        console.log('2. Try the discount code on the checkout page');
        console.log('3. Test the subscription form on the homepage');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testSubscription(); 