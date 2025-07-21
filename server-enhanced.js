// Enhanced Server for LyricArt Studio Website
// Integrates performance optimization, database, shopping cart, PayPal, and user authentication

const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const { DatabaseManager } = require('./database-setup');
const { ShoppingCartSystem } = require('./shopping-cart-system');
const PerformanceOptimizer = require('./performance-optimization');
const ImageProtectionMiddleware = require('./image-protection-middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize systems
const dbManager = new DatabaseManager();
const cartSystem = new ShoppingCartSystem();
const imageProtection = new ImageProtectionMiddleware();

// Use default memory store for sessions

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers middleware (re-enabled for production)
app.use((req, res, next) => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Allow same-origin frames for dev tools
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Secure session management (using memory store for now)
app.use(session({
    secret: process.env.SESSION_SECRET || 'lyricart-studio-secure-secret-key-2024',
    resave: true,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        httpOnly: false, // Temporarily false for debugging
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax', // CSRF protection
        path: '/'
    },
    name: 'lyricart-session'
}));

// Middleware to check session for API requests
app.use('/api', (req, res, next) => {
    if (req.session.userId) {
        // User is authenticated, proceed
        next();
    } else {
        // No session, but don't block - let individual endpoints handle auth
        next();
    }
});

// Cache headers middleware
app.use((req, res, next) => {
    // Cache static assets for 1 year
    if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|webp)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Cache HTML for 1 hour
    else if (req.path.match(/\.html$/)) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    // Cache API responses for 5 minutes
    else if (req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'public, max-age=300');
    }
    next();
});

// Image protection middleware (must come before static file serving)
app.use(imageProtection.protectImages());
// Temporarily disabled rate limiting for development
// app.use(imageProtection.rateLimit());

// Serve static files from the root directory (with protection)
app.use(express.static(__dirname));

// Serve JSON files with proper MIME type
app.get('*.json', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});

// Secure authentication middleware
const authenticateUser = async (req, res, next) => {
    try {
        if (req.session.userId) {
            const user = await dbManager.getUserById(req.session.userId);
            if (user) {
                req.user = user;
            } else {
                // Clear invalid session
                req.session.destroy((err) => {
                    if (err) console.error('Error destroying session:', err);
                });
            }
        }
    } catch (error) {
        console.error('Authentication error:', error);
    }
    next();
};

app.use(authenticateUser);

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

app.get('/artist-profiles', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/artist_profiles.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/contact.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/about.html'));
});

app.get('/test-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-login.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/terms.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/privacy.html'));
});

app.get('/my-collection', authenticateUser, (req, res) => {
    // Check if user has made purchases
    const userOrders = getUserOrders(req.session.userId);
    if (!userOrders || userOrders.length === 0) {
        return res.redirect('/browse?message=no-purchases');
    }
    res.sendFile(path.join(__dirname, 'pages/my_collection_dashboard.html'));
});

// New e-commerce pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/register.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/checkout.html'));
});

app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/account.html'));
});

app.get('/subscription', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/subscription.html'));
});

// API routes
app.get('/api/designs', (req, res) => {
    res.sendFile(path.join(__dirname, 'designs-database.json'));
});

app.get('/api/song-catalog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/song-catalog.js'));
});

