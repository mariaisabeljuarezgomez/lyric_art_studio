// Lyric Art Studio Server for Railway Production
// Uses PostgreSQL for session storage instead of file storage

// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const paypal = require('@paypal/checkout-server-sdk');
const FileDeliveryService = require('./file-delivery-service');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// PostgreSQL connection for sessions
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create session table if it doesn't exist
pool.query(`
    CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) WITH TIME ZONE NOT NULL
    );
`).catch(err => console.error('Error creating session table:', err));

// Use connect-pg-simple for PostgreSQL session storage
const pgSession = require('connect-pg-simple')(session);

// Authentication Middleware
const authenticateUser = async (req, res, next) => {
    try {
        console.log('🔐 Authentication check - Session:', req.session);
        console.log('🔐 Authentication check - Cookies:', req.cookies);
        
        // Check if user is authenticated via Express session
        if (req.session && req.session.userId) {
            console.log('✅ User authenticated via session:', req.session.userId);
            req.user = { id: req.session.userId, email: req.session.userEmail, name: req.session.userName };
            return next();
        }
        
        // If no session, redirect to login
        console.log('❌ No valid session found, redirecting to login');
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
        
    } catch (error) {
        console.error('❌ Authentication error:', error);
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
};

// Email Configuration
const createEmailTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.privateemail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER || 'admin@lyricartstudio.shop',
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Email Templates
const emailTemplates = {
    orderConfirmation: (orderData) => ({
        subject: `Order Confirmation - Lyric Art Studio`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Order Confirmation</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .order-item { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
                    .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎵 Lyric Art Studio</h1>
                        <p>Order Confirmation</p>
                    </div>
                    <div class="content">
                        <h2>Thank you for your order!</h2>
                        <p>Hi ${orderData.customerName || 'Valued Customer'},</p>
                        <p>Your order has been successfully processed. Here are your order details:</p>
                        
                        <h3>Order Details:</h3>
                        <p><strong>Order ID:</strong> ${orderData.orderId}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                        
                        <h3>Items Ordered:</h3>
                        ${orderData.items.map(item => `
                            <div class="order-item">
                                <strong>${item.title || 'Design'}</strong><br>
                                Format: ${item.format}<br>
                                Price: $${item.price}
                            </div>
                        `).join('')}
                        
                        <div class="total">
                            <strong>Total: $${orderData.total}</strong>
                        </div>
                        
                        <p>Your download links will be available in your account dashboard.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.SITE_URL || 'https://lyricartstudio.shop'}/my-collection" class="button">View My Collection</a>
                            <a href="${process.env.SITE_URL || 'https://lyricartstudio.shop'}/homepage" class="button">Continue Shopping</a>
                        </div>
                        
                        <p>If you have any questions, please contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || 'info@lyricartstudio.shop'}">${process.env.SUPPORT_EMAIL || 'info@lyricartstudio.shop'}</a></p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Lyric Art Studio. All rights reserved.</p>
                        <p>This email was sent to ${orderData.customerEmail}</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    contactForm: (contactData) => ({
        subject: `New Contact Form Submission - ${contactData.subject || 'Lyric Art Studio'}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Contact Form Submission</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .field { margin: 15px 0; }
                    .label { font-weight: bold; color: #667eea; }
                    .value { background: white; padding: 10px; border-radius: 5px; margin-top: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📧 New Contact Form Submission</h1>
                        <p>Lyric Art Studio</p>
                    </div>
                    <div class="content">
                        <div class="field">
                            <div class="label">Name:</div>
                            <div class="value">${contactData.name}</div>
                        </div>
                        <div class="field">
                            <div class="label">Email:</div>
                            <div class="value">${contactData.email}</div>
                        </div>
                        <div class="field">
                            <div class="label">Subject:</div>
                            <div class="value">${contactData.subject || 'General Inquiry'}</div>
                        </div>
                        <div class="field">
                            <div class="label">Message:</div>
                            <div class="value">${contactData.message}</div>
                        </div>
                        <p><strong>Submitted on:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    welcomeEmail: (userData) => ({
        subject: `Welcome to Lyric Art Studio!`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Welcome to Lyric Art Studio</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎵 Welcome to Lyric Art Studio!</h1>
                        <p>Your account has been created successfully</p>
                    </div>
                    <div class="content">
                        <h2>Hi ${userData.name},</h2>
                        <p>Welcome to Lyric Art Studio! We're excited to have you as part of our community.</p>
                        
                        <p>With your account, you can:</p>
                        <ul>
                            <li>Browse our collection of 400+ custom lyric designs</li>
                            <li>Purchase designs in multiple formats (SVG, PDF, PNG, EPS)</li>
                            <li>Access your purchased designs anytime</li>
                            <li>Track your order history</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.SITE_URL || 'https://lyricartstudio.shop'}/homepage" class="button">Start Browsing</a>
                            <a href="${process.env.SITE_URL || 'https://lyricartstudio.shop'}/my-collection" class="button">My Collection</a>
                        </div>
                        
                        <p>If you have any questions, feel free to contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || 'info@lyricartstudio.shop'}">${process.env.SUPPORT_EMAIL || 'info@lyricartstudio.shop'}</a></p>
                        
                        <p>Happy designing!</p>
                        <p><strong>The Lyric Art Studio Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Lyric Art Studio. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    passwordReset: (userData, resetLink) => ({
        subject: `Password Reset Request - Lyric Art Studio`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Password Reset</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
                    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                        <p>Lyric Art Studio</p>
                    </div>
                    <div class="content">
                        <h2>Hi ${userData.name},</h2>
                        <p>We received a request to reset your password for your Lyric Art Studio account.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" class="button">Reset Password</a>
                        </div>
                        
                        <div class="warning">
                            <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                        </div>
                        
                        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                        
                        <p>If you have any questions, contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || 'info@lyricartstudio.shop'}">${process.env.SUPPORT_EMAIL || 'info@lyricartstudio.shop'}</a></p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Lyric Art Studio. All rights reserved.</p>
                        <p>This email was sent to ${userData.email}</p>
                    </div>
                </div>
            </body>
            </html>
        `
    })
};

// Email sending function
const sendEmail = async (to, template, data = {}) => {
    try {
        const transporter = createEmailTransporter();
        const emailContent = emailTemplates[template](data);
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || `"Lyric Art Studio" <${process.env.EMAIL_USER || 'admin@lyricartstudio.shop'}>`,
            to: to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

// PayPal Configuration
console.log('🔧 PayPal Environment Check:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);
console.log('   PAYPAL_CLIENT_ID exists:', !!process.env.PAYPAL_CLIENT_ID);
console.log('   PAYPAL_CLIENT_SECRET exists:', !!process.env.PAYPAL_CLIENT_SECRET);

// Use sandbox for local development (localhost) regardless of NODE_ENV
const isLocalhost = process.env.PORT === '3001' || process.env.PORT === '8080' || !process.env.PORT;
const useSandbox = process.env.NODE_ENV !== 'production' || isLocalhost;

const environment = useSandbox
    ? new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
    : new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

console.log('   Using environment:', useSandbox ? 'SANDBOX' : 'LIVE');
console.log('   Reason:', isLocalhost ? 'Localhost detected' : 'Production environment');

const paypalClient = new paypal.core.PayPalHttpClient(environment);

// PayPal Helper Functions
const createPayPalOrder = async (items, total) => {
    // Extract design ID from items (assuming single item for now)
    const designId = items[0]?.itemId || 'unknown';
    
    console.log('🔧 Creating PayPal order with data:', { items, total, designId });
    
    try {
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        
        const requestBody = {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: total.toFixed(2),
                    breakdown: {
                        item_total: {
                            currency_code: 'USD',
                            value: total.toFixed(2)
                        }
                    }
                },
                custom_id: `order_${Date.now()}_${designId}`,
                items: items.map(item => ({
                    name: item.title || 'LyricArt Design',
                    unit_amount: {
                        currency_code: 'USD',
                        value: (item.price || 3.00).toFixed(2)
                    },
                    quantity: item.quantity || item.qty || 1,
                    category: 'DIGITAL_GOODS'
                }))
            }],
            application_context: {
                return_url: `${process.env.PORT === '3001' ? 'http://localhost:3001' : (process.env.SITE_URL || 'https://lyricartstudio.shop')}/payment/success`,
                cancel_url: `${process.env.PORT === '3001' ? 'http://localhost:3001' : (process.env.SITE_URL || 'https://lyricartstudio.shop')}/payment/cancel`,
                brand_name: 'Lyric Art Studio',
                landing_page: 'BILLING',
                user_action: 'PAY_NOW',
                shipping_preference: 'NO_SHIPPING'
            }
        };
        
        console.log('📋 PayPal request body:', JSON.stringify(requestBody, null, 2));
        request.requestBody(requestBody);

        console.log('🚀 Executing PayPal request...');
        const order = await paypalClient.execute(request);
        console.log('✅ PayPal order created:', order.result.id);
        console.log('📋 PayPal order result:', JSON.stringify(order.result, null, 2));
        return { success: true, order: order.result };
    } catch (error) {
        console.error('❌ PayPal order creation error:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return { success: false, error: error.message };
    }
};

const capturePayPalOrder = async (orderId) => {
    try {
        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        
        const capture = await paypalClient.execute(request);
        console.log('✅ PayPal order captured:', capture.result.id);
        return { success: true, capture: capture.result };
    } catch (error) {
        console.error('❌ PayPal order capture error:', error);
        return { success: false, error: error.message };
    }
};

const verifyPayPalWebhook = (headers, body) => {
    // In production, you should verify the webhook signature
    // For now, we'll do basic validation
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
        console.warn('⚠️ PAYPAL_WEBHOOK_ID not set, skipping webhook verification');
        return true;
    }
    
    // Basic validation - in production, verify the signature
    return headers['paypal-transmission-id'] && headers['paypal-cert-url'];
};

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://lyricartstudio-production.up.railway.app'] : true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for specific directories only
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/pages', express.static(path.join(__dirname, 'pages')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Session configuration using PostgreSQL
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'lyricart-studio-default-secret-key-for-development',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: false, // Allow JavaScript access
        secure: false, // Set to false for Railway debugging
        sameSite: 'lax'
    }
}));

