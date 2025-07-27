# Mobile Menu Global Configuration System

## Overview
The mobile menu is now controlled by a global configuration file that allows you to modify the menu across ALL pages from one central location. This makes it easy to add new links, change existing ones, or modify the entire menu structure without touching individual page files.

## Configuration File
**Location:** `public/mobile-menu-config.js`

## How to Modify the Mobile Menu

### 1. Adding New Navigation Items
To add a new page to the main navigation, edit the `navigationItems` array in `mobile-menu-config.js`:

```javascript
navigationItems: [
    // ... existing items ...
    {
        href: "/new-page",
        text: "New Page",
        icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>`,
        active: false
    }
]
```

### 2. Adding New Action Buttons
To add buttons like Search, Cart, Help, etc., edit the `actionButtons` array:

```javascript
actionButtons: [
    // ... existing buttons ...
    {
        type: "link", // "button" or "link"
        text: "Help",
        icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>`,
        onclick: null,
        href: "/help",
        className: ""
    }
]
```

### 3. Adding User Menu Items (for logged-in users)
To add items that appear when users are logged in, edit the `userMenuItems` array:

```javascript
userMenuItems: [
    // ... existing items ...
    {
        type: "link",
        text: "Account Settings",
        icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>`,
        href: "/account",
        className: ""
    }
]
```

## Configuration Options

### Item Types
- **`type: "link"`** - Creates a clickable link that navigates to a URL
- **`type: "button"`** - Creates a button that executes JavaScript when clicked
- **`type: "display"`** - Creates a display-only item (like showing user email)

### Button Properties
- **`text`** - The text displayed on the button/link
- **`icon`** - SVG icon (optional, can be disabled in settings)
- **`href`** - URL for links (required for `type: "link"`)
- **`onclick`** - JavaScript function to call (required for `type: "button"`)
- **`className`** - Additional CSS classes (use `"primary"` for teal background)

### Menu Settings
```javascript
settings: {
    drawerWidth: "320px",           // Width of mobile menu
    overlayOpacity: 0.8,            // Background overlay opacity
    animationDuration: "0.3s",      // Animation speed
    showLogo: true,                 // Show logo in header
    logoText: "Lyric Art Studio",   // Text next to logo
    showIcons: true,                // Show icons next to items
    activePageHighlight: true,      // Highlight current page
    showFooter: false,              // Show footer in menu
    footerText: "© 2024 Lyric Art Studio"
}
```

## Icon Reference
You can find SVG icons at:
- [Heroicons](https://heroicons.com/) (recommended)
- [Feather Icons](https://feathericons.com/)
- [Material Icons](https://material.io/icons/)

## Example: Adding a "Contact Us" Page

1. **Add to navigation:**
```javascript
{
    href: "/contact",
    text: "Contact Us",
    icon: `<svg class="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>`,
    active: false
}
```

2. **Save the file** - Changes apply immediately to all pages!

## Benefits
- ✅ **Global Control** - Change menu on all pages from one file
- ✅ **Consistent Design** - All pages use the same menu structure
- ✅ **Easy Maintenance** - No need to edit individual page files
- ✅ **Flexible** - Support for links, buttons, and display items
- ✅ **Responsive** - Automatically adapts to mobile screens
- ✅ **Accessible** - Proper ARIA labels and keyboard navigation

## Files Involved
- `public/mobile-menu-config.js` - Global configuration
- `public/mobile-navigation.js` - Menu functionality
- `css/main.css` - Menu styling
- All HTML pages - Include the scripts automatically

## Troubleshooting
- **Menu not appearing?** Check that both scripts are included in your HTML pages
- **Icons not showing?** Verify `showIcons: true` in settings
- **Links not working?** Check that `href` paths are correct
- **Buttons not working?** Ensure `onclick` functions exist in your page

## Quick Start
1. Edit `public/mobile-menu-config.js`
2. Add/modify items in the arrays
3. Save the file
4. Test on any page - changes appear everywhere! 