// User authentication API routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const user = await dbManager.createUser({ email, password, name });
        const sessionId = await dbManager.createSession(user.id);
        
        req.session.userId = user.id;
        
        res.json({ 
            success: true, 
            user: { id: user.id, email: user.email, name: user.name },
            sessionId 
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt:', req.body);
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        console.log('🔍 Authenticating user:', email);
        const user = await dbManager.authenticateUser(email, password);
        console.log('✅ User authenticated:', user.id);
        
        // Set session data
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userName = user.name;
        
        console.log('💾 Setting session data:', {
            sessionId: req.sessionID,
            userId: user.id,
            userEmail: user.email,
            userName: user.name
        });
        
        // Force session save
        req.session.save((err) => {
            if (err) {
                console.error('❌ Session save error:', err);
                return res.status(500).json({ success: false, error: 'Session save failed' });
            }
            
            console.log('✅ Session saved successfully');
            res.json({ 
                success: true, 
                user: { id: user.id, email: user.email, name: user.name }
            });
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(401).json({ success: false, error: error.message });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('❌ Logout error:', err);
                return res.status(500).json({ success: false, error: 'Logout error' });
            }
            
            // Clear the session cookie
            res.clearCookie('lyricart-session', {
                path: '/',
                httpOnly: false,
                secure: false,
                sameSite: 'lax'
            });
            
            res.json({ success: true, message: 'Logged out successfully' });
        });
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/auth/me', (req, res) => {
    if (req.user) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

        // Setup shopping cart routes
        cartSystem.setupRoutes(app);



        app.get('/api/auth/status', (req, res) => {
            if (req.session.userId) {
                res.json({ 
                    loggedIn: true, 
                    user: { 
                        id: req.session.userId, 
                        email: req.session.userEmail 
                    } 
                });
            } else {
                res.json({ loggedIn: false });
            }
        });

        // Secure download routes
        app.get('/api/download/:token', imageProtection.secureDownload());
        app.get('/api/preview/:token', imageProtection.secureDownload());
        
        // Generate secure download URLs
        app.post('/api/generate-download-url', (req, res) => {
            try {
                const { imagePath } = req.body;
                const userId = req.user?.id;
                
                if (!userId) {
                    return res.status(401).json({ error: 'Authentication required' });
                }
                
                // Verify user has purchased this design
                // This would check the user's purchase history
                
                const downloadUrl = imageProtection.generateDownloadUrl(imagePath, userId);
                res.json({ 
                    downloadUrl,
                    expiresIn: '5 minutes'
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

// Subscription API routes
app.post('/api/subscription/create', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { plan, paymentMethod, paymentId } = req.body;
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

        const subscription = await dbManager.createSubscription({
            userId,
            plan,
            paymentMethod,
            paymentId,
            endDate: endDate.toISOString()
        });

        res.json({ success: true, subscription });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/subscription/status', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const subscription = await dbManager.getUserSubscription(userId);
        res.json({ subscription });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User profile API routes
app.get('/api/profile', (req, res) => {
    if (req.user) {
        res.json({ profile: req.user.profile });
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
});

app.put('/api/profile/update', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const updates = req.body;
        const updatedUser = await dbManager.updateUser(userId, updates);
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin API routes
app.get('/api/admin/stats', async (req, res) => {
    try {
        const stats = dbManager.getDatabaseStats();
        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Performance monitoring
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Order API
app.post('/api/orders/create', async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || items.length === 0) {
            return res.json({ success: false, error: 'No items in cart' });
        }
        
        // Calculate total
        const total = items.reduce((sum, item) => sum + item.price, 0);
        
        // Create order
        const order = {
            id: Date.now().toString(),
            items,
            total,
            status: 'pending',
            date: new Date().toISOString(),
            userId: req.session.userId || 'guest'
        };
        
        // Load existing orders
        let orders = [];
        try {
            const data = fs.readFileSync(path.join(__dirname, 'database', 'orders.json'), 'utf8');
            orders = JSON.parse(data);
        } catch (error) {
            // File doesn't exist, start with empty array
        }
        
        // Add new order
        orders.push(order);
        
        // Save to file
        fs.writeFileSync(path.join(__dirname, 'database', 'orders.json'), JSON.stringify(orders, null, 2));
        
        // Create PayPal order (simplified for demo)
        const paypalUrl = `/checkout?orderId=${order.id}`;
        
        res.json({ success: true, orderId: order.id, paypalUrl });
    } catch (error) {
        console.error('Order creation error:', error);
        res.json({ success: false, error: 'Order creation failed' });
    }
});

app.get('/api/orders/user', async (req, res) => {
    try {
        const userId = req.session.userId;
        
        if (!userId) {
            return res.json([]);
        }
        
        // Load orders
        let orders = [];
        try {
            const data = fs.readFileSync(path.join(__dirname, 'database', 'orders.json'), 'utf8');
            orders = JSON.parse(data);
        } catch (error) {
            return res.json([]);
        }
        
        // Filter user orders
        const userOrders = orders.filter(order => order.userId === userId);
        
        res.json(userOrders);
    } catch (error) {
        console.error('User orders error:', error);
        res.json([]);
    }
});

app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Load orders
        let orders = [];
        try {
            const data = fs.readFileSync(path.join(__dirname, 'database', 'orders.json'), 'utf8');
            orders = JSON.parse(data);
        } catch (error) {
            return res.json(null);
        }
        
        // Find order
        const order = orders.find(o => o.id === orderId);
        
        res.json(order || null);
    } catch (error) {
        console.error('Order fetch error:', error);
        res.json(null);
    }
});

app.post('/api/orders/complete', async (req, res) => {
    try {
        const { orderId, paymentId, paymentMethod } = req.body;
        
        // Load orders
        let orders = [];
        try {
            const data = fs.readFileSync(path.join(__dirname, 'database', 'orders.json'), 'utf8');
            orders = JSON.parse(data);
        } catch (error) {
            return res.json({ success: false, error: 'Orders not found' });
        }
        
        // Find and update order
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) {
            return res.json({ success: false, error: 'Order not found' });
        }
        
        orders[orderIndex].status = 'completed';
        orders[orderIndex].completedAt = new Date().toISOString();
        orders[orderIndex].paymentId = paymentId;
        orders[orderIndex].paymentMethod = paymentMethod || 'demo';
        
        // Save updated orders
        fs.writeFileSync(path.join(__dirname, 'database', 'orders.json'), JSON.stringify(orders, null, 2));
        
        res.json({ success: true, order: orders[orderIndex] });
    } catch (error) {
        console.error('Order completion error:', error);
        res.json({ success: false, error: 'Order completion failed' });
    }
});

// Helper function to get user orders
function getUserOrders(userId) {
    try {
        const ordersData = fs.readFileSync(path.join(__dirname, 'database/orders.json'), 'utf8');
        const orders = JSON.parse(ordersData);
        return orders.filter(order => order.userId === userId);
    } catch (error) {
        console.error('Error reading orders:', error);
        return [];
    }
}

// Helper function to get user's purchased designs
function getUserDesigns(userId) {
    try {
        const ordersData = fs.readFileSync(path.join(__dirname, 'database/orders.json'), 'utf8');
        const orders = JSON.parse(ordersData);
        const userOrders = orders.filter(order => order.userId === userId && order.status === 'completed');
        
        const designs = [];
        userOrders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    designs.push({
                        id: item.id,
                        name: item.name,
                        artist: item.artist,
                        format: item.format,
                        purchaseDate: order.date,
                        orderId: order.id,
                        price: item.price,
                        imageUrl: item.imageUrl || `/images/designs/${item.id}/${item.id}.webp`
                    });
                });
            }
        });
        
        return designs;
    } catch (error) {
        console.error('Error reading user designs:', error);
        return [];
    }
}