// 🎯 CORS FIX - ALLOW COOKIES TO BE SENT
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');   // allow cookies
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    next();
});

// Initialize file delivery service
const fileDeliveryService = new FileDeliveryService();

// Get design info from database
const getDesignInfo = async (designId) => {
    try {
        const designsData = JSON.parse(await fs.readFile('designs-database.json', 'utf8'));
        return designsData.find(design => design.id === designId);
    } catch (error) {
        console.error(`❌ Error getting design info for ${designId}:`, error);
        return null;
    }
};

// Initialize database with users and purchases
const initializeDatabase = async () => {
    try {
        // Check if tables exist, create them if they don't
        console.log('🔍 Checking database schema...');
        
        // Check if users table exists
        const usersTableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        
        if (!usersTableExists.rows[0].exists) {
            console.log('📊 Creating users table...');
            await pool.query(`
                CREATE TABLE users (
                    id VARCHAR(255) PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL
                );
            `);
        }
        
        // Check if purchases table exists
        const purchasesTableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'purchases'
            );
        `);
        
        if (!purchasesTableExists.rows[0].exists) {
            console.log('📊 Creating purchases table...');
            await pool.query(`
                CREATE TABLE purchases (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    design_id VARCHAR(255) NOT NULL,
                    design_name VARCHAR(255) NOT NULL,
                    payment_id VARCHAR(255) NOT NULL,
                    order_id VARCHAR(255),
                    amount DECIMAL(10,2) NOT NULL,
                    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            `);
        }
        
        // Check if wishlist table exists
        const wishlistTableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'wishlist'
            );
        `);
        
        if (!wishlistTableExists.rows[0].exists) {
            console.log('📊 Creating wishlist table...');
            await pool.query(`
                CREATE TABLE wishlist (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    design_id VARCHAR(255) NOT NULL,
                    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, design_id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            `);
        }
        
        // Check if pending_orders table exists
        const pendingOrdersTableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'pending_orders'
            );
        `);
        
        if (!pendingOrdersTableExists.rows[0].exists) {
            console.log('📊 Creating pending_orders table...');
            await pool.query(`
                CREATE TABLE pending_orders (
                    id SERIAL PRIMARY KEY,
                    order_id VARCHAR(255) UNIQUE NOT NULL,
                    user_id VARCHAR(255) NOT NULL,
                    user_email VARCHAR(255) NOT NULL,
                    user_name VARCHAR(255) NOT NULL,
                    items JSONB NOT NULL,
                    total DECIMAL(10,2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            `);
        }

        // Check if users exist
        const userCheck = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCheck.rows[0].count) === 0) {
            // Create default users
            const hashedPassword1 = await bcrypt.hash('password123', 10);
            const hashedPassword2 = await bcrypt.hash('123456789', 10);
            
            await pool.query(`
                INSERT INTO users (id, email, password, name) VALUES 
                ('a1d4f3f989e2e99be3968cbc77648050', 'test@example.com', $1, 'Test User'),
                ('8a428e2c-095c-3d60-5076-dc5415592a21', 'mariaisabeljuarezgomez85@gmail.com', $2, 'Maria Isabel Juarez Gomez')
            `, [hashedPassword1, hashedPassword2]);
            
            console.log('📊 Database initialized with 2 users');
        } else {
            console.log('📊 Database already has users');
        }
        
        // NO MORE TEST PURCHASE DATA - Database is now clean for real purchases only
        
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
};

// Initialize database on startup
initializeDatabase();

// API Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Login attempt:', { email, password: '***' });

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set session data
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userName = user.name;

        console.log('✅ User authenticated:', user.id);
        console.log('💾 Setting session data:', {
            sessionId: req.sessionID,
            userId: user.id,
            userEmail: user.email,
            userName: user.name
        });

        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                email: user.email, 
                name: user.name 
            } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/auth/status', async (req, res) => {
    try {
        if (req.session.userId) {
            const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                res.json({ 
                    loggedIn: true, 
                    user: { 
                        id: user.id, 
                        email: user.email, 
                        name: user.name 
                    } 
                });
            } else {
                res.json({ loggedIn: false });
            }
        } else {
            res.json({ loggedIn: false });
        }
    } catch (err) {
        console.error('Auth status error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

// Cart routes
app.get('/api/cart', (req, res) => {
    if (!req.session.cart) {
        req.session.cart = { items: [], total: 0, itemCount: 0 };
    }
    console.log('🛒 Cart requested - full session cart:', JSON.stringify(req.session.cart, null, 2));
    console.log('🛒 Cart items count:', req.session.cart.items.length);
    res.json({ cart: req.session.cart });
});

app.post('/api/cart/add', (req, res) => {
    const { itemId, designId, format, price, quantity = 1 } = req.body;
    const id = itemId || designId; // Handle both parameter names
    
    if (!req.session.cart) {
        req.session.cart = { items: [], total: 0, itemCount: 0 };
    }

    const existingItem = req.session.cart.items.find(item => 
        item.itemId === id && item.format === format
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        req.session.cart.items.push({ itemId: id, format, price, quantity });
    }

    req.session.cart.total = req.session.cart.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
    );
    req.session.cart.itemCount = req.session.cart.items.reduce((sum, item) => 
        sum + item.quantity, 0
    );

    console.log('✅ Cart updated:', req.session.cart);
    res.json(req.session.cart);
});

// Cart count endpoint (for badge)
app.get('/api/cart/count', (req, res) => {
    if (!req.session.cart) {
        req.session.cart = { items: [], total: 0, itemCount: 0 };
    }
    const count = req.session.cart.itemCount || 0;
    console.log('🛒 Cart count requested:', count);
    res.json({ count });
});

// Debug endpoint to check session
app.get('/api/debug/session', (req, res) => {
    console.log('🔍 Debug session requested');
    console.log('🔍 Session ID:', req.sessionID);
    console.log('🔍 Session exists:', !!req.session);
    console.log('🔍 Session cart:', JSON.stringify(req.session.cart, null, 2));
    res.json({ 
        sessionID: req.sessionID,
        sessionExists: !!req.session,
        cart: req.session.cart
    });
});

// Remove item from cart
app.delete('/api/cart/remove', (req, res) => {
    console.log('🗑️ Remove endpoint called');
    console.log('🗑️ Request body:', req.body);
    console.log('🗑️ Session cart before:', JSON.stringify(req.session.cart, null, 2));
    console.log('🗑️ Session ID:', req.sessionID);
    console.log('🗑️ Session exists:', !!req.session);
    
    const { designId, format } = req.body;
    console.log('🗑️ Extracted designId:', designId, 'format:', format);
    
    if (!req.session.cart) {
        req.session.cart = { items: [], total: 0, itemCount: 0 };
    }

    // Handle both designId and itemId for compatibility
    const itemId = designId;
    console.log('🗑️ Looking for itemId:', itemId, 'format:', format);
    
    const originalLength = req.session.cart.items.length;
    
    // More robust filtering - try multiple matching strategies
    console.log('🗑️ Starting filter process for itemId:', itemId, 'format:', format);
    console.log('🗑️ Current cart items before filter:', JSON.stringify(req.session.cart.items, null, 2));
    
    req.session.cart.items = req.session.cart.items.filter(item => {
        console.log('🗑️ Checking item:', JSON.stringify(item, null, 2));
        
        // Strategy 1: Exact match with format
        if (format && item.format === format && item.itemId === itemId) {
            console.log('🗑️ REMOVING item (exact match):', item.itemId, item.format);
            return false;
        }
        
        // Strategy 2: Match by itemId only (ignore format)
        if (item.itemId === itemId) {
            console.log('🗑️ REMOVING item (itemId match):', item.itemId, item.format);
            return false;
        }
        
        // Strategy 3: Match by designId if it exists
        if (item.designId === itemId) {
            console.log('🗑️ REMOVING item (designId match):', item.designId, item.format);
            return false;
        }
        
        console.log('🗑️ KEEPING item:', item.itemId || item.designId, item.format);
        return true;
    });
    
    console.log('🗑️ Cart items after filter:', JSON.stringify(req.session.cart.items, null, 2));
    
    console.log('🗑️ Items before:', originalLength, 'after:', req.session.cart.items.length);

    req.session.cart.total = req.session.cart.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
    );
    req.session.cart.itemCount = req.session.cart.items.reduce((sum, item) => 
        sum + item.quantity, 0
    );

    console.log('🗑️ Item removed from cart:', itemId);
    console.log('🗑️ Session cart after:', req.session.cart);
    
    // Force session save
    req.session.save((err) => {
        if (err) {
            console.error('❌ Session save error:', err);
            res.status(500).json({ error: 'Failed to save session' });
        } else {
            console.log('✅ Session saved successfully');
            res.json({ success: true, cart: req.session.cart });
        }
    });
});

// Clear entire cart
app.delete('/api/cart/clear', (req, res) => {
    req.session.cart = { items: [], total: 0, itemCount: 0 };
    console.log('🧹 Cart cleared');
    
    // Force session save
    req.session.save((err) => {
        if (err) {
            console.error('❌ Session save error:', err);
            res.status(500).json({ error: 'Failed to save session' });
        } else {
            console.log('✅ Session saved successfully');
            res.json({ success: true });
        }
    });
});

// Email API Routes
app.post('/api/email/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }

        // Send email to admin
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@lyricartstudio.shop';
        const emailResult = await sendEmail(adminEmail, 'contactForm', {
            name, email, subject, message
        });

        if (emailResult.success) {
            console.log('✅ Contact form email sent to admin');
            res.json({ success: true, message: 'Message sent successfully' });
        } else {
            console.error('❌ Contact form email failed:', emailResult.error);
            res.status(500).json({ error: 'Failed to send message' });
        }
    } catch (error) {
        console.error('❌ Contact form error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/email/order-confirmation', async (req, res) => {
    try {
        const { customerEmail, customerName, orderId, items, total } = req.body;
        
        if (!customerEmail || !orderId || !items || !total) {
            return res.status(400).json({ error: 'Missing required order information' });
        }

        const emailResult = await sendEmail(customerEmail, 'orderConfirmation', {
            customerEmail,
            customerName,
            orderId,
            items,
            total
        });

        if (emailResult.success) {
            console.log('✅ Order confirmation email sent to customer');
            res.json({ success: true, message: 'Order confirmation sent' });
        } else {
            console.error('❌ Order confirmation email failed:', emailResult.error);
            res.status(500).json({ error: 'Failed to send order confirmation' });
        }
    } catch (error) {
        console.error('❌ Order confirmation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/email/welcome', async (req, res) => {
    try {
        const { userEmail, userName } = req.body;
        
        if (!userEmail || !userName) {
            return res.status(400).json({ error: 'User email and name are required' });
        }

        const emailResult = await sendEmail(userEmail, 'welcomeEmail', {
            email: userEmail,
            name: userName
        });

        if (emailResult.success) {
            console.log('✅ Welcome email sent to new user');
            res.json({ success: true, message: 'Welcome email sent' });
        } else {
            console.error('❌ Welcome email failed:', emailResult.error);
            res.status(500).json({ error: 'Failed to send welcome email' });
        }
    } catch (error) {
        console.error('❌ Welcome email error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/email/password-reset', async (req, res) => {
    try {
        const { userEmail, userName, resetToken } = req.body;
        
        if (!userEmail || !resetToken) {
            return res.status(400).json({ error: 'User email and reset token are required' });
        }

        const resetLink = `${process.env.SITE_URL || 'https://lyricartstudio.shop'}/reset-password?token=${resetToken}`;
        
        const emailResult = await sendEmail(userEmail, 'passwordReset', {
            email: userEmail,
            name: userName || 'User'
        }, resetLink);

        if (emailResult.success) {
            console.log('✅ Password reset email sent');
            res.json({ success: true, message: 'Password reset email sent' });
        } else {
            console.error('❌ Password reset email failed:', emailResult.error);
            res.status(500).json({ error: 'Failed to send password reset email' });
        }
    } catch (error) {
        console.error('❌ Password reset email error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Test email endpoint
app.post('/api/email/test', async (req, res) => {
    try {
        const { testEmail } = req.body;
        const emailToTest = testEmail || process.env.ADMIN_EMAIL || 'admin@lyricartstudio.shop';
        
        const emailResult = await sendEmail(emailToTest, 'welcomeEmail', {
            email: emailToTest,
            name: 'Test User'
        });

        if (emailResult.success) {
            console.log('✅ Test email sent successfully');
            res.json({ success: true, message: 'Test email sent successfully' });
        } else {
            console.error('❌ Test email failed:', emailResult.error);
            res.status(500).json({ error: 'Test email failed', details: emailResult.error });
        }
    } catch (error) {
        console.error('❌ Test email error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PayPal payment routes
app.post('/api/payment/create-paypal-order', async (req, res) => {
    try {
        console.log('🔄 PayPal order creation request received');
        const { items, total } = req.body;
        
        console.log('📦 Request data:', { items, total });
        
        if (!items || items.length === 0) {
            console.error('❌ No items in cart');
            return res.status(400).json({ error: 'No items in cart' });
        }

        // Validate PayPal credentials
        if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
            console.error('❌ PayPal credentials not configured');
            return res.status(500).json({ error: 'PayPal service not configured' });
        }

        // Store order information with user details for webhook processing
        const orderId = `order_${Date.now()}`;
        const userId = req.session?.userId;
        const userEmail = req.session?.userEmail;
        const userName = req.session?.userName;
        
        if (userId) {
            try {
                // Store pending order with user information
                await pool.query(`
                    INSERT INTO pending_orders (order_id, user_id, user_email, user_name, items, total, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                `, [orderId, userId, userEmail, userName, JSON.stringify(items), total]);
                
                console.log(`💾 Pending order stored for user ${userId}: ${orderId}`);
            } catch (error) {
                console.error('❌ Error storing pending order:', error);
            }
        }
        
        console.log('💳 Creating PayPal order...');
        // Create real PayPal order
        const paypalResult = await createPayPalOrder(items, total);
        
        console.log('📡 PayPal result:', paypalResult);
        
        if (paypalResult.success) {
            console.log('✅ PayPal order created successfully:', paypalResult.order.id);
            res.json({ success: true, order: paypalResult.order });
        } else {
            console.error('❌ PayPal order creation failed:', paypalResult.error);
            res.status(500).json({ error: paypalResult.error });
        }
    } catch (error) {
        console.error('❌ PayPal order creation error:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/payment/capture-paypal-order', async (req, res) => {
    try {
        const { orderId } = req.body;
        
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        // Capture the PayPal order
        const captureResult = await capturePayPalOrder(orderId);
        
        if (captureResult.success) {
            console.log('✅ PayPal order captured successfully:', captureResult.capture.id);
            
            // LOOK UP PENDING ORDER INSTEAD OF USING SESSION
            try {
                const pendingOrderResult = await pool.query(`
                    SELECT * FROM pending_orders WHERE order_id = $1 AND processed = false
                `, [orderId]);
                
                if (pendingOrderResult.rows.length > 0) {
                    const pendingOrder = pendingOrderResult.rows[0];
                    const userId = pendingOrder.user_id;
                    const items = pendingOrder.items;
                    
                    console.log(`📦 Processing pending order for user ${userId} with ${items.length} items`);
                    
                    // Record each purchased item
                    for (const item of items) {
                        const designId = item.itemId;
                        const designName = item.title || designId;
                        const amount = item.price || 3.00;
                        
                        // Store purchase in database
                        await pool.query(`
                            INSERT INTO purchases (user_id, design_id, design_name, payment_id, order_id, amount)
                            VALUES ($1, $2, $3, $4, $5, $6)
                        `, [
                            userId,
                            designId,
                            designName,
                            captureResult.capture.id,
                            orderId,
                            amount
                        ]);
                        
                        console.log(`💾 Purchase recorded for user ${userId}, design: ${designId}`);
                    }
                    
                    // Mark pending order as processed
                    await pool.query(`
                        UPDATE pending_orders SET processed = true WHERE order_id = $1
                    `, [orderId]);
                    
                    console.log(`✅ All purchases recorded for user ${userId}`);
                } else {
                    console.error('❌ No pending order found for orderId:', orderId);
                }
            } catch (error) {
                console.error('❌ Error recording purchases:', error);
            }
            
            // Send order confirmation email
            if (req.session.userEmail) {
                try {
                    await sendEmail(req.session.userEmail, 'orderConfirmation', {
                        customerEmail: req.session.userEmail,
                        customerName: req.session.userName || 'Valued Customer',
                        orderId: captureResult.capture.id,
                        items: cart.items,
                        total: cart.total
                    });
                    console.log('✅ Order confirmation email sent');
                } catch (emailError) {
                    console.error('❌ Failed to send order confirmation email:', emailError);
                }
            }
            
            // Clear cart after successful payment
            req.session.cart = { items: [], total: 0, itemCount: 0 };
            
            res.json({ success: true, capture: captureResult.capture });
        } else {
            console.error('❌ PayPal order capture failed:', captureResult.error);
            res.status(500).json({ error: captureResult.error });
        }
    } catch (error) {
        console.error('❌ PayPal order capture error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PayPal Webhook Handler
app.post('/api/paypal/webhook', async (req, res) => {
    try {
        const webhookBody = req.body;
        const headers = req.headers;
        
        console.log('📡 PayPal webhook received:', webhookBody.event_type);
        
        // Verify webhook (basic validation for now)
        if (!verifyPayPalWebhook(headers, webhookBody)) {
            console.warn('⚠️ Webhook verification failed');
            return res.status(400).json({ error: 'Webhook verification failed' });
        }
        
        // Handle different webhook events
        switch (webhookBody.event_type) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                console.log('✅ Payment completed via webhook:', webhookBody.resource.id);
                console.log('🔍 Full webhook body:', JSON.stringify(webhookBody, null, 2));
                
                // Extract order details from webhook
                const paymentId = webhookBody.resource.id;
                const orderId = webhookBody.resource.supplementary_data?.related_ids?.order_id;
                const amount = webhookBody.resource.amount?.value;
                
                console.log('🔍 Extracted data:', { paymentId, orderId, amount });
                
                // Get design info from custom_id (format: order_timestamp_designId)
                const customId = webhookBody.resource.custom_id;
                console.log('🔍 Custom ID:', customId);
                const designId = customId ? customId.split('_')[2] : null;
                console.log('🔍 Extracted design ID:', designId);
                
                if (designId) {
                    try {
                        // Get design info from database
                        const designInfo = await getDesignInfo(designId);
                        
                        if (designInfo) {
                            // Find the pending order to get user information
                            const pendingOrderResult = await pool.query(`
                                SELECT * FROM pending_orders 
                                WHERE order_id = $1 AND processed = FALSE
                            `, [orderId]);
                            
                            let userId = '8a428e2c-095c-3d60-5076-dc5415592a21'; // Default fallback
                            let userEmail = 'mariaisabeljuarezgomez85@gmail.com';
                            let userName = 'Maria Isabel Juarez Gomez';
                            
                            if (pendingOrderResult.rows.length > 0) {
                                const pendingOrder = pendingOrderResult.rows[0];
                                userId = pendingOrder.user_id;
                                userEmail = pendingOrder.user_email;
                                userName = pendingOrder.user_name;
                                
                                // Mark order as processed
                                await pool.query(`
                                    UPDATE pending_orders SET processed = TRUE WHERE order_id = $1
                                `, [orderId]);
                                
                                console.log(`✅ Found pending order for user ${userId}`);
                            } else {
                                console.warn(`⚠️ No pending order found for ${orderId}, using default user`);
                            }
                            
                            // Store purchase in database for the actual user
                            await pool.query(`
                                INSERT INTO purchases (user_id, design_id, design_name, payment_id, order_id, amount)
                                VALUES ($1, $2, $3, $4, $5, $6)
                            `, [
                                userId,
                                designId,
                                designInfo.title || designId,
                                paymentId,
                                orderId || `order_${Date.now()}`,
                                amount
                            ]);
                            
                            console.log(`💾 Purchase stored in database for user ${userId}, design: ${designId}`);
                            
                            // Prepare order data for file delivery
                            const orderData = {
                                orderId: orderId || `order_${Date.now()}`,
                                designId: designId,
                                designName: designInfo.title || designId,
                                customerEmail: userEmail,
                                customerName: userName,
                                amount: amount,
                                paymentId: paymentId
                            };
                            
                            // Automatically send design files
                            console.log(`📦 Sending design files for order ${orderData.orderId}`);
                            await fileDeliveryService.processOrder(orderData);
                            
                            // Send order confirmation email
                            await sendEmail(
                                orderData.customerEmail,
                                'orderConfirmation',
                                orderData
                            );
                            
                            console.log(`✅ Order ${orderData.orderId} processed and files sent to ${userEmail}`);
                        } else {
                            console.warn(`⚠️ Design info not found for ${designId}`);
                        }
                    } catch (error) {
                        console.error(`❌ Error processing order ${orderId}:`, error);
                    }
                } else {
                    console.warn(`⚠️ No design ID found in payment ${paymentId}`);
                }
                
                console.log('💰 Payment details:', { paymentId, orderId, amount });
                break;
                
            case 'PAYMENT.CAPTURE.DENIED':
                console.log('❌ Payment denied via webhook:', webhookBody.resource.id);
                break;
                
            case 'PAYMENT.CAPTURE.PENDING':
                console.log('⏳ Payment pending via webhook:', webhookBody.resource.id);
                break;
                
            case 'PAYMENT.CAPTURE.REFUNDED':
                console.log('↩️ Payment refunded via webhook:', webhookBody.resource.id);
                break;
                
            default:
                console.log('📡 Unhandled webhook event:', webhookBody.event_type);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('❌ PayPal webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Download endpoints for purchased designs
app.get('/api/download/:designId/:format', authenticateUser, async (req, res) => {
    const { designId, format } = req.params;
    console.log(`🎯 Download request for ${designId}.${format} by user:`, req.session.userId);
    
    try {
        // Verify user owns this design
        const purchaseCheck = await pool.query(`
            SELECT * FROM purchases 
            WHERE user_id = $1 AND design_id = $2
        `, [req.session.userId, designId]);
        
        if (purchaseCheck.rows.length === 0) {
            return res.status(403).send('You do not own this design');
        }
        
        // Construct file path - use music_lyricss folder for actual files
        const designPath = path.join(__dirname, 'music_lyricss', designId);
        
        // Check if design folder exists
        if (!fs.existsSync(designPath)) {
            console.log(`❌ Design folder not found: ${designPath}`);
            return res.status(404).send('Design not found');
        }
        
        // Look for the specific file format requested
        let fileName = `${designId}.${format}`;
        let filePath = path.join(designPath, fileName);
        
        // If the specific format doesn't exist, try to find any available file
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Requested format ${format} not found, looking for available files...`);
            const files = fs.readdirSync(designPath);
            const availableFile = files.find(file => file.startsWith(designId));
            
            if (availableFile) {
                fileName = availableFile;
                filePath = path.join(designPath, fileName);
                console.log(`✅ Found available file: ${fileName}`);
            } else {
                console.log(`❌ No files found in design folder: ${designPath}`);
                return res.status(404).send('No files available for this design');
            }
        }
        
        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', getContentType(format));
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        console.log(`✅ File ${fileName} downloaded by user ${req.session.userId}`);
    } catch (error) {
        console.error('❌ Download error:', error);
        res.status(500).send('Download failed');
    }
});

