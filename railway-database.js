// Railway PostgreSQL Database Configuration
// Handles database connection and session storage

const { Pool } = require('pg');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs'); // Added for password hashing/verification

class RailwayDatabase {
    constructor() {
        this.pool = null;
        this.init();
    }

    init() {
        // Railway provides DATABASE_URL environment variable
        const connectionString = process.env.DATABASE_URL;
        
        if (!connectionString) {
            throw new Error('DATABASE_URL environment variable is required');
        }
        
        this.pool = new Pool({
            connectionString: connectionString,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Test connection
        this.pool.query('SELECT NOW()', (err, res) => {
            if (err) {
                console.error('❌ Database connection failed:', err.message);
            } else {
                console.log('✅ Railway PostgreSQL connected successfully');
            }
        });
    }

    // Get session store for express-session
    getSessionStore() {
        return pgSession({
            pool: this.pool,
            tableName: 'sessions',
            createTableIfMissing: true
        });
    }

    // Initialize database tables
    async initializeTables() {
        const client = await this.pool.connect();
        
        try {
            // Users table
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(255) PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    verified BOOLEAN DEFAULT FALSE,
                    verification_token VARCHAR(255),
                    profile JSONB DEFAULT '{}'
                )
            `);

            // Orders table
            await client.query(`
                CREATE TABLE IF NOT EXISTS orders (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) REFERENCES users(id),
                    items JSONB NOT NULL,
                    total DECIMAL(10,2) NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending',
                    payment_method VARCHAR(100),
                    payment_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Cart items table
            await client.query(`
                CREATE TABLE IF NOT EXISTS cart_items (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(255) NOT NULL,
                    design_id VARCHAR(255) NOT NULL,
                    format VARCHAR(100) NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    quantity INTEGER DEFAULT 1,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(session_id, design_id, format)
                )
            `);

            // Subscriptions table
            await client.query(`
                CREATE TABLE IF NOT EXISTS subscriptions (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) REFERENCES users(id),
                    plan VARCHAR(100) NOT NULL,
                    status VARCHAR(50) DEFAULT 'active',
                    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    end_date TIMESTAMP,
                    payment_method VARCHAR(100),
                    payment_id VARCHAR(255),
                    auto_renew BOOLEAN DEFAULT TRUE
                )
            `);

            // Newsletter subscribers table
            await client.query(`
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

            // Discount codes table
            await client.query(`
                CREATE TABLE IF NOT EXISTS discount_codes (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    description TEXT,
                    discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
                    discount_value DECIMAL(10,2) NOT NULL,
                    minimum_order DECIMAL(10,2) DEFAULT 0,
                    maximum_discount DECIMAL(10,2),
                    usage_limit INTEGER,
                    used_count INTEGER DEFAULT 0,
                    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    valid_until TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE,
                    applicable_to VARCHAR(50) DEFAULT 'all', -- 'all', 'downloadable', 'custom'
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Discount code usage tracking table
            await client.query(`
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

            console.log('✅ Database tables initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization error:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // User management
    async createUser(userData) {
        const { email, password, name } = userData;
        const hashedPassword = this.hashPassword(password);
        const userId = require('crypto').randomUUID();
        
        const query = `
            INSERT INTO users (id, email, password, name)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, name, created_at
        `;
        
        const result = await this.pool.query(query, [userId, email, hashedPassword, name]);
        return result.rows[0];
    }

    async authenticateUser(email, password) {
        const query = `
            SELECT id, email, password, name, created_at
            FROM users
            WHERE email = $1
        `;
        
        const result = await this.pool.query(query, [email]);
        const user = result.rows[0];
        
        if (!user || !this.verifyPassword(password, user.password)) {
            throw new Error('Invalid credentials');
        }
        
        return { ...user, password: undefined };
    }

    async getUserById(userId) {
        const query = `
            SELECT id, email, name, created_at, verified, profile
            FROM users
            WHERE id = $1
        `;
        
        const result = await this.pool.query(query, [userId]);
        return result.rows[0] || null;
    }

    // Cart management
    async getCart(sessionId) {
        const query = `
            SELECT design_id, format, price, quantity
            FROM cart_items
            WHERE session_id = $1
        `;
        
        const result = await this.pool.query(query, [sessionId]);
        const items = result.rows;
        
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        
        return { items, total, itemCount };
    }

    async addToCart(sessionId, designId, format, price) {
        const query = `
            INSERT INTO cart_items (session_id, design_id, format, price, quantity)
            VALUES ($1, $2, $3, $4, 1)
            ON CONFLICT (session_id, design_id, format)
            DO UPDATE SET quantity = cart_items.quantity + 1
            RETURNING *
        `;
        
        await this.pool.query(query, [sessionId, designId, format, price]);
        return this.getCart(sessionId);
    }

    async removeFromCart(sessionId, designId, format) {
        const query = `
            DELETE FROM cart_items
            WHERE session_id = $1 AND design_id = $2 AND format = $3
        `;
        
        await this.pool.query(query, [sessionId, designId, format]);
        return this.getCart(sessionId);
    }

    async clearCart(sessionId) {
        const query = `
            DELETE FROM cart_items
            WHERE session_id = $1
        `;
        
        await this.pool.query(query, [sessionId]);
    }

    // Order management
    async createOrder(orderData) {
        const { userId, items, total, paymentMethod, paymentId } = orderData;
        
        const query = `
            INSERT INTO orders (user_id, items, total, payment_method, payment_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        
        const result = await this.pool.query(query, [userId, JSON.stringify(items), total, paymentMethod, paymentId]);
        return result.rows[0];
    }

    async updateOrderStatus(orderId, status) {
        const query = `
            UPDATE orders
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        
        const result = await this.pool.query(query, [status, orderId]);
        return result.rows[0];
    }

    async getUserOrders(userId) {
        const query = `
            SELECT * FROM orders
            WHERE user_id = $1
            ORDER BY created_at DESC
        `;
        
        const result = await this.pool.query(query, [userId]);
        return result.rows;
    }

    // Utility methods
    hashPassword(password) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    verifyPassword(password, hashedPassword) {
        return bcrypt.compareSync(password, hashedPassword);
    }

    // Newsletter subscriber management
    async addNewsletterSubscriber(email, name = null, ipAddress = null, userAgent = null) {
        const query = `
            INSERT INTO newsletter_subscribers (email, name, ip_address, user_agent)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) 
            DO UPDATE SET 
                status = 'active',
                subscribed_at = CURRENT_TIMESTAMP,
                ip_address = COALESCE($3, newsletter_subscribers.ip_address),
                user_agent = COALESCE($4, newsletter_subscribers.user_agent)
            RETURNING *
        `;
        
        const result = await this.pool.query(query, [email, name, ipAddress, userAgent]);
        return result.rows[0];
    }

    async getNewsletterSubscriber(email) {
        const query = `
            SELECT * FROM newsletter_subscribers 
            WHERE email = $1 AND status = 'active'
        `;
        
        const result = await this.pool.query(query, [email]);
        return result.rows[0] || null;
    }

    async markWelcomeEmailSent(email) {
        const query = `
            UPDATE newsletter_subscribers 
            SET welcome_email_sent = TRUE, last_email_sent = CURRENT_TIMESTAMP
            WHERE email = $1
        `;
        
        await this.pool.query(query, [email]);
    }

    // Discount code management
    async createDiscountCode(codeData) {
        const query = `
            INSERT INTO discount_codes (
                code, description, discount_type, discount_value, 
                minimum_order, maximum_discount, usage_limit, 
                valid_until, applicable_to
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        
        const result = await this.pool.query(query, [
            codeData.code,
            codeData.description,
            codeData.discount_type,
            codeData.discount_value,
            codeData.minimum_order || 0,
            codeData.maximum_discount,
            codeData.usage_limit,
            codeData.valid_until,
            codeData.applicable_to || 'downloadable'
        ]);
        
        return result.rows[0];
    }

    async getDiscountCode(code) {
        const query = `
            SELECT * FROM discount_codes 
            WHERE code = $1 AND is_active = TRUE 
            AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP)
        `;
        
        const result = await this.pool.query(query, [code]);
        return result.rows[0] || null;
    }

    async checkDiscountCodeUsage(code, userId = null, email = null, ipAddress = null) {
        const codeData = await this.getDiscountCode(code);
        if (!codeData) return { valid: false, reason: 'Invalid or expired code' };

        // Check usage limit
        if (codeData.usage_limit && codeData.used_count >= codeData.usage_limit) {
            return { valid: false, reason: 'Code usage limit reached' };
        }

        // Check if user has already used this code
        const usageQuery = `
            SELECT COUNT(*) as usage_count FROM discount_code_usage 
            WHERE code_id = $1 
            AND (user_id = $2 OR email = $3 OR ip_address = $4)
        `;
        
        const usageResult = await this.pool.query(usageQuery, [
            codeData.id, 
            userId, 
            email, 
            ipAddress
        ]);
        
        const usageCount = parseInt(usageResult.rows[0].usage_count);
        if (usageCount > 0) {
            return { valid: false, reason: 'Code already used by this user/IP' };
        }

        return { valid: true, code: codeData };
    }

    async recordDiscountCodeUsage(codeId, userId, email, ipAddress, orderId, discountAmount) {
        const query = `
            INSERT INTO discount_code_usage (
                code_id, user_id, email, ip_address, order_id, discount_amount
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        await this.pool.query(query, [codeId, userId, email, ipAddress, orderId, discountAmount]);
        
        // Update usage count
        await this.pool.query(`
            UPDATE discount_codes 
            SET used_count = used_count + 1 
            WHERE id = $1
        `, [codeId]);
    }

    // Close database connection
    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

module.exports = RailwayDatabase; 