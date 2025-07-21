// New Payment System for LyricArt Studio
// Simplified, functional payment integration

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class PaymentSystem {
    constructor() {
        this.ordersPath = path.join(__dirname, 'database', 'orders.json');
        this.usersPath = path.join(__dirname, 'database', 'users.json');
        this.ensureDatabaseExists();
    }

    ensureDatabaseExists() {
        const dbDir = path.join(__dirname, 'database');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.ordersPath)) {
            fs.writeFileSync(this.ordersPath, JSON.stringify([], null, 2));
        }
        
        if (!fs.existsSync(this.usersPath)) {
            fs.writeFileSync(this.usersPath, JSON.stringify([], null, 2));
        }
    }

    // Cart Management
    getCart(sessionId) {
        if (!sessionId) {
            return { items: [], total: 0, itemCount: 0 };
        }
        
        // For now, use session storage - can be moved to database later
        return global.cartStorage?.get(sessionId) || { items: [], total: 0, itemCount: 0 };
    }

    addToCart(sessionId, designId, format, price = 3) {
        if (!sessionId) {
            throw new Error('Session required');
        }

        if (!global.cartStorage) {
            global.cartStorage = new Map();
        }

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
        global.cartStorage.set(sessionId, cart);
        return cart;
    }

    removeFromCart(sessionId, designId, format) {
        if (!sessionId) {
            throw new Error('Session required');
        }

        const cart = this.getCart(sessionId);
        cart.items = cart.items.filter(item => 
            !(item.designId === designId && item.format === format)
        );
        this.updateCartTotals(cart);
        
        if (global.cartStorage) {
            global.cartStorage.set(sessionId, cart);
        }
        return cart;
    }

    clearCart(sessionId) {
        if (global.cartStorage) {
            global.cartStorage.delete(sessionId);
        }
    }

    updateCartTotals(cart) {
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Order Management
    createOrder(orderData) {
        const orders = this.loadOrders();
        
        const order = {
            id: this.generateId(),
            userId: orderData.userId || 'guest',
            items: orderData.items,
            total: orderData.total,
            status: 'pending',
            paymentMethod: orderData.paymentMethod || 'paypal',
            paymentId: orderData.paymentId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        orders.push(order);
        this.saveOrders(orders);
        return order;
    }

    updateOrderStatus(orderId, status, paymentId = null) {
        const orders = this.loadOrders();
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            throw new Error('Order not found');
        }

        orders[orderIndex].status = status;
        orders[orderIndex].updatedAt = new Date().toISOString();
        if (paymentId) {
            orders[orderIndex].paymentId = paymentId;
        }
        
        this.saveOrders(orders);
        return orders[orderIndex];
    }

    getUserOrders(userId) {
        const orders = this.loadOrders();
        return orders.filter(o => o.userId === userId);
    }

    getOrder(orderId) {
        const orders = this.loadOrders();
        return orders.find(o => o.id === orderId);
    }

    // PayPal Integration
    createPayPalOrder(cart) {
        if (!cart.items || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

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
                    name: `${item.designId} - ${item.format}`,
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

        return paypalOrder;
    }

    processPayment(paymentId, cart, userId) {
        try {
            // Create order
            const order = this.createOrder({
                userId: userId,
                items: cart.items,
                total: cart.total,
                paymentMethod: 'paypal',
                paymentId: paymentId
            });

            // Update order status to paid
            this.updateOrderStatus(order.id, 'paid', paymentId);

            // Clear cart
            this.clearCart(userId);

            return {
                success: true,
                order: order,
                message: 'Payment processed successfully'
            };
        } catch (error) {
            console.error('Payment processing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility Methods
    generateId() {
        return crypto.randomBytes(16).toString('hex');
    }

    loadOrders() {
        try {
            const data = fs.readFileSync(this.ordersPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    saveOrders(orders) {
        fs.writeFileSync(this.ordersPath, JSON.stringify(orders, null, 2));
    }

    // Express Routes Setup
    setupRoutes(app) {
        // Cart routes
        app.post('/api/cart/add', (req, res) => {
            try {
                console.log('🛒 Cart add request:', req.body);
                const { designId, format, price } = req.body;
                
                if (!req.session.id) {
                    return res.status(401).json({ error: 'Session required' });
                }
                
                if (!designId) {
                    return res.status(400).json({ error: 'Design ID required' });
                }

                const cart = this.addToCart(req.session.id, designId, format, price);
                console.log('✅ Item added to cart:', cart);
                
                res.json({ success: true, cart });
            } catch (error) {
                console.error('❌ Cart add error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        app.get('/api/cart', (req, res) => {
            try {
                console.log('🛒 Cart get request');
                
                if (!req.session.id) {
                    return res.status(401).json({ error: 'Session required' });
                }
                
                const cart = this.getCart(req.session.id);
                console.log('✅ Cart data:', cart);
                
                res.json({ cart });
            } catch (error) {
                console.error('❌ Cart get error:', error);
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
                res.json({ success: true, cart });
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
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Payment routes
        app.post('/api/payment/create-order', (req, res) => {
            try {
                if (!req.session.id) {
                    return res.status(401).json({ error: 'Session required' });
                }
                
                const cart = this.getCart(req.session.id);
                
                if (!cart.items || cart.items.length === 0) {
                    return res.status(400).json({ error: 'Cart is empty' });
                }

                const paypalOrder = this.createPayPalOrder(cart);
                console.log('✅ PayPal order created:', paypalOrder);
                
                res.json({ success: true, paypalOrder });
            } catch (error) {
                console.error('❌ Payment order creation error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        app.post('/api/payment/process', (req, res) => {
            try {
                const { paymentId } = req.body;
                const cart = this.getCart(req.session.id);
                const userId = req.session.userId;

                const result = this.processPayment(paymentId, cart, userId);
                console.log('✅ Payment processed:', result);
                
                res.json(result);
            } catch (error) {
                console.error('❌ Payment processing error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Order routes
        app.get('/api/orders', (req, res) => {
            try {
                const userId = req.session.userId;
                if (!userId) {
                    return res.status(401).json({ error: 'Authentication required' });
                }

                const orders = this.getUserOrders(userId);
                res.json({ success: true, orders });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.get('/api/orders/:orderId', (req, res) => {
            try {
                const { orderId } = req.params;
                const order = this.getOrder(orderId);
                
                if (!order) {
                    return res.status(404).json({ error: 'Order not found' });
                }

                res.json({ success: true, order });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Health check
        app.get('/api/payment/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                message: 'Payment system is running'
            });
        });
    }
}

module.exports = PaymentSystem; 