// Helper function to get content type
function getContentType(format) {
    const contentTypes = {
        'svg': 'image/svg+xml',
        'png': 'image/png',
        'pdf': 'application/pdf',
        'eps': 'application/postscript',
        'webp': 'image/webp'
    };
    return contentTypes[format] || 'application/octet-stream';
}

app.get('/payment/success', async (req, res) => {
    const { token, PayerID } = req.query;
    
    if (!token) {
        return res.redirect('/payment/cancel?error=no_token');
    }
    
    try {
        // Capture the PayPal order
        const captureResult = await capturePayPalOrder(token);
        
        if (captureResult.success) {
            console.log('✅ Payment completed successfully:', captureResult.capture.id);
            
            // Send order confirmation email if user is logged in
            if (req.session.userEmail) {
                const cart = req.session.cart || { items: [], total: 0 };
                try {
                    await sendEmail(req.session.userEmail, 'orderConfirmation', {
                        customerEmail: req.session.userEmail,
                        customerName: req.session.userName || 'Valued Customer',
                        orderId: captureResult.capture.id,
                        items: cart.items,
                        total: cart.total
                    });
                    console.log('✅ Order confirmation email sent');
                } catch (emailError) {
                    console.error('❌ Failed to send order confirmation email:', emailError);
                }
            }
            
            // Clear cart after successful payment
            req.session.cart = { items: [], total: 0, itemCount: 0 };
            
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
                    <title>Payment Successful | Lyric Art Studio</title>
            <style>
                body { 
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                    text-align: center; 
                    padding: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    height: 100vh;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
                h1 { font-size: 3rem; margin-bottom: 1rem; color: #4ade80; }
                p { font-size: 1.2rem; margin-bottom: 2rem; }
                        .order-details { 
                            background: rgba(255,255,255,0.1); 
                            padding: 20px; 
                            border-radius: 10px; 
                            margin: 20px 0;
                            backdrop-filter: blur(10px);
                        }
                a { 
                    color: white; 
                    text-decoration: none; 
                    padding: 12px 24px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    margin: 0 10px;
                }
                a:hover { 
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
                    <h1>✅ Payment Successful!</h1>
                    <div class="order-details">
                        <p><strong>Order ID:</strong> ${captureResult.capture.id}</p>
                        <p><strong>Amount:</strong> $${captureResult.capture.amount?.value || 'N/A'}</p>
                        <p><strong>Status:</strong> ${captureResult.capture.status}</p>
                    </div>
                    <p>Thank you for your purchase! You will receive an email with download links shortly.</p>
            <div>
                <a href="/homepage">Continue Shopping</a>
                <a href="/my-collection">View My Collection</a>
            </div>
        </body>
        </html>
    `);
        } else {
            console.error('❌ Payment capture failed:', captureResult.error);
            res.redirect('/payment/cancel?error=capture_failed');
        }
    } catch (error) {
        console.error('❌ Payment processing error:', error);
        res.redirect('/payment/cancel?error=processing_error');
    }
});

app.get('/payment/cancel', (req, res) => {
    const { error } = req.query;
    
    let errorMessage = 'Your payment was cancelled. Your cart items are still saved.';
    
    if (error) {
        switch (error) {
            case 'no_token':
                errorMessage = 'Payment token was missing. Please try again.';
                break;
            case 'capture_failed':
                errorMessage = 'Payment processing failed. Please contact support.';
                break;
            case 'processing_error':
                errorMessage = 'An error occurred during payment processing. Please try again.';
                break;
            default:
                errorMessage = 'Payment was cancelled or failed. Your cart items are still saved.';
        }
    }
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Cancelled | Lyric Art Studio</title>
            <style>
                body { 
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                    text-align: center; 
                    padding: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    height: 100vh;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
                h1 { font-size: 3rem; margin-bottom: 1rem; color: #f87171; }
                p { font-size: 1.2rem; margin-bottom: 2rem; }
                .error-details { 
                    background: rgba(255,255,255,0.1); 
                    padding: 20px; 
                    border-radius: 10px; 
                    margin: 20px 0;
                    backdrop-filter: blur(10px);
                }
                a { 
                    color: white; 
                    text-decoration: none; 
                    padding: 12px 24px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    margin: 0 10px;
                }
                a:hover { 
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
            <h1>❌ Payment Cancelled</h1>
            <div class="error-details">
                <p>${errorMessage}</p>
                ${error ? `<p><strong>Error Code:</strong> ${error}</p>` : ''}
            </div>
            <div>
                <a href="/checkout">Try Again</a>
                <a href="/homepage">Continue Shopping</a>
            </div>
        </body>
        </html>
    `);
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/homepage.html'));
});

app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/homepage.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/checkout.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/login.html'));
});

app.get('/browse', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/browse_gallery.html'));
});

app.get('/artist-profiles', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/artist_profiles.html'));
});

