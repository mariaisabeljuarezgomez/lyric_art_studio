// Mobile Navigation System
// This file provides hamburger menu functionality for all pages
// Uses global configuration from mobile-menu-config.js

class MobileNavigation {
    constructor() {
        this.isOpen = false;
        this.config = window.MOBILE_MENU_CONFIG || this.getDefaultConfig();
        this.init();
    }

    init() {
        this.createMobileMenu();
        this.bindEvents();
        this.updateMenuState();
    }

    getDefaultConfig() {
        // Fallback configuration if global config is not loaded
        return {
            navigationItems: [],
            actionButtons: [],
            authButtons: [],
            userMenuItems: [],
            settings: {
                drawerWidth: "320px",
                overlayOpacity: 0.8,
                animationDuration: "0.3s",
                showLogo: true,
                logoText: "Lyric Art Studio",
                showIcons: true,
                activePageHighlight: true,
                showFooter: false,
                footerText: "© 2024 Lyric Art Studio"
            }
        };
    }

    createMobileMenu() {
        // Create mobile menu overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        overlay.id = 'mobile-menu-overlay';

        // Create mobile menu drawer
        const drawer = document.createElement('div');
        drawer.className = 'mobile-menu-drawer';
        drawer.id = 'mobile-menu-drawer';
        drawer.style.width = this.config.settings.drawerWidth;

        // Create header with close button
        const header = document.createElement('div');
        header.className = 'mobile-menu-header';
        header.innerHTML = `
            <div class="flex items-center space-x-3">
                ${this.config.settings.showLogo ? `
                <svg class="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                    <path d="M19 15L19.5 17L21 17.5L19.5 18L19 20L18.5 18L17 17.5L18.5 17L19 15Z"/>
                    <path d="M5 15L5.5 17L7 17.5L5.5 18L5 20L4.5 18L3 17.5L4.5 17L5 15Z"/>
                </svg>
                <span class="text-lg font-montserrat font-bold text-text-primary">${this.config.settings.logoText}</span>
                ` : `<span class="text-lg font-montserrat font-bold text-text-primary">${this.config.settings.logoText}</span>`}
            </div>
            <button class="mobile-menu-close" onclick="mobileNav.close()">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        `;

        // Create navigation items from config
        const nav = document.createElement('div');
        nav.className = 'mobile-menu-nav';
        nav.innerHTML = this.generateNavigationHTML();

        // Create action buttons section from config
        const actions = document.createElement('div');
        actions.className = 'mobile-menu-actions';
        actions.innerHTML = this.generateActionsHTML();

        // Assemble the mobile menu
        drawer.appendChild(header);
        drawer.appendChild(nav);
        drawer.appendChild(actions);
        overlay.appendChild(drawer);

        // Add to body
        document.body.appendChild(overlay);
    }

    generateNavigationHTML() {
        const currentPath = window.location.pathname;
        return this.config.navigationItems.map(item => {
            const isActive = this.config.settings.activePageHighlight && 
                           (currentPath === item.href || currentPath.startsWith(item.href + '/'));
            const activeClass = isActive ? ' active' : '';
            
            return `
                <a href="${item.href}" class="mobile-menu-nav-item${activeClass}">
                    ${this.config.settings.showIcons ? item.icon : ''}
                    <span>${item.text}</span>
                </a>
            `;
        }).join('');
    }

