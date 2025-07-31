require('dotenv').config();

console.log('🔐 Live Registration Test');
console.log('========================');

async function testLiveRegistration() {
    try {
        const testUser = {
            name: 'Live Test User',
            email: 'live-test@lyricartstudio.com',
            password: 'test123456'
        };
        
        console.log('📧 Testing live registration with:');
        console.log('   Name:', testUser.name);
        console.log('   Email:', testUser.email);
        console.log('   Password:', testUser.password);
        
        // Test with different headers
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Origin': 'https://lyricartstudio.shop',
            'Referer': 'https://lyricartstudio.shop/register'
        };
        
        const response = await fetch('https://lyricartstudio.shop/api/auth/register', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(testUser)
        });
        
        console.log('\n📡 Response Status:', response.status);
        console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📊 Response Body:', responseText);
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ Registration successful!');
                console.log('📊 Response Data:', data);
            } catch (e) {
                console.log('⚠️ Response is not JSON:', responseText);
            }
        } else {
            console.log('❌ Registration failed with status:', response.status);
            console.log('❌ Error response:', responseText);
        }
        
    } catch (error) {
        console.error('❌ Error testing live registration:', error.message);
    }
}

async function checkRegistrationPage() {
    try {
        console.log('\n🌐 Checking registration page...');
        const response = await fetch('https://lyricartstudio.shop/register');
        console.log('📡 Registration page status:', response.status);
        
        if (response.ok) {
            console.log('✅ Registration page is accessible');
        } else {
            console.log('❌ Registration page is not accessible');
        }
    } catch (error) {
        console.error('❌ Error checking registration page:', error.message);
    }
}

async function main() {
    console.log('🚀 Starting Live Registration Test...\n');
    
    await checkRegistrationPage();
    await testLiveRegistration();
    
    console.log('\n🔧 Possible Issues:');
    console.log('==================');
    console.log('1. Rate limiting blocking registration');
    console.log('2. CSRF protection requiring tokens');
    console.log('3. Input validation rejecting the request');
    console.log('4. Database connection issues on live site');
    console.log('5. Missing environment variables on live site');
    
    console.log('\n💡 Quick Fixes to Try:');
    console.log('======================');
    console.log('1. Check Railway logs for registration errors');
    console.log('2. Temporarily disable rate limiting for registration');
    console.log('3. Check if database is accessible on live site');
    console.log('4. Verify all environment variables are set in Railway');
}

main().catch(console.error); 