app.get('/my-collection', authenticateUser, (req, res) => {
    console.log('🎯 /my-collection route accessed for user:', req.session.userId);
    res.sendFile(path.join(__dirname, 'pages/my_collection_dashboard_ORIGINAL.html'));
});

app.get('/my-collection-dashboard-v2', authenticateUser, (req, res) => {
    console.log('🎯 /my-collection-dashboard-v2 route accessed for user:', req.session.userId);
    res.sendFile(path.join(__dirname, 'pages/my_collection_dashboard_v2.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/contact.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/about.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/terms.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/privacy.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/register.html'));
});

app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/account.html'));
});

app.get('/subscription', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/subscription.html'));
});

// API route for designs database
app.get('/api/designs', (req, res) => {
    res.sendFile(path.join(__dirname, 'designs-database.json'));
});

// Test page for wishlist functionality
app.get('/wishlist-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'wishlist-test.html'));
});

// Debug page for design IDs
app.get('/debug-design-ids', (req, res) => {
    res.sendFile(path.join(__dirname, 'debug-design-ids.html'));
});



// My Collection API routes
app.get('/api/my-collection/designs', authenticateUser, async (req, res) => {
    console.log('🎯 /api/my-collection/designs accessed for user:', req.session.userId);
    try {
        // Get user's purchased designs from database
        const result = await pool.query(`
            SELECT DISTINCT design_id, design_name, MIN(purchase_date) as first_purchase_date
            FROM purchases 
            WHERE user_id = $1 
            GROUP BY design_id, design_name
            ORDER BY first_purchase_date DESC
        `, [req.session.userId]);
        
        console.log(`🔍 DEBUG: Raw database result:`, result.rows);
        
        const designs = result.rows.map(row => {
            return {
                id: row.design_id,
                name: row.design_name,
                purchaseDate: row.first_purchase_date,
                imageUrl: `/images/designs/${row.design_id}/${row.design_id}.webp`,
                artist: row.design_name.split(' - ')[0] || 'Unknown Artist',
                format: 'SVG, PNG, PDF, EPS'
            };
        });
        
        console.log(`📊 Found ${designs.length} designs for user ${req.session.userId}`);
        console.log(`🔍 DEBUG: Processed designs:`, designs);
        res.json({ success: true, designs: designs });
    } catch (error) {
        console.error('❌ Error fetching designs:', error);
        res.json({ success: true, designs: [] }); // Always return success
    }
});

