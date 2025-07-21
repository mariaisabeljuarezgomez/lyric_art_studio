// Enhanced Server for LyricArt Studio Website
// Integrates performance optimization, database, shopping cart, PayPal, and user authentication

const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session management
app.use(session({
    secret: process.env.SESSION_SECRET || 'lyricart-studio-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

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
app.use(imageProtection.rateLimit());

// Serve static files from the root directory (with protection)
app.use(express.static(__dirname));

// Serve JSON files with proper MIME type
app.get('*.json', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});

// Authentication middleware
const authenticateUser = async (req, res, next) => {
    try {
        const sessionId = req.session.id;
        const session = await dbManager.validateSession(sessionId);
        
        if (session) {
            const user = await dbManager.getUserById(session.userId);
            req.user = user;
        }
        
        next();
    } catch (error) {
        next();
    }
};

// Apply authentication to all routes
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

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/terms.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/privacy.html'));
});

app.get('/my-collection', (req, res) => {
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
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await dbManager.authenticateUser(email, password);
        const sessionId = await dbManager.createSession(user.id);
        
        req.session.userId = user.id;
        
        res.json({ 
            success: true, 
            user: { id: user.id, email: user.email, name: user.name },
            sessionId 
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    try {
        const sessionId = req.session.id;
        await dbManager.removeSession(sessionId);
        
        req.session.destroy();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
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