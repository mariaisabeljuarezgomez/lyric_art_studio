require('dotenv').config();
const bcrypt = require('bcrypt');

console.log('🔐 User Login Troubleshooting');
console.log('==============================');

// Test database connection
async function testDatabaseConnection() {
    console.log('\n📊 Testing Database Connection...');
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful');
        console.log('🕐 Database time:', result.rows[0].now);
        
        // Check if users table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('✅ Users table exists');
            
            // Count users
            const userCount = await pool.query('SELECT COUNT(*) FROM users');
            console.log('👥 Total users in database:', userCount.rows[0].count);
            
            // List all users (email only for security)
            const users = await pool.query('SELECT email, name FROM users LIMIT 5');
            console.log('📋 Sample users:');
            users.rows.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.email} (${user.name})`);
            });
            
        } else {
            console.log('❌ Users table does not exist');
        }
        
        await pool.end();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Create a test user
async function createTestUser() {
    console.log('\n👤 Creating Test User...');
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        const testEmail = 'test@lyricartstudio.com';
        const testPassword = 'test123456';
        const testName = 'Test User';
        
        // Check if user already exists
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [testEmail]);
        
        if (existingUser.rows.length > 0) {
            console.log('ℹ️ Test user already exists');
            console.log('📧 Email:', testEmail);
            console.log('🔑 Password:', testPassword);
            console.log('👤 Name:', testName);
        } else {
            // Create new user
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            const result = await pool.query(
                'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
                [testEmail, hashedPassword, testName]
            );
            
            console.log('✅ Test user created successfully');
            console.log('📧 Email:', testEmail);
            console.log('🔑 Password:', testPassword);
            console.log('👤 Name:', testName);
            console.log('🆔 User ID:', result.rows[0].id);
        }
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error creating test user:', error.message);
    }
}

// Test login functionality
async function testLogin() {
    console.log('\n🔐 Testing Login Functionality...');
    try {
        const testEmail = 'test@lyricartstudio.com';
        const testPassword = 'test123456';
        
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        // Find user
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [testEmail]);
        
        if (result.rows.length === 0) {
            console.log('❌ Test user not found');
            return;
        }
        
        const user = result.rows[0];
        console.log('✅ User found:', user.email);
        
        // Test password
        const isValidPassword = await bcrypt.compare(testPassword, user.password);
        
        if (isValidPassword) {
            console.log('✅ Password is valid');
            console.log('✅ Login should work with these credentials');
        } else {
            console.log('❌ Password is invalid');
        }
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error testing login:', error.message);
    }
}

// Main function
async function main() {
    console.log('🚀 Starting User Login Troubleshooting...\n');
    
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
        // Create test user
        await createTestUser();
        
        // Test login
        await testLogin();
        
        console.log('\n📋 Login Test Credentials:');
        console.log('==========================');
        console.log('📧 Email: test@lyricartstudio.com');
        console.log('🔑 Password: test123456');
        console.log('👤 Name: Test User');
        
        console.log('\n🌐 Test URLs:');
        console.log('=============');
        console.log('Local: http://localhost:3001/login');
        console.log('Live: https://lyricartstudio.shop/login');
        
        console.log('\n🔧 Troubleshooting Steps:');
        console.log('========================');
        console.log('1. Try logging in with the test credentials above');
        console.log('2. Check browser console for any errors');
        console.log('3. Check server logs for authentication issues');
        console.log('4. Make sure the server is running');
        console.log('5. Verify database connection is working');
        
    } else {
        console.log('\n❌ Cannot proceed without database connection');
        console.log('Please check your DATABASE_URL environment variable');
    }
}

main().catch(console.error); 