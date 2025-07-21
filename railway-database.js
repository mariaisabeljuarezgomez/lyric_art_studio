// Railway PostgreSQL Database Configuration
// Handles database connection and session storage

const { Pool } = require('pg');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

class RailwayDatabase {
    constructor() {
        this.pool = null;
        this.init();
    }

    init() {
        // Railway provides DATABASE_URL environment variable
        const connectionString = process.env.DATABASE_URL || 
            'postgresql://postgres:password@localhost:5432/lyricart_studio';
        
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
                    id SERIAL PRIMARY KEY,
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
                    user_id INTEGER REFERENCES users(id),
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
                    user_id INTEGER REFERENCES users(id),
                    plan VARCHAR(100) NOT NULL,
                    status VARCHAR(50) DEFAULT 'active',
                    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    end_date TIMESTAMP,
                    payment_method VARCHAR(100),
                    payment_id VARCHAR(255),
                    auto_renew BOOLEAN DEFAULT TRUE
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
        
        const query = `
            INSERT INTO users (email, password, name)
            VALUES ($1, $2, $3)
            RETURNING id, email, name, created_at
        `;
        
        const result = await this.pool.query(query, [email, hashedPassword, name]);
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
        return this.hashPassword(password) === hashedPassword;
    }

    // Close database connection
    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

module.exports = RailwayDatabase; 