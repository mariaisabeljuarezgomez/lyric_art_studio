const https = require('https');
const http = require('http');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        client.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

async function testAPIPrice() {
    try {
        console.log('🔍 Testing API endpoint for design price...');
        
        // Test local API
        const localData = await makeRequest('http://localhost:3001/api/designs');
        
        // Find design ID 229
        const design229 = localData.designs.find(design => design.id === 229);
        
        if (design229) {
            console.log('✅ Found design ID 229 in API:');
            console.log('   Artist:', design229.artist);
            console.log('   Song:', design229.song);
            console.log('   Price:', design229.price);
            console.log('   Expected price: 0.5');
            
            if (design229.price === 0.5) {
                console.log('✅ API PRICE IS CORRECT!');
            } else {
                console.log('❌ API PRICE IS WRONG! Expected 0.5, got:', design229.price);
            }
        } else {
            console.log('❌ Design ID 229 not found in API response');
        }
        
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
    }
}

testAPIPrice(); 