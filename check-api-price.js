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
        console.log('🔍 Testing API for design ID 229 price...');
        
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
                console.log('✅ API IS SERVING CORRECT PRICE!');
            } else {
                console.log('❌ API IS SERVING WRONG PRICE!');
            }
        } else {
            console.log('❌ Design ID 229 not found in API response');
        }
        
        // Also test live API
        console.log('\n🌐 Testing live API...');
        const liveData = await makeRequest('https://lyricartstudio.shop/api/designs');
        
        const liveDesign229 = liveData.designs.find(design => design.id === 229);
        
        if (liveDesign229) {
            console.log('✅ Found design ID 229 in LIVE API:');
            console.log('   Price:', liveDesign229.price);
            
            if (liveDesign229.price === 0.5) {
                console.log('✅ LIVE API IS SERVING CORRECT PRICE!');
            } else {
                console.log('❌ LIVE API IS SERVING WRONG PRICE!');
            }
        } else {
            console.log('❌ Design ID 229 not found in LIVE API response');
        }
        
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
    }
}

testAPIPrice(); 