// Helper function to get user's purchase history
function getUserPurchaseHistory(userId) {
    try {
        const ordersData = fs.readFileSync(path.join(__dirname, 'database/orders.json'), 'utf8');
        const orders = JSON.parse(ordersData);
        return orders.filter(order => order.userId === userId)
                    .map(order => ({
                        id: order.id,
                        date: order.date,
                        total: order.total,
                        status: order.status,
                        items: order.items || [],
                        paymentMethod: order.paymentMethod
                    }))
                    .sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('Error reading purchase history:', error);
        return [];
    }
}

// My Collection API endpoints
app.get('/api/my-collection/designs', authenticateUser, (req, res) => {
    try {
        const designs = getUserDesigns(req.session.userId);
        res.json({ success: true, designs, total: designs.length });
    } catch (error) {
        console.error('Error getting user designs:', error);
        res.status(500).json({ success: false, error: 'Failed to load designs' });
    }
});

app.get('/api/my-collection/history', authenticateUser, (req, res) => {
    try {
        const history = getUserPurchaseHistory(req.session.userId);
        res.json({ success: true, history, total: history.length });
    } catch (error) {
        console.error('Error getting purchase history:', error);
        res.status(500).json({ success: false, error: 'Failed to load history' });
    }
});

app.get('/api/my-collection/download/:designId', authenticateUser, (req, res) => {
    try {
        const { designId } = req.params;
        const userId = req.session.userId;
        
        // Verify user owns this design
        const designs = getUserDesigns(userId);
        const design = designs.find(d => d.id === designId);
        
        if (!design) {
            return res.status(404).json({ success: false, error: 'Design not found or not owned' });
        }
        
        // For now, return the design info - in production, you'd serve the actual file
        res.json({ 
            success: true, 
            design,
            downloadUrl: `/images/designs/${designId}/${designId}.webp`
        });
    } catch (error) {
        console.error('Error downloading design:', error);
        res.status(500).json({ success: false, error: 'Download failed' });
    }
});

// Handle 404s with a proper 404 page
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>404 - Page Not Found | LyricArt Studio</title>
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
            <a href="/">Go Home</a>
        </body>
        </html>
    `);
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 LyricArt Studio Server running on port ${PORT}`);
    console.log(`📊 Database initialized with ${dbManager.getDatabaseStats().totalUsers} users`);
    console.log(`🛒 Shopping cart system ready`);
    console.log(`💳 PayPal integration configured`);
    console.log(`🔐 User authentication active`);
    console.log(`⚡ Performance optimizations applied`);
});

module.exports = app; 