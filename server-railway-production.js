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
const paypal = require('@paypal/paypal-server-sdk');
const FileDeliveryService = require('./file-delivery-service');
const fs = require('fs');

// Import fetch for Node.js v3 (ESM import)
import('node-fetch').then(module => {
    globalThis.fetch = module.default;
}).catch(err => console.error('Failed to import node-fetch:', err));

console.log('🚀 STARTUP: Creating Express app...');
const app = express();
const PORT = process.env.PORT || 8080;

console.log(`🚀 STARTUP: PORT configured as ${PORT}`);
console.log(`🚀 STARTUP: NODE_ENV = ${process.env.NODE_ENV}`);
console.log(`🚀 STARTUP: DATABASE_URL = ${process.env.DATABASE_URL ? 'SET' : 'MISSING'}`);

// Global error handlers for process stability
process.on('uncaughtException', (error) => {
    console.error('🚨 UNCAUGHT EXCEPTION:', error);
    console.error('Stack:', error.stack);
    // Log error but don't exit - let Railway restart if needed
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 UNHANDLED REJECTION at:', promise, 'reason:', reason);
    // Log error but don't exit - let Railway restart if needed
});

// Add memory usage monitoring
setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log('📊 Memory Usage:', {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    });
}, 300000); // Log every 5 minutes

// PostgreSQL connection for sessions
console.log('🚀 STARTUP: Creating PostgreSQL connection pool...');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

console.log('🚀 STARTUP: PostgreSQL pool created');

// Test database connection immediately
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ STARTUP: Database connection failed:', err);
    } else {
        console.log('✅ STARTUP: Database connection successful');
        release();
    }
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
        console.log('💳 Starting PayPal capture for orderId:', orderId);
        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        
        console.log('💳 Executing PayPal capture request...');
        const capture = await paypalClient.execute(request);
        console.log('✅ PayPal order captured successfully:', capture.result.id);
        console.log('✅ Capture result:', capture.result);
        return { success: true, capture: capture.result };
    } catch (error) {
        console.error('❌ PayPal order capture error:', error);
        console.error('❌ Error details:', error.message);
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

// Serve favicon
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content response for favicon
});

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// HEALTH CHECK FIRST - Before any middleware that depends on database
app.get('/api/health', (req, res) => {
    console.log('🏥 Health check requested');
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: 'Server is running'
    });
});

