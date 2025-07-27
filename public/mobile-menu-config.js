// Global Mobile Menu Configuration
// Modify this file to change the mobile menu across ALL pages

const MOBILE_MENU_CONFIG = {
    // Main Navigation Items
    navigationItems: [
        {
            href: "/homepage",
            text: "Home",
            icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>`,
            active: false // Will be set automatically based on current page
        },
        {
            href: "/browse",
            text: "Browse Gallery",
            icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>`,
            active: false
        },
        {
            href: "/artist-profiles",
            text: "Artists",
            icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>`,
            active: false
        },
        {
            href: "/my-collection",
            text: "My Collection",
            icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>`,
            active: false
        }
        // ADD NEW NAVIGATION ITEMS HERE:
        // {
        //     href: "/new-page",
        //     text: "New Page",
        //     icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        //     </svg>`,
        //     active: false
        // }
    ],

    // Action Buttons (Search, Cart, etc.)
    actionButtons: [
        {
            type: "button", // "button" or "link"
            text: "Search",
            icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>`,
            onclick: "openHeaderSearch()",
            href: null,
            className: "" // Additional CSS classes
        },
        {
            type: "link",
            text: "Cart",
            icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>`,
            onclick: null,
            href: "/pages/checkout.html",
            className: ""
        }
        // ADD NEW ACTION BUTTONS HERE:
        // {
        //     type: "link",
        //     text: "Help",
        //     icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        //     </svg>`,
        //     onclick: null,
        //     href: "/help",
        //     className: ""
        // }
    ],

    // Authentication Buttons (Login/Register)
    authButtons: [
        {
            type: "link",
            text: "Login",
            icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>`,
            href: "/login",
            className: ""
        },
        {
            type: "link",
            text: "Register",
            icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>`,
            href: "/register",
            className: "primary" // This makes it the primary button (teal background)
        }
    ],

    // User Menu Items (when logged in)
    userMenuItems: [
        {
            type: "display", // "display" for showing user info, "button" for actions
            text: "User Email", // Will be replaced with actual email
            icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>`,
            onclick: null,
            className: "",
            id: "mobile-user-email"
        },
        {
            type: "button",
            text: "Logout",
            icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>`,
            onclick: "logout()",
            className: ""
        }
        // ADD NEW USER MENU ITEMS HERE:
        // {
        //     type: "link",
        //     text: "Account Settings",
        //     icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        //         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        //     </svg>`,
        //     href: "/account",
        //     className: ""
        // }
    ],

    // Menu Settings
    settings: {
        // Menu appearance
        drawerWidth: "320px", // Width of the mobile menu drawer
        overlayOpacity: 0.8, // Opacity of the background overlay
        animationDuration: "0.3s", // Animation duration for open/close
        
        // Header settings
        showLogo: true, // Show the logo in the mobile menu header
        logoText: "Lyric Art Studio", // Text next to the logo
        
        // Navigation settings
        showIcons: true, // Show icons next to navigation items
        activePageHighlight: true, // Highlight the current page
        
        // Footer settings
        showFooter: false, // Show a footer in the mobile menu
        footerText: "© 2024 Lyric Art Studio" // Footer text if enabled
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MOBILE_MENU_CONFIG;
} else {
    window.MOBILE_MENU_CONFIG = MOBILE_MENU_CONFIG;
} 