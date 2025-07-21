
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

        const itemsHTML = this.cart.items.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>Design - ${item.format}</h4>
                    <p class="text-sm text-gray-600">Quantity: ${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                    <button onclick="cart.removeFromCart('${item.designId}', '${item.format}')" class="remove-btn">×</button>
                </div>
            </div>
        `).join('');

        cartDropdown.innerHTML = `
            <div class="cart-items">${itemsHTML}</div>
            <div class="cart-total">
                <strong>Total: $${this.cart.total.toFixed(2)}</strong>
            </div>
            <button onclick="cart.checkout()" class="checkout-btn">Checkout with PayPal</button>
        `;
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
    