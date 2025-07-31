require('dotenv').config();

console.log('🔐 User Registration Test');
console.log('=========================');

async function testRegistration() {
    try {
        const testUser = {
            name: 'Test Registration User',
            email: 'test-registration@lyricartstudio.com',
            password: 'test123456'
        };
        
        console.log('📧 Testing registration with:');
        console.log('   Name:', testUser.name);
        console.log('   Email:', testUser.email);
        console.log('   Password:', testUser.password);
        
        const response = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
        });
        
        console.log('\n📡 Response Status:', response.status);
        
        const data = await response.json();
        console.log('📊 Response Data:', data);
        
        if (response.ok && data.success) {
            console.log('✅ Registration successful!');
            console.log('🆔 User ID:', data.user.id);
            console.log('📧 Email:', data.user.email);
            console.log('👤 Name:', data.user.name);
        } else {
            console.log('❌ Registration failed:');
            console.log('   Error:', data.error);
        }
        
    } catch (error) {
        console.error('❌ Error testing registration:', error.message);
    }
}

// Check if server is running
async function checkServer() {
    try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
            console.log('✅ Server is running');
            return true;
        } else {
            console.log('❌ Server is not responding');
            return false;
        }
    } catch (error) {
        console.log('❌ Server is not running');
        return false;
    }
}

async function main() {
    console.log('🚀 Starting Registration Test...\n');
    
    const serverRunning = await checkServer();
    
    if (serverRunning) {
        await testRegistration();
        
        console.log('\n🌐 Registration URLs:');
        console.log('====================');
        console.log('Local: http://localhost:3001/register');
        console.log('Live: https://lyricartstudio.shop/register');
        
        console.log('\n📋 Test Registration Data:');
        console.log('==========================');
        console.log('Name: Test Registration User');
        console.log('Email: test-registration@lyricartstudio.com');
        console.log('Password: test123456');
        
    } else {
        console.log('\n❌ Cannot test registration - server is not running');
        console.log('Please start the server with: npm start');
    }
}

main().catch(console.error); 