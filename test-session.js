// Test Session Persistence
// This script tests the login and session functionality

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testSessionPersistence() {
    console.log('🧪 Testing session persistence...\n');
    
    try {
        // Step 1: Test login
        console.log('1️⃣ Attempting login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'test@example.com',
            password: 'password123'
        });
        
        console.log('✅ Login response:', loginResponse.data);
        
        // Get cookies from login response
        const cookies = loginResponse.headers['set-cookie'];
        console.log('🍪 Cookies received:', cookies);
        
        // Step 2: Test auth status immediately after login
        console.log('\n2️⃣ Testing auth status after login...');
        const authResponse = await axios.get(`${BASE_URL}/api/auth/status`, {
            headers: {
                Cookie: cookies ? cookies.join('; ') : ''
            }
        });
        
        console.log('✅ Auth status response:', authResponse.data);
        
        // Step 3: Test auth status without cookies (should fail)
        console.log('\n3️⃣ Testing auth status without cookies...');
        const noCookieResponse = await axios.get(`${BASE_URL}/api/auth/status`);
        console.log('❌ Auth status without cookies:', noCookieResponse.data);
        
        console.log('\n🎉 Session persistence test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testSessionPersistence(); 