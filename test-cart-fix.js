const http = require('http');

// Test cart functionality
async function testCart() {
    console.log('🧪 Testing cart functionality...');
    
    // Test 1: Add item to cart
    console.log('\n📦 Test 1: Adding item to cart');
    const addData = JSON.stringify({
        designId: 'test-design-1',
        format: 'digital-download',
        price: 3
    });
    
    const addOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/cart/add',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(addData)
        }
    };
    
    try {
        const addResult = await makeRequest(addOptions, addData);
        console.log('✅ Add to cart result:', addResult);
        
        // Test 2: Get cart contents
        console.log('\n🛒 Test 2: Getting cart contents');
        const getOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/cart',
            method: 'GET'
        };
        
        const getResult = await makeRequest(getOptions);
        console.log('✅ Get cart result:', getResult);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve(parsed);
                } catch (error) {
                    resolve(responseData);
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (data) {
            req.write(data);
        }
        
        req.end();
    });
}

// Run the test
testCart(); 