console.log('🚀 STARTUP: Health check endpoint registered BEFORE session middleware');

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
    let retries = 5;
    while (retries > 0) {
        try {
            console.log(`🔄 Database connection attempt ${6 - retries}`);
            await pool.query('SELECT 1');
            console.log('✅ Database connected');
            break;
        } catch (error) {
            console.error(`❌ Database connection failed, ${retries - 1} retries left`);
            retries -= 1;
            if (retries === 0) {
                console.error('❌ All database connection attempts failed');
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

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

        // Check if user_preferences table exists
        const userPreferencesTableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_preferences'
            );
        `);
        
        if (!userPreferencesTableExists.rows[0].exists) {
            console.log('📊 Creating user_preferences table...');
            await pool.query(`
                CREATE TABLE user_preferences (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) UNIQUE NOT NULL,
                    notification_new_releases BOOLEAN DEFAULT TRUE,
                    notification_artist_updates BOOLEAN DEFAULT TRUE,
                    notification_promotional_offers BOOLEAN DEFAULT FALSE,
                    notification_wishlist_alerts BOOLEAN DEFAULT TRUE,
                    download_format VARCHAR(50) DEFAULT 'svg',
                    auto_download_after_purchase BOOLEAN DEFAULT TRUE,
                    offline_storage_enabled BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

// Database will be initialized when server starts

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

app.post('/api/cart/add', async (req, res) => {
    const { itemId, designId, designName, format, price, quantity = 1 } = req.body;
    const id = itemId || designId; // Handle both parameter names
    
    if (!req.session.cart) {
        req.session.cart = { items: [], total: 0, itemCount: 0 };
    }

    // Use provided designName or look up from database if we have a designId
    let finalDesignName = designName || id;
    console.log(`🔍 Cart API - designId: "${designId}", designName: "${designName}", id: "${id}"`);
    
    if (designId && !designName) {
        try {
            // First try to convert folder name to proper design name
            if (typeof designId === 'string' && designId.includes('-')) {
                // This looks like a folder name, convert it to proper name
                console.log(`🔍 Attempting to convert folder name: "${designId}"`);
                finalDesignName = getDesignNameFromFolderName(designId);
                console.log(`🔍 Converted folder name "${designId}" to design name: "${finalDesignName}"`);
            } else {
                // This might be a numeric ID, try to find the design
                console.log(`🔍 Attempting to find design by numeric ID: "${designId}"`);
                const designsData = fs.readFileSync(path.join(__dirname, 'designs-database.json'), 'utf8');
                const designs = JSON.parse(designsData);
                const design = designs.designs.find(d => d.id.toString() === designId.toString());
                if (design) {
                    finalDesignName = `${design.artist} - ${design.song}`;
                    console.log(`🔍 Found design: ${finalDesignName} (ID: ${designId})`);
                }
            }
        } catch (error) {
            console.error('❌ Error looking up design:', error);
        }
    } else {
        console.log(`🔍 Using provided designName: "${finalDesignName}"`);
    }

    const existingItem = req.session.cart.items.find(item => 
        item.itemId === id && item.format === format
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        req.session.cart.items.push({ 
            itemId: id, 
            designId: designId || id,
            designName: finalDesignName,
            format, 
            price, 
            quantity 
        });
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
        
        console.log('🎯 Payment capture request received for orderId:', orderId);
        console.log('🔍 Request body:', req.body);
        console.log('🔍 Session data:', req.session);
        
        if (!orderId) {
            console.error('❌ No orderId provided in request');
            return res.status(400).json({ error: 'Order ID is required' });
        }

        // Capture the PayPal order
        console.log('💳 Attempting to capture PayPal order:', orderId);
        const captureResult = await capturePayPalOrder(orderId);
        
        if (captureResult.success) {
            console.log('✅ PayPal order captured successfully:', captureResult.capture.id);
            
            // LOOK UP PENDING ORDER INSTEAD OF USING SESSION
            try {
                console.log('🔍 Looking up pending order for orderId:', orderId);
                
                // First try to find by exact orderId match
                let pendingOrderResult = await pool.query(`
                    SELECT * FROM pending_orders WHERE order_id = $1 AND processed = false
                `, [orderId]);
                
                // If not found, try to find by PayPal order ID pattern (look for recent unprocessed orders)
                if (pendingOrderResult.rows.length === 0) {
                    console.log('🔍 No exact match found, looking for recent unprocessed orders...');
                    pendingOrderResult = await pool.query(`
                        SELECT * FROM pending_orders 
                        WHERE processed = false 
                        ORDER BY created_at DESC 
                        LIMIT 1
                    `);
                }
                
                console.log(`📊 Found ${pendingOrderResult.rows.length} pending orders for orderId: ${orderId}`);
                
                if (pendingOrderResult.rows.length > 0) {
                    const pendingOrder = pendingOrderResult.rows[0];
                    const userId = pendingOrder.user_id;
                    const items = pendingOrder.items;
                    
                    console.log(`📦 Processing pending order for user ${userId} with ${items.length} items`);
                    console.log(`📦 Pending order details:`, pendingOrder);
                    
                    // Record each purchased item
                    for (const item of items) {
                        const itemId = item.itemId;
                        const folderName = itemId; // Always use folder name for design_name
                        const amount = item.price || 3.00;
                        
                        // Look up the correct design ID from the designs database
                        let numericDesignId = itemId;
                        try {
                            // Use the same getNumericDesignId function for consistency
                            if (typeof itemId === 'string' && itemId.includes('-')) {
                                // This looks like a folder name, convert it to numeric ID
                                numericDesignId = await getNumericDesignId(itemId);
                                console.log(`🔍 Converted folder name "${itemId}" to numeric design ID: ${numericDesignId}`);
                            } else {
                                // This might already be a numeric ID
                                console.log(`🔍 Using itemId as designId (appears to be numeric): ${itemId}`);
                            }
                        } catch (error) {
                            console.error('❌ Error looking up design:', error);
                            console.log(`⚠️ Using itemId as designId: ${itemId}`);
                        }
                        
                        // Store purchase in database - ALWAYS use folder name for design_name
                        await pool.query(`
                            INSERT INTO purchases (user_id, design_id, design_name, payment_id, order_id, amount)
                            VALUES ($1, $2, $3, $4, $5, $6)
                        `, [
                            userId,
                            numericDesignId,  // Numeric ID for design_id
                            folderName,       // Folder name for design_name (THIS IS THE FIX!)
                            captureResult.capture.id,
                            pendingOrder.order_id, // Use the actual pending order ID
                            amount
                        ]);
                        
                        console.log(`💾 Purchase recorded for user ${userId}, design: ${designId} (original itemId: ${itemId})`);
                    }
                    
                    // Mark pending order as processed
                    await pool.query(`
                        UPDATE pending_orders SET processed = true WHERE order_id = $1
                    `, [pendingOrder.order_id]);
                    
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
                let originalDesignId = customId ? customId.split('_')[2] : null;
                console.log('🔍 Extracted design ID:', originalDesignId);
                
                // Preserve the original folder name and get numeric ID
                let folderName = originalDesignId;
                let numericDesignId = originalDesignId;
                
                if (originalDesignId && typeof originalDesignId === 'string' && originalDesignId.includes('-')) {
                    // This is a folder name, keep it for design_name and convert to numeric for design_id
                    folderName = originalDesignId;
                    numericDesignId = await getNumericDesignId(originalDesignId);
                    console.log(`🔍 Converted folder name "${folderName}" to numeric design ID: ${numericDesignId}`);
                } else {
                    // This might already be a numeric ID
                    numericDesignId = originalDesignId;
                    console.log(`🔍 Using originalDesignId as numeric ID: ${originalDesignId}`);
                }
                
                if (numericDesignId) {
                    try {
                        // Get design info from database
                        const designInfo = await getDesignInfo(numericDesignId);
                        
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
                            
                            // Store purchase in database for the actual user - ALWAYS use folder name for design_name
                            await pool.query(`
                                INSERT INTO purchases (user_id, design_id, design_name, payment_id, order_id, amount)
                                VALUES ($1, $2, $3, $4, $5, $6)
                            `, [
                                userId,
                                numericDesignId,  // Numeric ID for design_id
                                folderName,       // Folder name for design_name (THIS IS THE FIX!)
                                paymentId,
                                orderId || `order_${Date.now()}`,
                                amount
                            ]);
                            
                            console.log(`💾 Purchase stored in database for user ${userId}, design: ${numericDesignId} (folder: ${folderName})`);
                            
                            // Prepare order data for file delivery
                            const orderData = {
                                orderId: orderId || `order_${Date.now()}`,
                                designId: folderName,  // Use folder name for file delivery
                                designName: designInfo.title || folderName,
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
app.get('/api/download/:designId/:format', async (req, res) => {
    const { designId, format } = req.params;
    console.log(`🎯 Download request for ${designId}.${format} by user:`, req.session?.userId);
    console.log(`🔍 Session user ID:`, req.session?.userId);
    console.log(`🔍 Request headers:`, req.headers);
    
    // Check authentication
    if (!req.session || !req.session.userId) {
        console.log(`❌ No valid session for download request`);
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        // First, convert folder name to numeric design ID
        const numericDesignId = await getNumericDesignId(designId);
        console.log(`🔍 Converted folder name "${designId}" to numeric design ID: ${numericDesignId}`);
        
        // Also check what's in the purchases table for this user
        const allPurchases = await pool.query(`
            SELECT design_id, design_name FROM purchases 
            WHERE user_id = $1
        `, [req.session.userId]);
        console.log(`🔍 All purchases for user ${req.session.userId}:`, allPurchases.rows);
        
        // Verify user owns this design using the numeric ID
        // Note: design_id is stored as VARCHAR in database, so we need to convert for comparison
        const purchaseCheck = await pool.query(`
            SELECT * FROM purchases 
            WHERE user_id = $1 AND design_id = $2
        `, [req.session.userId, numericDesignId.toString()]);
        
        console.log(`🔍 Purchase check result:`, purchaseCheck.rows.length, 'purchases found');
        
        if (purchaseCheck.rows.length === 0) {
            console.log(`❌ User ${req.session.userId} does not own design ${numericDesignId} (folder: ${designId})`);
            return res.status(403).json({ error: 'You do not own this design' });
        }
        
        // Construct file path - use music_lyricss folder for actual files
        const designPath = path.join(__dirname, 'music_lyricss', designId);
        console.log(`🔍 Looking for files in:`, designPath);
        
        // Check if design folder exists
        if (!fs.existsSync(designPath)) {
            console.log(`❌ Design folder not found: ${designPath}`);
            return res.status(404).send('Design not found');
        }
        
        // Look for the specific file format requested
        let fileName = `${designId}.${format}`;
        let filePath = path.join(designPath, fileName);
        console.log(`🔍 Looking for file:`, filePath);
        
        // If the specific format doesn't exist, try to find any available file
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Requested format ${format} not found, looking for available files...`);
            const files = fs.readdirSync(designPath);
            console.log(`🔍 Available files:`, files);
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
        
        console.log(`✅ Serving file: ${filePath}`);
        
        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', getContentType(format));
        console.log(`📋 Content-Type:`, getContentType(format));
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        console.log(`✅ File ${fileName} downloaded by user ${req.session.userId}`);
    } catch (error) {
        console.error('❌ Download error:', error);
        res.status(500).json({ error: 'Download failed', message: error.message });
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
    
    console.log('🎯 Payment success route accessed with token:', token);
    
    if (!token) {
        return res.redirect('/payment/cancel?error=no_token');
    }
    
    try {
        // Call the payment capture endpoint to process the pending order
        console.log('💳 Calling payment capture endpoint...');
        
        const captureResponse = await fetch(`${req.protocol}://${req.get('host')}/api/payment/capture-paypal-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': req.headers.cookie || ''
            },
            body: JSON.stringify({ orderId: token })
        });
        
        console.log('📡 Capture endpoint response status:', captureResponse.status);
        
        if (captureResponse.ok) {
            const captureData = await captureResponse.json();
            console.log('📡 Capture endpoint response:', captureData);
            
            if (captureData.success) {
                console.log('✅ Payment and pending order processed successfully');
                
                // Send order confirmation email if user is logged in
                if (req.session.userEmail) {
                    const cart = req.session.cart || { items: [], total: 0 };
                    try {
                        await sendEmail(req.session.userEmail, 'orderConfirmation', {
                            customerEmail: req.session.userEmail,
                            customerName: req.session.userName || 'Valued Customer',
                            orderId: captureData.capture.id,
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
                        <p><strong>Order ID:</strong> ${captureData.capture.id}</p>
                        <p><strong>Amount:</strong> $${captureData.capture.amount?.value || 'N/A'}</p>
                        <p><strong>Status:</strong> ${captureData.capture.status}</p>
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
                console.error('❌ Payment capture failed:', captureData.error);
                res.redirect('/payment/cancel?error=capture_failed');
            }
        } else {
            console.error('❌ Payment capture endpoint failed:', captureResponse.status);
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

// Health check moved before session middleware to avoid database dependency issues

// Additional health endpoints
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ status: 'unhealthy', error: error.message });
    }
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
        
        const designs = [];
        for (const row of result.rows) {
            const folderName = await getDesignFolderName(row.design_id);
            // Get proper design name from designs database
            const properDesignName = getDesignNameFromFolderName(folderName);
            designs.push({
                id: folderName, // Use folder name as ID for consistency
                name: properDesignName, // Use proper design name
                purchaseDate: row.first_purchase_date,
                imageUrl: `/images/designs/${folderName}/${folderName}.webp`,
                artist: properDesignName.split(' - ')[0] || 'Unknown Artist',
                format: 'SVG, PNG, PDF, EPS'
            });
        }
        
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

// Get personalized recommendations based on user's purchase history
app.get('/api/my-collection/recommendations', authenticateUser, async (req, res) => {
    console.log('🎯 /api/my-collection/recommendations accessed for user:', req.session.userId);
    try {
        // Get user's purchased designs
        const userPurchases = await pool.query(`
            SELECT design_id, design_name FROM purchases 
            WHERE user_id = $1
        `, [req.session.userId]);
        
        let recommendations = [];
        
        if (userPurchases.rows.length > 0) {
            // Get the first purchased design to base recommendations on
            const purchasedDesign = userPurchases.rows[0];
            
            // Find similar designs based on genre and category
            const similarDesigns = await pool.query(`
                SELECT d.*, 
                       CASE 
                           WHEN d.genre = (SELECT genre FROM designs WHERE design_id = $1) THEN 3
                           WHEN d.category = (SELECT category FROM designs WHERE design_id = $1) THEN 2
                           ELSE 1
                       END as match_score
                FROM designs d
                WHERE d.design_id != $1 
                AND d.design_id NOT IN (
                    SELECT design_id FROM purchases WHERE user_id = $2
                )
                ORDER BY match_score DESC, d.rating DESC, d.review_count DESC
                LIMIT 8
            `, [purchasedDesign.design_id, req.session.userId]);
            
            recommendations = similarDesigns.rows.map(design => {
                // Convert numeric design_id to folder name
                const folderName = getDesignFolderNameFromId(design.design_id);
                return {
                    id: folderName, // Use folder name instead of numeric ID
                    name: design.name,
                    artist: design.artist,
                    genre: design.genre,
                    category: design.category,
                    price: parseFloat(design.price),
                    rating: parseFloat(design.rating),
                    reviewCount: parseInt(design.review_count),
                    imageUrl: design.image_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400&auto=format&fit=crop`,
                    matchScore: parseInt(design.match_score),
                    matchPercentage: Math.min(95, 70 + (design.match_score * 10))
                };
            });
        } else {
            // If no purchases, show top-rated designs
            const topDesigns = await pool.query(`
                SELECT * FROM designs 
                ORDER BY rating DESC, review_count DESC
                LIMIT 6
            `);
            
            recommendations = topDesigns.rows.map(design => {
                // Convert numeric design_id to folder name
                const folderName = getDesignFolderNameFromId(design.design_id);
                return {
                    id: folderName, // Use folder name instead of numeric ID
                    name: design.name,
                    artist: design.artist,
                    genre: design.genre,
                    category: design.category,
                    price: parseFloat(design.price),
                    rating: parseFloat(design.rating),
                    reviewCount: parseInt(design.review_count),
                    imageUrl: design.image_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400&auto=format&fit=crop`,
                    matchScore: 1,
                    matchPercentage: 85
                };
            });
        }
        
        // Get trending designs (based on rating and review count)
        const trendingDesigns = await pool.query(`
            SELECT * FROM designs 
            WHERE design_id NOT IN (
                SELECT design_id FROM purchases WHERE user_id = $1
            )
            ORDER BY (rating * review_count) DESC
            LIMIT 4
        `, [req.session.userId]);
        
        const trending = trendingDesigns.rows.map(design => {
            // Convert numeric design_id to folder name
            const folderName = getDesignFolderNameFromId(design.design_id);
            return {
                id: folderName, // Use folder name instead of numeric ID
                name: design.name,
                artist: design.artist,
                genre: design.genre,
                category: design.category,
                price: parseFloat(design.price),
                rating: parseFloat(design.rating),
                reviewCount: parseInt(design.review_count),
                imageUrl: design.image_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400&auto=format&fit=crop`
            };
        });
        
        // Get new artist discoveries (artists not in user's purchases)
        const newArtists = await pool.query(`
            SELECT DISTINCT artist, genre, 
                   COUNT(*) as design_count,
                   AVG(rating) as avg_rating
            FROM designs 
            WHERE artist NOT IN (
                SELECT DISTINCT d.artist 
                FROM designs d 
                JOIN purchases p ON d.design_id = p.design_id 
                WHERE p.user_id = $1
            )
            GROUP BY artist, genre
            ORDER BY avg_rating DESC, design_count DESC
            LIMIT 3
        `, [req.session.userId]);
        
        const artistDiscoveries = newArtists.rows.map(artist => ({
            artist: artist.artist,
            genre: artist.genre,
            designCount: parseInt(artist.design_count),
            avgRating: parseFloat(artist.avg_rating)
        }));
        
        console.log(`📊 Generated ${recommendations.length} recommendations for user ${req.session.userId}`);
        res.json({ 
            success: true, 
            recommendations: recommendations,
            trending: trending,
            artistDiscoveries: artistDiscoveries
        });
    } catch (error) {
        console.error('❌ Error generating recommendations:', error);
        res.json({ 
            success: true, 
            recommendations: [],
            trending: [],
            artistDiscoveries: []
        });
    }
});

app.get('/api/my-collection/download/:designId', authenticateUser, async (req, res) => {
    const { designId } = req.params;
    console.log('🎯 /api/my-collection/download accessed for user:', req.session.userId);
    
    try {
        // Convert folder name to numeric design ID if needed
        let numericDesignId = designId;
        if (typeof designId === 'string' && designId.includes('-')) {
            // This looks like a folder name, convert it to numeric ID
            numericDesignId = await getNumericDesignId(designId);
            console.log(`🔍 Converted folder name "${designId}" to numeric design ID: ${numericDesignId}`);
        }
        
        // Verify user owns this design - check both design_name (folder) and design_id (numeric)
        const purchaseCheck = await pool.query(`
            SELECT * FROM purchases 
            WHERE user_id = $1 AND (design_name = $2 OR design_id = $3)
        `, [req.session.userId, designId, numericDesignId.toString()]);
        
        if (purchaseCheck.rows.length === 0) {
            console.log(`❌ User ${req.session.userId} does not own design ${numericDesignId} (folder: ${designId})`);
            console.log(`🔍 Checked both design_name='${designId}' and design_id='${numericDesignId}'`);
            return res.status(403).json({ 
                success: false, 
                message: 'You do not own this design' 
            });
        }
        
        console.log(`✅ User ${req.session.userId} owns design ${numericDesignId} (folder: ${designId})`);
        
        // Use the original folder name for file paths
        const folderName = designId;
        
        // Check if design files exist - use music_lyricss folder for actual files
        const designPath = path.join(__dirname, 'music_lyricss', folderName);
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
            downloadLinks[format] = `/api/download/${folderName}/${format}`;
        });
        
        // If no files found, provide webp as fallback
        if (Object.keys(downloadLinks).length === 0) {
            downloadLinks.webp = `/api/download/${folderName}/webp`;
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
        
        console.log('🔍 DEBUG: Raw wishlist data from database:', result.rows);
        
        const wishlist = result.rows.map(row => {
            const designId = row.design_id;
            let designName = designId;
            let artist = '';
            let shape = '';
            let imageUrl = '';
            
            // Check if designId is numeric or a folder name
            if (typeof designId === 'string' && designId.includes('-')) {
                // This is a folder name, convert to proper design name
                try {
                    designName = getDesignNameFromFolderName(designId);
                    artist = getDesignArtistFromFolderName(designId);
                    shape = getDesignShapeFromFolderName(designId);
                    imageUrl = `/images/designs/${designId}/${designId}.webp`;
                } catch (error) {
                    console.error('Error converting design name:', error);
                }
            } else {
                // This is a numeric ID, convert to folder name first, then to design name
                try {
                    const folderName = getDesignFolderNameFromId(designId);
                    if (folderName && folderName !== designId) {
                        designName = getDesignNameFromFolderName(folderName);
                        artist = getDesignArtistFromFolderName(folderName);
                        shape = getDesignShapeFromFolderName(folderName);
                        imageUrl = `/images/designs/${folderName}/${folderName}.webp`;
                    }
                } catch (error) {
                    console.error('Error converting numeric design ID:', error);
                }
            }
            
            return {
                designId: designId,
                designName: designName,
                artist: artist,
                shape: shape,
                imageUrl: imageUrl,
                addedDate: row.added_date
            };
        });
        
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

// ===== MY COLLECTION DELETE ENDPOINTS =====

// Delete individual design from user's collection
app.delete('/api/my-collection/delete-design', authenticateUser, async (req, res) => {
    const { designId } = req.body;
    console.log('🗑️ /api/my-collection/delete-design accessed for user:', req.session.userId, 'design:', designId);
    
    if (!designId) {
        return res.status(400).json({ success: false, message: 'Design ID is required' });
    }
    
    try {
        // Convert folder name to numeric design ID if needed
        let numericDesignId = designId;
        if (typeof designId === 'string' && designId.includes('-')) {
            numericDesignId = await getNumericDesignId(designId);
            console.log(`🔍 Converted folder name "${designId}" to numeric design ID: ${numericDesignId}`);
        }
        
        // Delete from purchases table
        const result = await pool.query(`
            DELETE FROM purchases 
            WHERE user_id = $1 AND design_id = $2
        `, [req.session.userId, numericDesignId.toString()]);
        
        if (result.rowCount > 0) {
            console.log(`✅ Deleted design ${designId} from collection for user ${req.session.userId}`);
            res.json({ success: true, message: 'Design deleted from collection' });
        } else {
            console.log(`❌ Design ${designId} not found in user's collection`);
            res.status(404).json({ success: false, message: 'Design not found in your collection' });
        }
    } catch (error) {
        console.error('❌ Error deleting design:', error);
        res.status(500).json({ success: false, message: 'Error deleting design from collection' });
    }
});

// Bulk delete designs from user's collection
app.delete('/api/my-collection/bulk-delete-designs', authenticateUser, async (req, res) => {
    const { designIds } = req.body;
    console.log('🗑️ /api/my-collection/bulk-delete-designs accessed for user:', req.session.userId, 'designs:', designIds);
    
    if (!designIds || !Array.isArray(designIds) || designIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Design IDs array is required' });
    }
    
    try {
        let deletedCount = 0;
        const results = [];
        
        for (const designId of designIds) {
            try {
                // Convert folder name to numeric design ID if needed
                let numericDesignId = designId;
                if (typeof designId === 'string' && designId.includes('-')) {
                    numericDesignId = await getNumericDesignId(designId);
                }
                
                // Delete from purchases table
                const result = await pool.query(`
                    DELETE FROM purchases 
                    WHERE user_id = $1 AND design_id = $2
                `, [req.session.userId, numericDesignId.toString()]);
                
                if (result.rowCount > 0) {
                    deletedCount++;
                    results.push({ designId: designId, success: true });
                    console.log(`✅ Deleted design ${designId} from collection`);
                } else {
                    results.push({ designId: designId, success: false, message: 'Not found' });
                    console.log(`❌ Design ${designId} not found in collection`);
                }
            } catch (error) {
                console.error(`❌ Error deleting design ${designId}:`, error);
                results.push({ designId: designId, success: false, message: 'Delete error' });
            }
        }
        
        console.log(`✅ Bulk delete completed: ${deletedCount}/${designIds.length} designs deleted for user ${req.session.userId}`);
        res.json({ 
            success: true, 
            message: `${deletedCount} design(s) deleted from collection`,
            deletedCount: deletedCount,
            totalRequested: designIds.length,
            results: results
        });
    } catch (error) {
        console.error('❌ Error in bulk delete designs:', error);
        res.status(500).json({ success: false, message: 'Error deleting designs from collection' });
    }
});

// Delete individual order from user's purchase history
app.delete('/api/my-collection/delete-order', authenticateUser, async (req, res) => {
    const { orderId } = req.body;
    console.log('🗑️ /api/my-collection/delete-order accessed for user:', req.session.userId, 'order:', orderId);
    
    if (!orderId) {
        return res.status(400).json({ success: false, message: 'Order ID is required' });
    }
    
    try {
        // Delete all purchases for this order
        const result = await pool.query(`
            DELETE FROM purchases 
            WHERE user_id = $1 AND order_id = $2
        `, [req.session.userId, orderId]);
        
        if (result.rowCount > 0) {
            console.log(`✅ Deleted order ${orderId} (${result.rowCount} items) from history for user ${req.session.userId}`);
            res.json({ 
                success: true, 
                message: `Order deleted from history (${result.rowCount} items removed)`,
                deletedItems: result.rowCount
            });
        } else {
            console.log(`❌ Order ${orderId} not found in user's history`);
            res.status(404).json({ success: false, message: 'Order not found in your purchase history' });
        }
    } catch (error) {
        console.error('❌ Error deleting order:', error);
        res.status(500).json({ success: false, message: 'Error deleting order from history' });
    }
});

// Bulk delete orders from user's purchase history
app.delete('/api/my-collection/bulk-delete-orders', authenticateUser, async (req, res) => {
    const { orderIds } = req.body;
    console.log('🗑️ /api/my-collection/bulk-delete-orders accessed for user:', req.session.userId, 'orders:', orderIds);
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Order IDs array is required' });
    }
    
    try {
        let deletedOrdersCount = 0;
        let totalDeletedItems = 0;
        const results = [];
        
        for (const orderId of orderIds) {
            try {
                // Delete all purchases for this order
                const result = await pool.query(`
                    DELETE FROM purchases 
                    WHERE user_id = $1 AND order_id = $2
                `, [req.session.userId, orderId]);
                
                if (result.rowCount > 0) {
                    deletedOrdersCount++;
                    totalDeletedItems += result.rowCount;
                    results.push({ orderId: orderId, success: true, deletedItems: result.rowCount });
                    console.log(`✅ Deleted order ${orderId} (${result.rowCount} items)`);
                } else {
                    results.push({ orderId: orderId, success: false, message: 'Not found' });
                    console.log(`❌ Order ${orderId} not found in history`);
                }
            } catch (error) {
                console.error(`❌ Error deleting order ${orderId}:`, error);
                results.push({ orderId: orderId, success: false, message: 'Delete error' });
            }
        }
        
        console.log(`✅ Bulk delete completed: ${deletedOrdersCount}/${orderIds.length} orders deleted (${totalDeletedItems} total items) for user ${req.session.userId}`);
        res.json({ 
            success: true, 
            message: `${deletedOrdersCount} order(s) deleted from history (${totalDeletedItems} items removed)`,
            deletedOrdersCount: deletedOrdersCount,
            totalDeletedItems: totalDeletedItems,
            totalRequested: orderIds.length,
            results: results
        });
    } catch (error) {
        console.error('❌ Error in bulk delete orders:', error);
        res.status(500).json({ success: false, message: 'Error deleting orders from history' });
    }
});

// Download order files (similar to design download but for specific order)
app.get('/api/my-collection/download-order/:orderId', authenticateUser, async (req, res) => {
    const { orderId } = req.params;
    console.log('📥 /api/my-collection/download-order accessed for user:', req.session.userId, 'order:', orderId);
    
    try {
        // Get all designs from this order for the user
        const orderResult = await pool.query(`
            SELECT design_id, design_name 
            FROM purchases 
            WHERE user_id = $1 AND order_id = $2
        `, [req.session.userId, orderId]);
        
        if (orderResult.rows.length === 0) {
            console.log(`❌ Order ${orderId} not found for user ${req.session.userId}`);
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found in your purchase history' 
            });
        }
        
        // Create download links for all designs in the order
        const downloadLinks = {};
        let totalFiles = 0;
        
        for (const row of orderResult.rows) {
            const designId = row.design_id;
            
            // Convert numeric design ID to folder name
            let folderName = designId;
            if (!designId.includes('-')) {
                folderName = await getDesignFolderName(designId);
            }
            
            // Check if design files exist
            const designPath = path.join(__dirname, 'music_lyricss', folderName);
            if (fs.existsSync(designPath)) {
                const files = fs.readdirSync(designPath);
                const availableFormats = files.map(file => {
                    return path.extname(file).toLowerCase().substring(1);
                });
                
                // Create download links for this design
                downloadLinks[folderName] = {};
                availableFormats.forEach(format => {
                    downloadLinks[folderName][format] = `/api/download/${folderName}/${format}`;
                    totalFiles++;
                });
                
                // If no files found, provide webp as fallback
                if (availableFormats.length === 0) {
                    downloadLinks[folderName].webp = `/api/download/${folderName}/webp`;
                    totalFiles++;
                }
            } else {
                // Fallback for missing design folder
                downloadLinks[folderName] = {
                    webp: `/api/download/${folderName}/webp`
                };
                totalFiles++;
            }
        }
        
        console.log(`✅ Generated download links for order ${orderId}: ${totalFiles} files across ${orderResult.rows.length} designs`);
        res.json({ 
            success: true, 
            downloadLinks: downloadLinks,
            orderInfo: {
                orderId: orderId,
                designCount: orderResult.rows.length,
                totalFiles: totalFiles
            },
            message: `Download links generated for ${orderResult.rows.length} designs`
        });
    } catch (error) {
        console.error('❌ Error generating order download links:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating download links for order' 
        });
    }
});

// User Preferences API Endpoints
// Get user preferences
app.get('/api/user-preferences', authenticateUser, async (req, res) => {
    const userId = req.session.userId;
    console.log('🎯 /api/user-preferences accessed for user:', userId);
    
    try {
        const result = await pool.query(`
            SELECT * FROM user_preferences 
            WHERE user_id = $1
        `, [userId]);
        
        if (result.rows.length === 0) {
            // Create default preferences for new user
            const defaultPrefs = await pool.query(`
                INSERT INTO user_preferences (
                    user_id, 
                    notification_new_releases,
                    notification_artist_updates,
                    notification_promotional_offers,
                    notification_wishlist_alerts,
                    download_format,
                    auto_download_after_purchase,
                    offline_storage_enabled
                ) VALUES ($1, true, true, false, true, 'svg', true, false)
                RETURNING *
            `, [userId]);
            
            console.log('✅ Created default preferences for user:', userId);
            res.json({ 
                success: true, 
                preferences: defaultPrefs.rows[0] 
            });
        } else {
            console.log('✅ Retrieved preferences for user:', userId);
            res.json({ 
                success: true, 
                preferences: result.rows[0] 
            });
        }
    } catch (error) {
        console.error('❌ Error retrieving user preferences:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error retrieving user preferences' 
        });
    }
});

// Update user preferences
app.put('/api/user-preferences', authenticateUser, async (req, res) => {
    const userId = req.session.userId;
    const { 
        notification_new_releases,
        notification_artist_updates,
        notification_promotional_offers,
        notification_wishlist_alerts,
        download_format,
        auto_download_after_purchase,
        offline_storage_enabled
    } = req.body;
    
    console.log('🎯 /api/user-preferences UPDATE accessed for user:', userId);
    
    try {
        // Check if preferences exist for user
        const existingResult = await pool.query(`
            SELECT id FROM user_preferences WHERE user_id = $1
        `, [userId]);
        
        let result;
        if (existingResult.rows.length === 0) {
            // Insert new preferences
            result = await pool.query(`
                INSERT INTO user_preferences (
                    user_id, 
                    notification_new_releases,
                    notification_artist_updates,
                    notification_promotional_offers,
                    notification_wishlist_alerts,
                    download_format,
                    auto_download_after_purchase,
                    offline_storage_enabled,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
                RETURNING *
            `, [userId, notification_new_releases, notification_artist_updates, 
                notification_promotional_offers, notification_wishlist_alerts,
                download_format, auto_download_after_purchase, offline_storage_enabled]);
        } else {
            // Update existing preferences
            result = await pool.query(`
                UPDATE user_preferences SET 
                    notification_new_releases = $2,
                    notification_artist_updates = $3,
                    notification_promotional_offers = $4,
                    notification_wishlist_alerts = $5,
                    download_format = $6,
                    auto_download_after_purchase = $7,
                    offline_storage_enabled = $8,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $1
                RETURNING *
            `, [userId, notification_new_releases, notification_artist_updates, 
                notification_promotional_offers, notification_wishlist_alerts,
                download_format, auto_download_after_purchase, offline_storage_enabled]);
        }
        
        console.log('✅ Updated preferences for user:', userId);
        res.json({ 
            success: true, 
            preferences: result.rows[0],
            message: 'Preferences updated successfully'
        });
    } catch (error) {
        console.error('❌ Error updating user preferences:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating user preferences' 
        });
    }
});

// Export user data
app.get('/api/export-user-data', authenticateUser, async (req, res) => {
    const userId = req.session.userId;
    console.log('📤 /api/export-user-data accessed for user:', userId);
    
    try {
        // Get user info
        const userResult = await pool.query(`
            SELECT id, email, name, created_at FROM users WHERE id = $1
        `, [userId]);
        
        if (userResult.rows.length === 0) {
            console.log('❌ User not found:', userId);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Get user purchases
        const purchasesResult = await pool.query(`
            SELECT design_id, design_name, payment_id, order_id, amount, purchase_date 
            FROM purchases WHERE user_id = $1 ORDER BY purchase_date DESC
        `, [userId]);
        
        // Get user wishlist
        const wishlistResult = await pool.query(`
            SELECT design_id, added_date FROM wishlist WHERE user_id = $1 ORDER BY added_date DESC
        `, [userId]);
        
        // Get user preferences (handle case where preferences don't exist yet)
        let preferencesResult;
        try {
            preferencesResult = await pool.query(`
                SELECT * FROM user_preferences WHERE user_id = $1
            `, [userId]);
        } catch (prefError) {
            console.log('⚠️ User preferences table might not exist or other error:', prefError.message);
            preferencesResult = { rows: [] };
        }
        
        const exportData = {
            user: userResult.rows[0],
            purchases: purchasesResult.rows || [],
            wishlist: wishlistResult.rows || [],
            preferences: preferencesResult.rows[0] || null,
            exported_at: new Date().toISOString(),
            export_summary: {
                total_purchases: purchasesResult.rows.length,
                total_wishlist_items: wishlistResult.rows.length,
                user_since: userResult.rows[0].created_at,
                preferences_configured: preferencesResult.rows.length > 0
            }
        };
        
        console.log('📤 Export data prepared:', {
            userId: userId,
            purchases: exportData.purchases.length,
            wishlist: exportData.wishlist.length,
            hasPreferences: !!exportData.preferences
        });
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="lyric-art-studio-data-${userId}.json"`);
        res.json(exportData);
        
        console.log('✅ Exported data for user:', userId);
    } catch (error) {
        console.error('❌ Error exporting user data:', error);
        console.error('❌ Error details:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Error exporting user data: ' + error.message 
        });
    }
});

// Delete user account
app.delete('/api/delete-account', authenticateUser, async (req, res) => {
    const userId = req.session.userId;
    const { confirmEmail } = req.body;
    
    console.log('🗑️ /api/delete-account accessed for user:', userId);
    
    try {
        // Get user email for confirmation
        const userResult = await pool.query(`
            SELECT email FROM users WHERE id = $1
        `, [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        const userEmail = userResult.rows[0].email;
        
        // Verify email confirmation
        if (confirmEmail !== userEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email confirmation does not match' 
            });
        }
        
        // Delete user data (foreign key constraints will cascade)
        await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
        
        // Destroy session
        req.session.destroy();
        
        console.log('✅ Account deleted for user:', userId);
        res.json({ 
            success: true, 
            message: 'Account deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Error deleting account:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting account' 
        });
    }
});

// ========== ADMIN ROUTES (MUST BE BEFORE STATIC MIDDLEWARE) ==========

// Configure multer for file uploads (MUST BE BEFORE ADMIN ROUTES)
const multer = require('multer');
const DesignUploadProcessor = require('./design-upload-processor');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
        files: 20 // Max 20 files per upload
    },
    fileFilter: (req, file, cb) => {
        // Allow SVG, PNG, PDF, EPS files
        const allowedTypes = ['image/svg+xml', 'image/png', 'application/pdf', 'application/postscript'];
        const allowedExtensions = ['.svg', '.png', '.pdf', '.eps'];
        
        const fileExt = path.extname(file.originalname).toLowerCase();
        const isValidType = allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt);
        
        if (isValidType) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.originalname}. Only SVG, PNG, PDF, and EPS files are allowed.`));
        }
    }
});

// Initialize design upload processor
const designUploadProcessor = new DesignUploadProcessor();

const authenticateAdmin = (req, res, next) => {
    // Simple admin check - you can enhance this with proper admin roles
    const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
    const validAdminKey = process.env.ADMIN_KEY || 'lyric-admin-2025'; // Set in environment variables
    
    if (adminKey === validAdminKey) {
        next();
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Admin access required. Please provide valid admin key.' 
        });
    }
};

// Debug route to check file paths
app.get('/debug', (req, res) => {
    const fs = require('fs');
    const filePath = path.join(__dirname, 'pages', 'admin-upload.html');
    
    res.json({
        cwd: process.cwd(),
        __dirname: __dirname,
        fileExists: fs.existsSync(filePath),
        filePath: filePath,
        pagesDir: path.join(__dirname, 'pages'),
        pagesDirExists: fs.existsSync(path.join(__dirname, 'pages'))
    });
});

// Simple test route (no middleware)
app.get('/admin-test', (req, res) => {
    console.log('🧪 Simple admin test route accessed!');
    res.send('Simple admin test works!');
});

// Test route
app.get('/admin/test', (req, res) => {
    console.log('🧪 Test route accessed!');
    res.send('Admin test route works!');
});

// Serve admin upload page (both routes)
app.get('/admin/upload', (req, res) => {
    console.log('🎯 Admin route accessed!');
    res.sendFile(path.join(__dirname, 'pages', 'admin-upload.html'));
});

app.get('/admin/upload.html', (req, res) => {
    console.log('🎯 Admin route (.html) accessed!');
    res.sendFile(path.join(__dirname, 'pages', 'admin-upload.html'));
});

// Handle design upload
app.post('/api/admin/upload-design', authenticateAdmin, upload.array('files', 20), async (req, res) => {
    console.log('🎯 Admin design upload initiated');
    
    try {
        // Validate request
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded. Please select a design folder with SVG, PNG, PDF, and EPS files.'
            });
        }

        // Extract file paths from request body
        const filePaths = req.body.filePaths;
        
        if (!filePaths || !Array.isArray(filePaths)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file structure. Please upload a complete folder.'
            });
        }

        console.log(`📁 Processing ${req.files.length} files from uploaded folder`);

        // Process the upload
        const result = await designUploadProcessor.processUpload(req.files, filePaths);
        
        console.log('✅ Design upload completed successfully:', result);
        
        res.json({
            success: true,
            designId: result.designId,
            designName: result.designName,
            folderName: result.folderName,
            filesCreated: result.filesCreated,
            message: 'Design successfully added and is now live for purchase!'
        });

    } catch (error) {
        console.error('❌ Design upload failed:', error);
        
        // Attempt cleanup if folder name is available
        if (error.folderName) {
            await designUploadProcessor.cleanup(error.folderName).catch(console.error);
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Upload processing failed. Please check your files and try again.'
        });
    }
});

