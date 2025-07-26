const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabase() {
    try {
        console.log('🔍 Checking database tables...\n');

        // Check if newsletter_subscribers table exists
        const subscribersCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'newsletter_subscribers'
            );
        `);

        console.log('📧 Newsletter subscribers table exists:', subscribersCheck.rows[0].exists);

        // Check if discount_codes table exists
        const discountCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'discount_codes'
            );
        `);

        console.log('🎫 Discount codes table exists:', discountCheck.rows[0].exists);

        // Check if discount_code_usage table exists
        const usageCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'discount_code_usage'
            );
        `);

        console.log('📊 Discount code usage table exists:', usageCheck.rows[0].exists);

        // Check if pending_orders table exists
        const pendingOrdersCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'pending_orders'
            );
        `);

        if (!pendingOrdersCheck.rows[0].exists) {
            console.log('\n📦 Creating pending_orders table...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS pending_orders (
                    id SERIAL PRIMARY KEY,
                    order_id VARCHAR(255) UNIQUE NOT NULL,
                    user_id VARCHAR(255) REFERENCES users(id),
                    user_email VARCHAR(255),
                    user_name VARCHAR(255),
                    items JSONB NOT NULL,
                    total DECIMAL(10,2) NOT NULL,
                    discount_info JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed BOOLEAN DEFAULT FALSE
                )
            `);
            console.log('✅ Pending orders table created');
        } else {
            // Check if discount_info column exists
            const discountInfoCheck = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'pending_orders' 
                    AND column_name = 'discount_info'
                );
            `);
            
            if (!discountInfoCheck.rows[0].exists) {
                console.log('\n🎫 Adding discount_info column to pending_orders table...');
                await pool.query(`
                    ALTER TABLE pending_orders 
                    ADD COLUMN discount_info JSONB
                `);
                console.log('✅ discount_info column added to pending_orders table');
            } else {
                console.log('\n✅ discount_info column already exists in pending_orders table');
            }
        }

        // If tables don't exist, create them
        if (!subscribersCheck.rows[0].exists) {
            console.log('\n📧 Creating newsletter_subscribers table...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255),
                    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'active',
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    welcome_email_sent BOOLEAN DEFAULT FALSE,
                    last_email_sent TIMESTAMP
                )
            `);
            console.log('✅ Newsletter subscribers table created');
        }

        if (!discountCheck.rows[0].exists) {
            console.log('\n🎫 Creating discount_codes table...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS discount_codes (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    description TEXT,
                    discount_type VARCHAR(20) NOT NULL,
                    discount_value DECIMAL(10,2) NOT NULL,
                    minimum_order DECIMAL(10,2) DEFAULT 0,
                    maximum_discount DECIMAL(10,2),
                    usage_limit INTEGER,
                    used_count INTEGER DEFAULT 0,
                    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    valid_until TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE,
                    applicable_to VARCHAR(50) DEFAULT 'all',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Discount codes table created');
        }

        if (!usageCheck.rows[0].exists) {
            console.log('\n📊 Creating discount_code_usage table...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS discount_code_usage (
                    id SERIAL PRIMARY KEY,
                    code_id INTEGER REFERENCES discount_codes(id),
                    user_id VARCHAR(255) REFERENCES users(id),
                    email VARCHAR(255),
                    ip_address VARCHAR(45),
                    order_id VARCHAR(255),
                    discount_amount DECIMAL(10,2) NOT NULL,
                    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Discount code usage table created');
        }

        // Check if WELCOME100 code exists
        const welcomeCodeCheck = await pool.query(`
            SELECT * FROM discount_codes WHERE code = 'WELCOME100'
        `);

        if (welcomeCodeCheck.rows.length === 0) {
            console.log('\n🎫 Creating WELCOME100 discount code...');
            await pool.query(`
                INSERT INTO discount_codes (
                    code, description, discount_type, discount_value, 
                    minimum_order, maximum_discount, usage_limit, 
                    valid_until, applicable_to, is_active
                ) VALUES (
                    'WELCOME100', 
                    'Welcome discount for new newsletter subscribers - 25% off first purchase',
                    'percentage',
                    25.00,
                    0.00,
                    NULL,
                    NULL,
                    NULL,
                    'downloadable',
                    TRUE
                )
            `);
            console.log('✅ WELCOME100 discount code created');
        } else {
            console.log('\n✅ WELCOME100 discount code already exists');
        }

        console.log('\n🎉 Database check completed successfully!');

    } catch (error) {
        console.error('❌ Database check error:', error);
    } finally {
        await pool.end();
    }
}

checkDatabase(); 