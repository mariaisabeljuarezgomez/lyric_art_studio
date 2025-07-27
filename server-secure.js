// Secure Server for LyricArt Studio
// Clean implementation with proper security and working cart

const express = require('express');
const path = require('path');
const cors = require('cors');
const { SecureCartSystem } = require('./secure-cart-implementation');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize secure cart system
const secureCart = new SecureCartSystem();

// Basic middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache-busting middleware for cart API
app.use('/api/cart', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Setup secure cart with session management
secureCart.setupSecureCart(app);

// Serve static files
app.use(express.static(__dirname));

// Basic routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'homepage.html'));
});

app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, 'homepage.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/checkout.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
    const validAdminKey = process.env.ADMIN_KEY || 'lyric-admin-2025';
    
    console.log('🔐 Admin authentication attempt:', {
        providedKey: adminKey,
        validKey: validAdminKey,
        headers: req.headers['x-admin-key'],
        query: req.query.adminKey,
        matches: adminKey === validAdminKey
    });
    
    if (adminKey === validAdminKey) {
        console.log('✅ Admin authentication successful');
        next();
    } else {
        console.log('❌ Admin authentication failed');
        res.status(401).json({ 
            success: false, 
            message: 'Admin access required. Please provide valid admin key.',
            debug: {
                providedKey: adminKey,
                validKey: validAdminKey,
                matches: adminKey === validAdminKey
            }
        });
    }
};

// Admin test route
app.get('/admin/test', (req, res) => {
    console.log('🧪 Test route accessed!');
    res.send('Admin test route works!');
});

// Admin authentication test endpoint
app.get('/api/admin/test-auth', authenticateAdmin, (req, res) => {
    console.log('🔐 Admin auth test successful!');
    res.json({ 
        success: true, 
        message: 'Admin authentication working correctly',
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint to check admin key (no authentication required)
app.get('/api/admin/debug-key', (req, res) => {
    const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
    const validAdminKey = process.env.ADMIN_KEY || 'lyric-admin-2025';
    
    res.json({
        providedKey: adminKey,
        validKey: validAdminKey,
        matches: adminKey === validAdminKey,
        headers: req.headers,
        query: req.query
    });
});

// Serve custom design requests admin page
app.get('/admin/custom-designs', (req, res) => {
    console.log('🎨 Custom design requests admin page accessed!');
    res.sendFile(path.join(__dirname, 'pages', 'admin-custom-designs.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Secure LyricArt Studio Server running on port ${PORT}`);
    console.log(`🔒 Secure cart system active`);
    console.log(`📱 Visit: http://localhost:${PORT}`);
});

module.exports = app; 