    generateActionsHTML() {
        let html = '';
        
        // Action buttons
        this.config.actionButtons.forEach(button => {
            if (button.type === 'button') {
                html += `
                    <button onclick="${button.onclick}" class="mobile-menu-action-btn ${button.className}">
                        <span>${button.text}</span>
                        ${this.config.settings.showIcons ? button.icon : ''}
                    </button>
                `;
            } else if (button.type === 'link') {
                html += `
                    <a href="${button.href}" class="mobile-menu-action-btn ${button.className}">
                        <span>${button.text}</span>
                        ${this.config.settings.showIcons ? button.icon : ''}
                    </a>
                `;
            }
        });

        // Auth buttons (for non-logged in users)
        html += '<div id="mobile-auth-buttons">';
        this.config.authButtons.forEach(button => {
            if (button.type === 'button') {
                html += `
                    <button onclick="${button.onclick}" class="mobile-menu-action-btn ${button.className}">
                        <span>${button.text}</span>
                        ${this.config.settings.showIcons ? button.icon : ''}
                    </button>
                `;
            } else if (button.type === 'link') {
                html += `
                    <a href="${button.href}" class="mobile-menu-action-btn ${button.className}">
                        <span>${button.text}</span>
                        ${this.config.settings.showIcons ? button.icon : ''}
                    </a>
                `;
            }
        });
        html += '</div>';

        // User menu (for logged in users)
        html += '<div id="mobile-user-menu" class="hidden">';
        this.config.userMenuItems.forEach(item => {
            if (item.type === 'display') {
                html += `
                    <div class="mobile-menu-action-btn ${item.className}">
                        <span id="${item.id}" class="truncate">${item.text}</span>
                        ${this.config.settings.showIcons ? item.icon : ''}
                    </div>
                `;
            } else if (item.type === 'button') {
                html += `
                    <button onclick="${item.onclick}" class="mobile-menu-action-btn ${item.className}">
                        <span>${item.text}</span>
                        ${this.config.settings.showIcons ? item.icon : ''}
                    </button>
                `;
            } else if (item.type === 'link') {
                html += `
                    <a href="${item.href}" class="mobile-menu-action-btn ${item.className}">
                        <span>${item.text}</span>
                        ${this.config.settings.showIcons ? item.icon : ''}
                    </a>
                `;
            }
        });
        html += '</div>';

        return html;
    }

    bindEvents() {
        // Update hamburger button to use this class
        const hamburgerBtn = document.querySelector('.hamburger-menu-btn');
        if (hamburgerBtn) {
            hamburgerBtn.onclick = () => this.toggle();
        }

        // Close on overlay click
        const overlay = document.getElementById('mobile-menu-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Prevent body scroll when menu is open
        const drawer = document.getElementById('mobile-menu-drawer');
        if (drawer) {
            drawer.addEventListener('touchmove', (e) => {
                if (this.isOpen) {
                    e.stopPropagation();
                }
            });
        }
    }

    updateMenuState() {
        // Update auth state in mobile menu
        const authButtons = document.getElementById('mobile-auth-buttons');
        const userMenu = document.getElementById('mobile-user-menu');
        const userEmail = document.getElementById('mobile-user-email');

        if (authButtons && userMenu && userEmail) {
            // Check if user is logged in (you'll need to implement this based on your auth system)
            const isLoggedIn = this.checkAuthStatus();
            
            if (isLoggedIn) {
                authButtons.classList.add('hidden');
                userMenu.classList.remove('hidden');
                // Set user email (you'll need to get this from your auth system)
                userEmail.textContent = this.getUserEmail() || 'User';
            } else {
                authButtons.classList.remove('hidden');
                userMenu.classList.add('hidden');
            }
        }
    }

    checkAuthStatus() {
        // This should check your authentication status
        // For now, we'll check if there's a user session
        return document.getElementById('user-menu') && 
               !document.getElementById('user-menu').classList.contains('hidden');
    }

    getUserEmail() {
        // Get user email from existing elements
        const userEmailElement = document.getElementById('user-email');
        return userEmailElement ? userEmailElement.textContent : '';
    }

    open() {
        this.isOpen = true;
        const overlay = document.getElementById('mobile-menu-overlay');
        const drawer = document.getElementById('mobile-menu-drawer');
        const hamburgerBtn = document.querySelector('.hamburger-menu-btn');

        if (overlay) overlay.classList.add('active');
        if (drawer) drawer.classList.add('active');
        if (hamburgerBtn) hamburgerBtn.classList.add('active');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.isOpen = false;
        const overlay = document.getElementById('mobile-menu-overlay');
        const drawer = document.getElementById('mobile-menu-drawer');
        const hamburgerBtn = document.querySelector('.hamburger-menu-btn');

        if (overlay) overlay.classList.remove('active');
        if (drawer) drawer.classList.remove('active');
        if (hamburgerBtn) hamburgerBtn.classList.remove('active');

        // Restore body scroll
        document.body.style.overflow = '';
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}

// Initialize mobile navigation when DOM is loaded
let mobileNav;
document.addEventListener('DOMContentLoaded', () => {
    mobileNav = new MobileNavigation();
});

// Export for global access
window.mobileNav = mobileNav; 