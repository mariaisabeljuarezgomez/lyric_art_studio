require('dotenv').config();
const bcrypt = require('bcrypt');

console.log('🔐 Reset Test User Password');
console.log('============================');

async function resetTestUserPassword() {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        const testEmail = 'test@example.com';
        const newPassword = 'test123456';
        
        // Check if test user exists
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [testEmail]);
        
        if (existingUser.rows.length === 0) {
            console.log('❌ Test user not found');
            console.log('Creating a new test user...');
            
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const result = await pool.query(
                'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
                [testEmail, hashedPassword, 'Test User']
            );
            
            console.log('✅ New test user created successfully');
            console.log('📧 Email:', testEmail);
            console.log('🔑 Password:', newPassword);
            console.log('👤 Name: Test User');
            console.log('🆔 User ID:', result.rows[0].id);
            
        } else {
            // Update existing test user password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.query(
                'UPDATE users SET password = $1 WHERE email = $2',
                [hashedPassword, testEmail]
            );
            
            console.log('✅ Test user password updated successfully');
            console.log('📧 Email:', testEmail);
            console.log('🔑 New Password:', newPassword);
            console.log('👤 Name: Test User');
        }
        
        console.log('\n🌐 Login URLs:');
        console.log('=============');
        console.log('Local: http://localhost:3001/login');
        console.log('Live: https://lyricartstudio.shop/login');
        
        console.log('\n📋 Login Credentials:');
        console.log('====================');
        console.log('📧 Email: test@example.com');
        console.log('🔑 Password: test123456');
        
        console.log('\n✅ You can now test the login functionality!');
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error resetting test user password:', error.message);
    }
}

resetTestUserPassword(); 