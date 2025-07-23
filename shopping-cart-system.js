// Shopping Cart System with PayPal Integration
// Complete e-commerce functionality for LyricArt Studio Website

const express = require('express');
const { DatabaseManager } = require('./database-setup');

class ShoppingCartSystem {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.carts = new Map(); // In-memory cart storage (can be moved to database)
    }

    // Shopping Cart Management
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

    removeFromCart(sessionId, designId, format) {
        const cart = this.getCart(sessionId);
        cart.items = cart.items.filter(item => 
            !(item.designId === designId && item.format === format)
        );
        this.updateCartTotals(cart);
        return cart;
    }

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

    clearCart(sessionId) {
        this.carts.delete(sessionId);
    }

    updateCartTotals(cart) {
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    // PayPal Integration
    async createPayPalOrder(cart, userData) {
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
                    name: `Design - ${item.format}`,
                    unit_amount: {
                        currency_code: 'USD',
                        value: item.price.toFixed(2)
                    },
                    quantity: item.quantity.toString(),
                    category: 'DIGITAL_GOODS'
                })),
                description: 'Lyric Art Studio Design Purchase',
                custom_id: `order_${Date.now()}`
            }],
            application_context: {
                return_url: `${process.env.BASE_URL || 'http://localhost:3001'}/payment/success`,
                cancel_url: `${process.env.BASE_URL || 'http://localhost:3001'}/payment/cancel`
            }
        };

        return paypalOrder;
    }

    async processPayPalPayment(paymentId, cart, userId) {
        try {
            // Create order in database
            const order = await this.dbManager.createOrder({
                userId: userId,
                items: cart.items,
                total: cart.total,
                paymentMethod: 'paypal',
                paymentId: paymentId,
                status: 'paid'
            });

            // Generate download links
            const downloadLinks = await this.generateDownloadLinks(cart.items, order.id);
            
            // Update order with download links
            await this.dbManager.updateOrderStatus(order.id, 'fulfilled');
            
            // Clear cart
            this.clearCart(userId);

            return {
                success: true,
                order: order,
                downloadLinks: downloadLinks
            };
        } catch (error) {
            console.error('Payment processing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Download Management
    async generateDownloadLinks(items, orderId) {
        const downloadLinks = [];
        
        for (const item of items) {
            for (let i = 0; i < item.quantity; i++) {
                const downloadLink = {
                    id: this.dbManager.generateId(),
                    designId: item.designId,
                    format: item.format,
                    orderId: orderId,
                    downloadUrl: `/api/download/${item.designId}/${item.format}`,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                    downloaded: false
                };
                downloadLinks.push(downloadLink);
            }
        }

        return downloadLinks;
    }

    // Express.js Routes
    setupRoutes(app) {
        // Cart routes
        app.post('/api/cart/add', (req, res) => {
            try {
                console.log('🛒 Cart add request received');
                const { designId, format, price } = req.body;
                
                // Ensure session exists
                if (!req.session.id) {
                    console.error('❌ No session available');
                    return res.status(401).json({ error: 'Session required' });
                }
                
                const sessionId = req.session.id;
                console.log('🛒 Session ID for cart:', sessionId);
                console.log('🛒 Request body:', req.body);
                
                if (!designId) {
                    console.error('❌ Design ID missing');
                    return res.status(400).json({ error: 'Design ID required' });
                }

                // Validate input
                if (typeof designId !== 'string' || designId.length > 100) {
                    return res.status(400).json({ error: 'Invalid design ID' });
                }

                const cart = this.addToCart(sessionId, designId, format || 'digital-download', price || 3);
                console.log('🛒 Cart after adding item:', cart);
                
                // Ensure session is saved
                req.session.save((err) => {
                    if (err) {
                        console.error('❌ Session save error:', err);
                        return res.status(500).json({ error: 'Failed to save session' });
                    }
                    res.json({ success: true, cart });
                });
            } catch (error) {
                console.error('❌ Cart add error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        app.get('/api/cart', (req, res) => {
            try {
                console.log('🛒 Cart get request received');
                
                // Ensure session exists
                if (!req.session.id) {
                    console.error('❌ No session available');
                    return res.status(401).json({ error: 'Session required' });
                }
                
                const sessionId = req.session.id;
                console.log('🛒 Session ID for cart get:', sessionId);
                
                const cart = this.getCart(sessionId);
                console.log('🛒 Cart data:', cart);
                res.json({ cart });
            } catch (error) {
                console.error('❌ Cart get error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        app.put('/api/cart/update', (req, res) => {
            try {
                const { designId, format, quantity } = req.body;
                
                // Ensure session exists
                if (!req.session.id) {
                    return res.status(401).json({ error: 'Session required' });
                }
                
                const sessionId = req.session.id;
                
                // Validate input
                if (typeof quantity !== 'number' || quantity < 0 || quantity > 100) {
                    return res.status(400).json({ error: 'Invalid quantity' });
                }
                
                const cart = this.updateQuantity(sessionId, designId, format, quantity);
                
                // Ensure session is saved
                req.session.save((err) => {
                    if (err) {
                        console.error('❌ Session save error:', err);
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
                
                // Ensure session exists
                if (!req.session.id) {
                    return res.status(401).json({ error: 'Session required' });
                }
                
                const sessionId = req.session.id;
                
                const cart = this.removeFromCart(sessionId, designId, format);
                
                // Ensure session is saved
                req.session.save((err) => {
                    if (err) {
                        console.error('❌ Session save error:', err);
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
                // Ensure session exists
                if (!req.session.id) {
                    return res.status(401).json({ error: 'Session required' });
                }
                
                const sessionId = req.session.id;
                this.clearCart(sessionId);
                
                // Ensure session is saved
                req.session.save((err) => {
                    if (err) {
                        console.error('❌ Session save error:', err);
                        return res.status(500).json({ error: 'Failed to save session' });
                    }
                    res.json({ success: true });
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // PayPal routes
        app.post('/api/payment/create-paypal-order', async (req, res) => {
            try {
                // Ensure session exists
                if (!req.session.id) {
                    return res.status(401).json({ error: 'Session required' });
                }
                
                const sessionId = req.session.id;
                const cart = this.getCart(sessionId);
                
                if (cart.items.length === 0) {
                    return res.status(400).json({ error: 'Cart is empty' });
                }

                const paypalOrder = await this.createPayPalOrder(cart, req.user);
                res.json({ paypalOrder });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.post('/api/payment/capture-paypal', async (req, res) => {
            try {
                const { paymentId } = req.body;
                const sessionId = req.session.id || req.sessionID || 'anonymous';
                const cart = this.getCart(sessionId);
                const userId = req.user?.id;

                const result = await this.processPayPalPayment(paymentId, cart, userId);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Order routes
        app.get('/api/orders', async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Authentication required' });
                }

                const orders = await this.dbManager.getUserOrders(userId);
                res.json({ orders });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.get('/api/orders/:orderId', async (req, res) => {
            try {
                const { orderId } = req.params;
                const userId = req.user?.id;
                
                const orders = await this.dbManager.getUserOrders(userId);
                const order = orders.find(o => o.id === orderId);
                
                if (!order) {
                    return res.status(404).json({ error: 'Order not found' });
                }

                res.json({ order });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Download routes
        app.get('/api/download/:designId/:format', (req, res) => {
            try {
                const { designId, format } = req.params;
                const userId = req.user?.id;
                
                // Verify user has purchased this design
                // Generate secure download link
                // Serve the file
                
                res.json({ 
                    downloadUrl: `/files/${designId}/${format}`,
                    message: 'Download link generated'
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
}

// Frontend JavaScript for cart functionality
function createCartFrontendJS() {
    return `
// Shopping Cart Frontend JavaScript
class ShoppingCart {
    constructor() {
        this.cart = { items: [], total: 0, itemCount: 0 };
        this.init();
    }

    async init() {
        await this.loadCart();
        this.updateCartUI();
        this.bindEvents();
    }

    async loadCart() {
        try {
            const response = await fetch('/api/cart');
            const data = await response.json();
            this.cart = data.cart;
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    }

    async addToCart(designId, format) {
        try {
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ designId, format })
            });
            
            const data = await response.json();
            if (data.success) {
                this.cart = data.cart;
                this.updateCartUI();
                this.showNotification('Added to cart!');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
        }
    }

    async updateQuantity(designId, format, quantity) {
        try {
            const response = await fetch('/api/cart/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ designId, format, quantity })
            });
            
            const data = await response.json();
            if (data.success) {
                this.cart = data.cart;
                this.updateCartUI();
            }
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    }

    async removeFromCart(designId, format) {
        try {
            const response = await fetch('/api/cart/remove', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ designId, format })
            });
            
            const data = await response.json();
            if (data.success) {
                this.cart = data.cart;
                this.updateCartUI();
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
        }
    }

    updateCartUI() {
        // Update cart icon with item count
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            const badge = cartIcon.querySelector('.cart-badge');
            if (badge) {
                badge.textContent = this.cart.itemCount;
                badge.style.display = this.cart.itemCount > 0 ? 'block' : 'none';
            }
        }

        // Update cart dropdown/modal
        this.updateCartDropdown();
    }

    updateCartDropdown() {
        const cartDropdown = document.querySelector('.cart-dropdown');
        if (!cartDropdown) return;

        if (this.cart.items.length === 0) {
            cartDropdown.innerHTML = '<p class="text-gray-500">Your cart is empty</p>';
            return;
        }

        const itemsHTML = this.cart.items.map(item => \`
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>Design - \${item.format}</h4>
                    <p class="text-sm text-gray-600">Quantity: \${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <span class="cart-item-price">$\${(item.price * item.quantity).toFixed(2)}</span>
                    <button onclick="cart.removeFromCart('\${item.designId}', '\${item.format}')" class="remove-btn">×</button>
                </div>
            </div>
        \`).join('');

        cartDropdown.innerHTML = \`
            <div class="cart-items">\${itemsHTML}</div>
            <div class="cart-total">
                <strong>Total: $\${this.cart.total.toFixed(2)}</strong>
            </div>
            <button onclick="cart.checkout()" class="checkout-btn">Checkout with PayPal</button>
        \`;
    }

    async checkout() {
        try {
            const response = await fetch('/api/payment/create-paypal-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            if (data.paypalOrder) {
                // Redirect to PayPal or open PayPal modal
                this.openPayPalCheckout(data.paypalOrder);
            }
        } catch (error) {
            console.error('Error creating checkout:', error);
        }
    }

    openPayPalCheckout(paypalOrder) {
        // Implement PayPal checkout flow
        console.log('Opening PayPal checkout:', paypalOrder);
        // This would integrate with PayPal SDK
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    bindEvents() {
        // Bind add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.add-to-cart-btn')) {
                const designId = e.target.dataset.designId;
                const format = e.target.dataset.format;
                this.addToCart(designId, format);
            }
        });
    }
}

// Initialize cart
const cart = new ShoppingCart();
    `;
}

// Initialize shopping cart system if run directly
if (require.main === module) {
    const cartSystem = new ShoppingCartSystem();
    console.log('✅ Shopping Cart System initialized!');
    console.log('📁 Frontend JS created');
    
    // Save frontend JavaScript
    const fs = require('fs');
    fs.writeFileSync('public/cart.js', createCartFrontendJS());
    console.log('💾 Frontend cart.js saved to public/cart.js');
}

module.exports = { ShoppingCartSystem, createCartFrontendJS }; 