// LyricArt Studio Server with Railway PostgreSQL Database
// Complete payment integration with persistent database storage

const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const RailwayDatabase = require('./railway-database');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Railway database
const db = new RailwayDatabase();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Session configuration with Railway PostgreSQL
app.use(session({
    store: db.getSessionStore(),
    secret: process.env.SESSION_SECRET || 'lyricart-railway-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    },
    name: 'lyricart-session'
}));

// Cache control for API routes
app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Serve static files
app.use(express.static(__dirname));

// Basic routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/homepage.html'));
});

app.get('/browse', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/browse_gallery.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/checkout.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/register.html'));
});

// Authentication API routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const user = await db.createUser({ email, password, name });
        
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userName = user.name;
        
        res.json({ 
            success: true, 
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt:', req.body);
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await db.authenticateUser(email, password);
        
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userName = user.name;
        
        console.log('✅ User authenticated:', user.email);
        
        res.json({ 
            success: true, 
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: error.message });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

app.get('/api/auth/status', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            loggedIn: true, 
            user: { 
                id: req.session.userId, 
                email: req.session.userEmail,
                name: req.session.userName
            } 
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// Cart API routes
app.post('/api/cart/add', async (req, res) => {
    try {
        console.log('🛒 Cart add request:', req.body);
        const { designId, format, price } = req.body;
        
        if (!req.session.id) {
            return res.status(401).json({ error: 'Session required' });
        }
        
        if (!designId) {
            return res.status(400).json({ error: 'Design ID required' });
        }

        const cart = await db.addToCart(req.session.id, designId, format, price);
        console.log('✅ Item added to cart:', cart);
        
        res.json({ success: true, cart });
    } catch (error) {
        console.error('❌ Cart add error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/cart', async (req, res) => {
    try {
        console.log('🛒 Cart get request');
        
        if (!req.session.id) {
            return res.status(401).json({ error: 'Session required' });
        }
        
        const cart = await db.getCart(req.session.id);
        console.log('✅ Cart data:', cart);
        
        res.json({ cart });
    } catch (error) {
        console.error('❌ Cart get error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/cart/remove', async (req, res) => {
    try {
        const { designId, format } = req.body;
        
        if (!req.session.id) {
            return res.status(401).json({ error: 'Session required' });
        }
        
        const cart = await db.removeFromCart(req.session.id, designId, format);
        res.json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/cart/clear', async (req, res) => {
    try {
        if (!req.session.id) {
            return res.status(401).json({ error: 'Session required' });
        }
        
        await db.clearCart(req.session.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Payment API routes
app.post('/api/payment/create-order', async (req, res) => {
    try {
        if (!req.session.id) {
            return res.status(401).json({ error: 'Session required' });
        }
        
        const cart = await db.getCart(req.session.id);
        
        if (!cart.items || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Create PayPal order structure
        const paypalOrder = {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: cart.total.toFixed(2),
                    breakdown: {
                        item_total: {
                            currency_code: 'USD',
                            value: cart.total.toFixed(2)
                        }
                    }
                },
                items: cart.items.map(item => ({
                    name: `${item.design_id} - ${item.format}`,
                    unit_amount: {
                        currency_code: 'USD',
                        value: item.price.toFixed(2)
                    },
                    quantity: item.quantity.toString(),
                    category: 'DIGITAL_GOODS'
                })),
                description: 'LyricArt Studio Design Purchase',
                custom_id: `order_${Date.now()}`
            }],
            application_context: {
                return_url: `${process.env.BASE_URL || 'http://localhost:3001'}/payment/success`,
                cancel_url: `${process.env.BASE_URL || 'http://localhost:3001'}/payment/cancel`
            }
        };

        console.log('✅ PayPal order created:', paypalOrder);
        res.json({ success: true, paypalOrder });
    } catch (error) {
        console.error('❌ Payment order creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/payment/process', async (req, res) => {
    try {
        const { paymentId } = req.body;
        const cart = await db.getCart(req.session.id);
        const userId = req.session.userId;

        // Create order in database
        const order = await db.createOrder({
            userId: userId,
            items: cart.items,
            total: cart.total,
            paymentMethod: 'paypal',
            paymentId: paymentId
        });

        // Update order status to paid
        await db.updateOrderStatus(order.id, 'paid', paymentId);

        // Clear cart
        await db.clearCart(req.session.id);

        console.log('✅ Payment processed successfully');
        res.json({ 
            success: true, 
            order: order,
            message: 'Payment processed successfully'
        });
    } catch (error) {
        console.error('❌ Payment processing error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Order API routes
app.get('/api/orders', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const orders = await db.getUserOrders(userId);
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'LyricArt Studio Server with Railway Database is running'
    });
});

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database tables
        await db.initializeTables();
        
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 LyricArt Studio Server running on port ${PORT}`);
            console.log(`🗄️ Railway PostgreSQL database connected`);
            console.log(`🛒 Shopping cart system ready`);
            console.log(`💳 PayPal integration configured`);
            console.log(`🔐 User authentication active`);
            console.log(`🌐 Visit: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await db.close();
    process.exit(0);
});

startServer();

module.exports = app; 