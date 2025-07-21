// Create Test User Script
// Run this to create a test user for login testing

const { DatabaseManager } = require('./database-setup');

async function createTestUser() {
    const dbManager = new DatabaseManager();
    
    try {
        const testUser = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
        };
        
        console.log('🔧 Creating test user...');
        const user = await dbManager.createUser(testUser);
        console.log('✅ Test user created successfully:', user.email);
        console.log('📧 Email:', testUser.email);
        console.log('🔑 Password:', testUser.password);
        
    } catch (error) {
        if (error.message === 'User already exists') {
            console.log('ℹ️ Test user already exists');
            console.log('📧 Email: test@example.com');
            console.log('🔑 Password: password123');
        } else {
            console.error('❌ Error creating test user:', error);
        }
    }
}

createTestUser(); 