console.log('🎯 Admin design upload system initialized');
console.log('📁 Upload endpoint: /api/admin/upload-design');
console.log('🔐 Admin page: /admin/upload (requires admin key)');

// ========== END ADMIN ROUTES ==========

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

// =================================

// Utility Functions for Design Processing
const getDesignNameFromFolderName = (folderName) => {
    try {
        // Load the designs database
        const designsData = JSON.parse(fs.readFileSync('designs-database.json', 'utf8'));
        
        // Find the design by folder name in the image path
        const design = designsData.designs.find(d => {
            if (d.image) {
                const pathParts = d.image.split('/');
                if (pathParts.length >= 3) {
                    return pathParts[2] === folderName;
                }
            }
            return false;
        });
        
        if (design) {
            const designName = `${design.artist} - ${design.song}`;
            console.log(`✅ Found design name "${designName}" for folder "${folderName}"`);
            return designName;
        }
        
        // Fallback: convert folder name to readable format
        console.log(`⚠️ No design name found for folder "${folderName}", converting to readable format`);
        return folderName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .replace(/\b(Guitar|Piano|Cassette)\b/g, '')
            .trim();
    } catch (error) {
        console.error('❌ Error getting design name from folder name:', error);
        // Fallback: convert folder name to readable format
        return folderName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .replace(/\b(Guitar|Piano|Cassette)\b/g, '')
            .trim();
    }
};

