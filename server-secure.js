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