// Simple test for login functionality
const http = require('http');

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonBody = JSON.parse(body);
                    resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
                } catch (error) {
                    resolve({ status: res.statusCode, data: body, headers: res.headers });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testLogin() {
    console.log('🧪 Testing login functionality...\n');
    
    try {
        // Test login
        console.log('1️⃣ Attempting login...');
        const loginResponse = await makeRequest('POST', '/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });
        
        console.log('✅ Login response status:', loginResponse.status);
        console.log('✅ Login response data:', loginResponse.data);
        console.log('🍪 Cookies:', loginResponse.headers['set-cookie']);
        
        if (loginResponse.data.success) {
            console.log('🎉 Login successful!');
            
            // Test auth status
            console.log('\n2️⃣ Testing auth status...');
            const authResponse = await makeRequest('GET', '/api/auth/status');
            console.log('✅ Auth status:', authResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testLogin(); 