const getDesignArtistFromFolderName = (folderName) => {
    try {
        // Load the designs database
        const designsData = JSON.parse(fs.readFileSync('designs-database.json', 'utf8'));
        
        // Find the design by folder name in the image path
        const design = designsData.designs.find(d => {
            if (d.image) {
                const pathParts = d.image.split('/');
                if (pathParts.length >= 3) {
                    return pathParts[2] === folderName;
                }
            }
            return false;
        });
        
        if (design) {
            console.log(`✅ Found artist "${design.artist}" for folder "${folderName}"`);
            return design.artist;
        }
        
        // Fallback: extract artist name from folder name
        const parts = folderName.split('-');
        if (parts[0] === 'the' && parts[1]) {
            return `The ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)}`;
        }
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch (error) {
        console.error('❌ Error getting design artist from folder name:', error);
        // Fallback: extract artist name from folder name
        const parts = folderName.split('-');
        if (parts[0] === 'the' && parts[1]) {
            return `The ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)}`;
        }
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
};

const getDesignShapeFromFolderName = (folderName) => {
    try {
        // Load the designs database
        const designsData = JSON.parse(fs.readFileSync('designs-database.json', 'utf8'));
        
        // Find the design by folder name in the image path
        const design = designsData.designs.find(d => {
            if (d.image) {
                const pathParts = d.image.split('/');
                if (pathParts.length >= 3) {
                    return pathParts[2] === folderName;
                }
            }
            return false;
        });
        
        if (design) {
            // Extract shape from the design data if available
            if (design.image && design.image.includes('guitar')) return 'Guitar Shape';
            if (design.image && design.image.includes('piano')) return 'Piano Shape';
            if (design.image && design.image.includes('cassette')) return 'Cassette Shape';
        }
        
        // Fallback: determine shape from folder name
        if (folderName.includes('guitar')) return 'Guitar Shape';
        if (folderName.includes('piano')) return 'Piano Shape';
        if (folderName.includes('cassette')) return 'Cassette Shape';
        return 'Design';
    } catch (error) {
        console.error('❌ Error getting design shape from folder name:', error);
        // Fallback: determine shape from folder name
        if (folderName.includes('guitar')) return 'Guitar Shape';
        if (folderName.includes('piano')) return 'Piano Shape';
        if (folderName.includes('cassette')) return 'Cassette Shape';
        return 'Design';
    }
};

const getDesignFolderNameFromId = (designId) => {
    try {
        // Load the designs database
        const designsData = JSON.parse(fs.readFileSync('designs-database.json', 'utf8'));
        
        // Find the design by numeric ID
        const design = designsData.designs.find(d => d.id.toString() === designId.toString());
        
        if (design && design.image) {
            // Extract folder name from image path: "images/designs/folder-name/folder-name.webp"
            const pathParts = design.image.split('/');
            if (pathParts.length >= 3) {
                console.log(`✅ Found folder name "${pathParts[2]}" for design ID ${designId}`);
                return pathParts[2]; // Return the folder name
            }
        }
        
        // Fallback: return the design ID if no match found
        console.log(`⚠️ No folder name found for design ID ${designId}, using design ID as folder name`);
        return designId;
    } catch (error) {
        console.error('❌ Error getting design folder name from ID:', error);
        return designId; // Fallback to original ID
    }
};

const getNumericDesignId = async (folderName) => {
    try {
        // Load the designs database
        const designsData = JSON.parse(fs.readFileSync('designs-database.json', 'utf8'));
        
        // Find the design by folder name in the image path
        const design = designsData.designs.find(d => {
            if (d.image) {
                const pathParts = d.image.split('/');
                if (pathParts.length >= 3) {
                    return pathParts[2] === folderName;
                }
            }
            return false;
        });
        
        if (design) {
            console.log(`✅ Found design ID ${design.id} for folder "${folderName}"`);
            return design.id.toString();
        }
        
        // Fallback: return the folder name if no match found
        console.log(`⚠️ No design found for folder "${folderName}", using folder name as ID`);
        return folderName;
    } catch (error) {
        console.error('❌ Error getting numeric design ID:', error);
        return folderName; // Fallback to original folder name
    }
};

// Export app after all routes are defined
module.exports = app;

// Start the server if this file is run directly
if (require.main === module) {
    console.log('🚀 STARTUP: Starting server...');
    console.log(`🚀 STARTUP: Attempting to listen on port ${PORT}`);
    
    // Start server and initialize database in parallel
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ SUCCESS: Lyric Art Studio Server running on port ${PORT}`);
        console.log(`🌐 Health check available at: http://localhost:${PORT}/api/health`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🚀 STARTUP: Server is now accepting connections`);
        
        // Initialize database after server starts
        console.log('🚀 STARTUP: Initializing database...');
        initializeDatabase().then(() => {
            console.log('✅ SUCCESS: Database initialization completed');
        }).catch(err => {
            console.error('❌ Database initialization failed (but server is running):', err);
        });
    });
    
    server.on('error', (err) => {
        console.error('❌ SERVER ERROR:', err);
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use`);
        }
    });
    
    server.on('listening', () => {
        console.log(`✅ Server successfully bound to port ${PORT}`);
    });
}