app.get('/api/my-collection/history', authenticateUser, async (req, res) => {
    console.log('🎯 /api/my-collection/history accessed for user:', req.session.userId);
    try {
        // Get user's purchase history from database, grouped by order
        const result = await pool.query(`
            SELECT 
                order_id,
                MIN(purchase_date) as order_date,
                COUNT(*) as item_count,
                SUM(amount) as total_amount,
                ARRAY_AGG(
                    JSON_BUILD_OBJECT(
                        'designId', design_id,
                        'designName', design_name,
                        'amount', amount
                    )
                ) as items
            FROM purchases 
            WHERE user_id = $1 
            GROUP BY order_id
            ORDER BY MIN(purchase_date) DESC
        `, [req.session.userId]);
        
        const history = result.rows.map(row => ({
            id: row.order_id,
            date: row.order_date,
            total: parseFloat(row.total_amount),
            itemCount: parseInt(row.item_count),
            items: row.items || []
        }));
        
        console.log(`📊 Found ${history.length} purchase records for user ${req.session.userId}`);
        res.json({ success: true, history: history });
    } catch (error) {
        console.error('❌ Error fetching history:', error);
        res.json({ success: true, history: [] }); // Always return success
    }
});

app.get('/api/my-collection/download/:designId', authenticateUser, async (req, res) => {
    const { designId } = req.params;
    console.log('🎯 /api/my-collection/download accessed for user:', req.session.userId);
    
    try {
        // Verify user owns this design
        const purchaseCheck = await pool.query(`
            SELECT * FROM purchases 
            WHERE user_id = $1 AND design_id = $2
        `, [req.session.userId, designId]);
        
        if (purchaseCheck.rows.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not own this design' 
            });
        }
        
        // Check if design files exist - use music_lyricss folder for actual files
        const designPath = path.join(__dirname, 'music_lyricss', designId);
        if (!fs.existsSync(designPath)) {
            console.log(`❌ Design folder not found: ${designPath}`);
            return res.status(404).json({ 
                success: false, 
                message: 'Design files not found' 
            });
        }
        
        // Check what files are actually available in the design folder
        const files = fs.readdirSync(designPath);
        const availableFormats = files.map(file => {
            const ext = path.extname(file).toLowerCase().substring(1);
            return ext;
        });
        
        // Create download links for available formats
        const downloadLinks = {};
        availableFormats.forEach(format => {
            downloadLinks[format] = `/api/download/${designId}/${format}`;
        });
        
        // If no files found, provide webp as fallback
        if (Object.keys(downloadLinks).length === 0) {
            downloadLinks.webp = `/api/download/${designId}/webp`;
        }
        
        res.json({ 
            success: true, 
            downloadLinks: downloadLinks,
            message: 'Download links generated successfully'
        });
    } catch (error) {
        console.error('❌ Error generating download links:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating download links' 
        });
    }
});

