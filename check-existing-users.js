require('dotenv').config();

console.log('👥 Existing Users Check');
console.log('=======================');

async function checkExistingUsers() {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        // Get all users
        const result = await pool.query('SELECT id, email, name FROM users ORDER BY id DESC');
        
        console.log(`📊 Found ${result.rows.length} users in database:\n`);
        
        result.rows.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🆔 ID: ${user.id}`);
            console.log('');
        });
        
        console.log('🔐 Login Credentials for Testing:');
        console.log('================================');
        console.log('You can try logging in with any of these existing users:');
        console.log('');
        
        result.rows.forEach((user, index) => {
            console.log(`Option ${index + 1}:`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   👤 Name: ${user.name}`);
            console.log('');
        });
        
        console.log('🌐 Login URLs:');
        console.log('=============');
        console.log('Local: http://localhost:3001/login');
        console.log('Live: https://lyricartstudio.shop/login');
        
        console.log('\n💡 Note: You\'ll need to know the password for these users.');
        console.log('If you don\'t know the passwords, you can:');
        console.log('1. Try common passwords (password123, 123456, etc.)');
        console.log('2. Create a new user account through registration');
        console.log('3. Reset passwords if you have access to the email accounts');
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error checking users:', error.message);
    }
}

checkExistingUsers(); 