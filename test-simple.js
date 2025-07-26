const http = require('http');

function testDiscountCode() {
    console.log('🧪 Testing discount code validation...\n');

    const postData = JSON.stringify({
        code: 'WELCOME100',
        orderTotal: 10.00,
        orderType: 'downloadable'
    });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/discount/validate',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        console.log(`📡 Status: ${res.statusCode}`);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('📡 Response body:', data);
            try {
                const jsonData = JSON.parse(data);
                console.log('✅ Parsed response:', jsonData);
                
                if (jsonData.valid) {
                    console.log('🎉 Discount code validation successful!');
                    console.log(`💰 Discount amount: $${jsonData.discountAmount}`);
                    console.log(`📝 Description: ${jsonData.description}`);
                } else {
                    console.log('❌ Discount code validation failed:', jsonData.reason);
                }
            } catch (e) {
                console.log('❌ Could not parse JSON response');
            }
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Request error: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

testDiscountCode(); 