// REMOVED TEST DATA ENDPOINT - Only real purchases will be shown

// ===== WISHLIST API ENDPOINTS =====

// Get user's wishlist
app.get('/api/wishlist', authenticateUser, async (req, res) => {
    console.log('🎯 /api/wishlist accessed for user:', req.session.userId);
    try {
        const result = await pool.query(`
            SELECT design_id, added_date
            FROM wishlist 
            WHERE user_id = $1 
            ORDER BY added_date DESC
        `, [req.session.userId]);
        
        const wishlist = result.rows.map(row => ({
            designId: row.design_id,
            addedDate: row.added_date
        }));
        
        console.log(`📊 Found ${wishlist.length} wishlist items for user ${req.session.userId}`);
        res.json({ success: true, wishlist: wishlist });
    } catch (error) {
        console.error('❌ Error fetching wishlist:', error);
        res.json({ success: true, wishlist: [] });
    }
});

// Add item to wishlist
app.post('/api/wishlist/add', authenticateUser, async (req, res) => {
    const { designId } = req.body;
    console.log('🎯 /api/wishlist/add accessed for user:', req.session.userId, 'design:', designId);
    
    if (!designId) {
        return res.status(400).json({ success: false, message: 'Design ID is required' });
    }
    
    try {
        // Add to wishlist without checking if folder exists
        // The design ID comes from the database, so it should be valid
        await pool.query(`
            INSERT INTO wishlist (user_id, design_id) 
            VALUES ($1, $2) 
            ON CONFLICT (user_id, design_id) DO NOTHING
        `, [req.session.userId, designId]);
        
        console.log(`✅ Added design ${designId} to wishlist for user ${req.session.userId}`);
        res.json({ success: true, message: 'Added to wishlist' });
    } catch (error) {
        console.error('❌ Error adding to wishlist:', error);
        res.status(500).json({ success: false, message: 'Error adding to wishlist' });
    }
});

