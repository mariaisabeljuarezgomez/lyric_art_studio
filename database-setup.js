// Database Setup for LyricArt Studio Website
// User authentication, orders, and e-commerce infrastructure

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DatabaseManager {
    constructor() {
        this.projectRoot = __dirname;
        this.dbPath = path.join(this.projectRoot, 'database');
        this.usersPath = path.join(this.dbPath, 'users.json');
        this.ordersPath = path.join(this.dbPath, 'orders.json');
        this.sessionsPath = path.join(this.dbPath, 'sessions.json');
        this.subscriptionsPath = path.join(this.dbPath, 'subscriptions.json');
        
        this.ensureDatabaseExists();
    }

    // Ensure database directory and files exist
    ensureDatabaseExists() {
        if (!fs.existsSync(this.dbPath)) {
            fs.mkdirSync(this.dbPath, { recursive: true });
        }

        // Initialize database files if they don't exist
        const files = [
            { path: this.usersPath, default: [] },
            { path: this.ordersPath, default: [] },
            { path: this.sessionsPath, default: [] },
            { path: this.subscriptionsPath, default: [] }
        ];

        files.forEach(file => {
            if (!fs.existsSync(file.path)) {
                fs.writeFileSync(file.path, JSON.stringify(file.default, null, 2));
            }
        });
    }

    // User Management
    async createUser(userData) {
        const users = this.loadData(this.usersPath);
        
        // Check if user already exists
        const existingUser = users.find(user => user.email === userData.email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const hashedPassword = this.hashPassword(userData.password);
        
        const newUser = {
            id: this.generateId(),
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            createdAt: new Date().toISOString(),
            verified: false,
            verificationToken: this.generateToken(),
            profile: {
                favorites: [],
                downloads: [],
                subscription: null
            }
        };

        users.push(newUser);
        this.saveData(this.usersPath, users);
        
        return { ...newUser, password: undefined };
    }

    async authenticateUser(email, password) {
        const users = this.loadData(this.usersPath);
        const user = users.find(u => u.email === email);
        
        if (!user || !this.verifyPassword(password, user.password)) {
            throw new Error('Invalid credentials');
        }

        return { ...user, password: undefined };
    }

    async getUserById(userId) {
        const users = this.loadData(this.usersPath);
        const user = users.find(u => u.id === userId);
        return user ? { ...user, password: undefined } : null;
    }

    async updateUser(userId, updates) {
        const users = this.loadData(this.usersPath);
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        users[userIndex] = { ...users[userIndex], ...updates };
        this.saveData(this.usersPath, users);
        
        return { ...users[userIndex], password: undefined };
    }

    // Session Management
    async createSession(userId) {
        const sessions = this.loadData(this.sessionsPath);
        const sessionId = this.generateToken();
        
        const session = {
            id: sessionId,
            userId: userId,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };

        sessions.push(session);
        this.saveData(this.sessionsPath, sessions);
        
        return sessionId;
    }

    async validateSession(sessionId) {
        const sessions = this.loadData(this.sessionsPath);
        const session = sessions.find(s => s.id === sessionId);
        
        if (!session) {
            return null;
        }

        // Check if session is expired
        if (new Date(session.expiresAt) < new Date()) {
            this.removeSession(sessionId);
            return null;
        }

        return session;
    }

    async removeSession(sessionId) {
        const sessions = this.loadData(this.sessionsPath);
        const filteredSessions = sessions.filter(s => s.id !== sessionId);
        this.saveData(this.sessionsPath, filteredSessions);
    }

    // Order Management
    async createOrder(orderData) {
        const orders = this.loadData(this.ordersPath);
        
        const order = {
            id: this.generateId(),
            userId: orderData.userId,
            items: orderData.items,
            total: orderData.total,
            status: 'pending',
            paymentMethod: orderData.paymentMethod,
            paymentId: orderData.paymentId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            shippingAddress: orderData.shippingAddress || null,
            downloadLinks: []
        };

        orders.push(order);
        this.saveData(this.ordersPath, orders);
        
        return order;
    }

    async updateOrderStatus(orderId, status) {
        const orders = this.loadData(this.ordersPath);
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            throw new Error('Order not found');
        }

        orders[orderIndex].status = status;
        orders[orderIndex].updatedAt = new Date().toISOString();
        this.saveData(this.ordersPath, orders);
        
        return orders[orderIndex];
    }

    async getUserOrders(userId) {
        const orders = this.loadData(this.ordersPath);
        return orders.filter(o => o.userId === userId);
    }

    // Subscription Management
    async createSubscription(subscriptionData) {
        const subscriptions = this.loadData(this.subscriptionsPath);
        
        const subscription = {
            id: this.generateId(),
            userId: subscriptionData.userId,
            plan: subscriptionData.plan,
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: subscriptionData.endDate,
            paymentMethod: subscriptionData.paymentMethod,
            paymentId: subscriptionData.paymentId,
            autoRenew: subscriptionData.autoRenew || true
        };

        subscriptions.push(subscription);
        this.saveData(this.subscriptionsPath, subscriptions);
        
        return subscription;
    }

    async getUserSubscription(userId) {
        const subscriptions = this.loadData(this.subscriptionsPath);
        return subscriptions.find(s => s.userId === userId && s.status === 'active');
    }

    // Utility Methods
    hashPassword(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }

    generateId() {
        return crypto.randomBytes(16).toString('hex');
    }

    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    loadData(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    saveData(filePath, data) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    // Database Statistics
    getDatabaseStats() {
        const users = this.loadData(this.usersPath);
        const orders = this.loadData(this.ordersPath);
        const subscriptions = this.loadData(this.subscriptionsPath);

        return {
            totalUsers: users.length,
            totalOrders: orders.length,
            totalSubscriptions: subscriptions.length,
            activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
            totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0)
        };
    }
}

// Create database schema documentation
function createDatabaseSchema() {
    const schema = {
        users: {
            id: "string (unique)",
            email: "string (unique)",
            password: "string (hashed)",
            name: "string",
            createdAt: "ISO date string",
            verified: "boolean",
            verificationToken: "string",
            profile: {
                favorites: "array of design IDs",
                downloads: "array of download records",
                subscription: "subscription ID or null"
            }
        },
        orders: {
            id: "string (unique)",
            userId: "string (references users.id)",
            items: "array of order items",
            total: "number",
            status: "string (pending, paid, fulfilled, cancelled)",
            paymentMethod: "string",
            paymentId: "string",
            createdAt: "ISO date string",
            updatedAt: "ISO date string",
            shippingAddress: "object or null",
            downloadLinks: "array of download URLs"
        },
        sessions: {
            id: "string (unique)",
            userId: "string (references users.id)",
            createdAt: "ISO date string",
            expiresAt: "ISO date string"
        },
        subscriptions: {
            id: "string (unique)",
            userId: "string (references users.id)",
            plan: "string (basic, premium, pro)",
            status: "string (active, cancelled, expired)",
            startDate: "ISO date string",
            endDate: "ISO date string",
            paymentMethod: "string",
            paymentId: "string",
            autoRenew: "boolean"
        }
    };

    return schema;
}

// Initialize database if run directly
if (require.main === module) {
    const dbManager = new DatabaseManager();
    console.log('✅ Database initialized successfully!');
    console.log('📊 Database Statistics:', dbManager.getDatabaseStats());
    console.log('📋 Database Schema:', createDatabaseSchema());
}

module.exports = { DatabaseManager, createDatabaseSchema }; 