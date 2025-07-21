// Secure Cart Implementation for LyricArt Studio
// This implementation maintains security while ensuring cart functionality works

const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
const fs = require('fs');

class SecureCartSystem {
    constructor() {
        this.carts = new Map(); // In-memory cart storage
        this.sessionsDir = path.join(__dirname, 'sessions');
        
        // Create sessions directory if it doesn't exist
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true });
        }
    }

    // Get cart for a session
    getCart(sessionId) {
        if (!this.carts.has(sessionId)) {
            this.carts.set(sessionId, {
                items: [],
                total: 0,
                itemCount: 0
            });
        }
        return this.carts.get(sessionId);
    }

    // Add item to cart
    addToCart(sessionId, designId, format, price = 3) {
        const cart = this.getCart(sessionId);
        const existingItem = cart.items.find(item => 
            item.designId === designId && item.format === format
        );

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.items.push({
                designId,
                format,
                price,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
        }

        this.updateCartTotals(cart);
        return cart;
    }

    // Remove item from cart
    removeFromCart(sessionId, designId, format) {
        const cart = this.getCart(sessionId);
        cart.items = cart.items.filter(item => 
            !(item.designId === designId && item.format === format)
        );
        this.updateCartTotals(cart);
        return cart;
    }

    // Update item quantity
    updateQuantity(sessionId, designId, format, quantity) {
        const cart = this.getCart(sessionId);
        const item = cart.items.find(item => 
            item.designId === designId && item.format === format
        );

        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(sessionId, designId, format);
            } else {
                item.quantity = quantity;
                this.updateCartTotals(cart);
            }
        }

        return cart;
    }

    // Clear cart
    clearCart(sessionId) {
        this.carts.delete(sessionId);
    }

    // Update cart totals
    updateCartTotals(cart) {
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Setup Express middleware and routes
    setupSecureCart(app) {
        // Secure session configuration
        app.use(session({
            store: new FileStore({
                path: this.sessionsDir,
                ttl: 24 * 60 * 60, // 24 hours
                reapInterval: 60 * 60, // Clean up expired sessions every hour
                secret: process.env.SESSION_SECRET || 'lyricart-studio-secure-secret-key-2024'
            }),
            secret: process.env.SESSION_SECRET || 'lyricart-studio-secure-secret-key-2024',
            resave: false,
            saveUninitialized: false,
            cookie: { 
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                sameSite: 'lax',
                path: '/'
            },
            name: 'lyricart-session'
        }));

        // Security headers
        app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('X-Download-Options', 'noopen');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
            next();
        });

        // Ensure session is available
        app.use((req, res, next) => {
            if (!req.session.id) {
                req.session.temp = true;
            }
            next();
        });

        // Cart API routes
        app.post('/api/cart/add', (req, res) => {
            try {
                const { designId, format, price } = req.body;
                
                if (!req.session.id) {
                    return res.status(401).json({ error: 'Session required' });
                }
                
                if (!designId || typeof designId !== 'string' || designId.length > 100) {
                    return res.status(400).json({ error: 'Invalid design ID' });
                }

                const cart = this.addToCart(req.session.id, designId, format || 'digital-download', price || 3);
                
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return res.status(500).json({ error: 'Failed to save session' });
                    }
                    res.json({ success: true, cart });
                });
            } catch (error) {
                console.error('Cart add error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        app.get('/api/cart', (req, res) => {
            try {
                if (!req.session.id) {
                    return res.status(401).json({ error: 'Session required' });
                }
                
                const cart = this.getCart(req.session.id);
                res.json({ cart });
            } catch (error) {
                console.error('Cart get error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        app.put('/api/cart/update', (req, res) => {
            try {
                const { designId, format, quantity } = req.body;
                
                if (!req.session.id) {
                    return res.status(401).json({ error: 'Session required' });
                }
                
                if (typeof quantity !== 'number' || quantity < 0 || quantity > 100) {
                    return res.status(400).json({ error: 'Invalid quantity' });
                }
                
                const cart = this.updateQuantity(req.session.id, designId, format, quantity);
                
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return res.status(500).json({ error: 'Failed to save session' });
                    }
                    res.json({ success: true, cart });
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.delete('/api/cart/remove', (req, res) => {
            try {
                const { designId, format } = req.body;
                
                if (!req.session.id) {
                    return res.status(401).json({ error: 'Session required' });
                }
                
                const cart = this.removeFromCart(req.session.id, designId, format);
                
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return res.status(500).json({ error: 'Failed to save session' });
                    }
                    res.json({ success: true, cart });
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.delete('/api/cart/clear', (req, res) => {
            try {
                if (!req.session.id) {
                    return res.status(401).json({ error: 'Session required' });
                }
                
                this.clearCart(req.session.id);
                
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return res.status(500).json({ error: 'Failed to save session' });
                    }
                    res.json({ success: true });
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        console.log('🔒 Secure cart system initialized');
    }
}

module.exports = { SecureCartSystem }; 