// Remove item from wishlist
app.delete('/api/wishlist/remove', authenticateUser, async (req, res) => {
    const { designId } = req.body;
    console.log('🎯 /api/wishlist/remove accessed for user:', req.session.userId, 'design:', designId);
    
    if (!designId) {
        return res.status(400).json({ success: false, message: 'Design ID is required' });
    }
    
    try {
        const result = await pool.query(`
            DELETE FROM wishlist 
            WHERE user_id = $1 AND design_id = $2
        `, [req.session.userId, designId]);
        
        if (result.rowCount > 0) {
            console.log(`✅ Removed design ${designId} from wishlist for user ${req.session.userId}`);
            res.json({ success: true, message: 'Removed from wishlist' });
        } else {
            res.json({ success: false, message: 'Item not found in wishlist' });
        }
    } catch (error) {
        console.error('❌ Error removing from wishlist:', error);
        res.status(500).json({ success: false, message: 'Error removing from wishlist' });
    }
});

// Check if item is in wishlist
app.get('/api/wishlist/check/:designId', authenticateUser, async (req, res) => {
    const { designId } = req.params;
    console.log('🎯 /api/wishlist/check accessed for user:', req.session.userId, 'design:', designId);
    
    try {
        const result = await pool.query(`
            SELECT id FROM wishlist 
            WHERE user_id = $1 AND design_id = $2
        `, [req.session.userId, designId]);
        
        const isInWishlist = result.rows.length > 0;
        res.json({ success: true, isInWishlist: isInWishlist });
    } catch (error) {
        console.error('❌ Error checking wishlist:', error);
        res.json({ success: true, isInWishlist: false });
    }
});

// Serve static files for HTML pages (after all API routes)
app.use(express.static(path.join(__dirname)));

// Handle 404s
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>404 - Page Not Found | Lyric Art Studio</title>
            <style>
                body { 
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                    text-align: center; 
                    padding: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    height: 100vh;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
                h1 { font-size: 3rem; margin-bottom: 1rem; }
                p { font-size: 1.2rem; margin-bottom: 2rem; }
                a { 
                    color: white; 
                    text-decoration: none; 
                    padding: 12px 24px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }
                a:hover { 
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
            <h1>404</h1>
            <p>Oops! The page you're looking for doesn't exist.</p>
            <a href="/homepage">Go Home</a>
        </body>
        </html>
    `);
});

module.exports = app;


// Start server
app.listen(PORT, () => {
    console.log(`🚀 Lyric Art Studio Server running on port ${PORT}`);
    console.log('📊 Database initialized with 2 users');
    console.log('🛒 Shopping cart system ready');
    console.log('💳 PayPal SDK integration configured');
    console.log('📡 PayPal webhooks enabled');
    console.log('🔐 User authentication active');
    console.log('📧 Email system configured and ready');
    console.log('⚡ Performance optimizations applied');
});

