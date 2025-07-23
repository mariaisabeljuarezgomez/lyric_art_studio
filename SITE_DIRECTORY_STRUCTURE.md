# 📁 LYRIC STUDIO WEBSITE - COMPLETE DIRECTORY STRUCTURE

## **🏠 ROOT DIRECTORY**
```
LYRIC STUDIO WEBSITE/
├── 📄 server-railway-production.js     # Main server file (Express.js + PostgreSQL)
├── 📄 package.json                     # Node.js dependencies
├── 📄 package-lock.json                # Locked dependency versions
├── 📄 .env                             # Environment variables (secrets)
├── 📄 designs-database.json            # Design catalog data
├── 📄 URGENT_HANDOVER_IMAGE_FIXES.md   # Critical fixes documentation
└── 📄 SITE_DIRECTORY_STRUCTURE.md      # This file
```

## **📂 PAGES DIRECTORY** (Frontend HTML/CSS/JS)
```
pages/
├── 📄 index.html                       # Homepage
├── 📄 song-catalog.html                # Design catalog page
├── 📄 my-collection.html               # User's purchased designs
├── 📄 cart.html                        # Shopping cart
├── 📄 checkout.html                    # PayPal checkout
├── 📄 payment-success.html             # Payment success page
├── 📄 login.html                       # User login
├── 📄 register.html                    # User registration
├── 📄 profile.html                     # User profile
├── 📄 wishlist.html                    # User wishlist
├── 📄 about.html                       # About page
├── 📄 contact.html                     # Contact page
├── 📄 privacy-policy.html              # Privacy policy
├── 📄 terms-of-service.html            # Terms of service
└── 📄 404.html                         # Error page
```

## **🎨 IMAGES DIRECTORY** (Design Assets)
```
images/
├── 📂 designs/                         # Design preview images
│   ├── 📁 luke-combs-lovin-on-you-guitar/
│   │   └── 📄 luke-combs-lovin-on-you-guitar.webp
│   ├── 📁 metallica-enter-sandman-guitar-2/
│   │   └── 📄 metallica-enter-sandman-guitar-2.webp
│   ├── 📁 the-pretenders-ill-stand-by-you-guitar/
│   │   └── 📄 the-pretenders-ill-stand-by-you-guitar.webp
│   └── 📁 [40+ more design folders...]
├── 📂 icons/                           # UI icons
├── 📂 logos/                           # Brand logos
└── 📂 backgrounds/                     # Background images
```

## **🎵 MUSIC_LYRICSS DIRECTORY** (Downloadable Files)
```
music_lyricss/
├── 📁 luke-combs-lovin-on-you-guitar/
│   ├── 📄 luke-combs-lovin-on-you-guitar.svg
│   ├── 📄 luke-combs-lovin-on-you-guitar.png
│   ├── 📄 luke-combs-lovin-on-you-guitar.pdf
│   └── 📄 luke-combs-lovin-on-you-guitar.eps
├── 📁 metallica-enter-sandman-guitar-2/
│   ├── 📄 metallica-enter-sandman-guitar-2.svg
│   ├── 📄 metallica-enter-sandman-guitar-2.png
│   ├── 📄 metallica-enter-sandman-guitar-2.pdf
│   └── 📄 metallica-enter-sandman-guitar-2.eps
└── 📁 [40+ more design folders...]
```

## **🔧 JAVASCRIPT FILES** (Frontend Logic)
```
pages/
├── 📄 song-catalog.js                  # Catalog page functionality
├── 📄 my-collection.js                 # Collection page functionality
├── 📄 cart.js                          # Cart functionality
├── 📄 checkout.js                      # Checkout process
├── 📄 auth.js                          # Authentication functions
├── 📄 wishlist.js                      # Wishlist functionality
├── 📄 profile.js                       # Profile management
└── 📄 common.js                        # Shared functions
```

## **🎨 CSS FILES** (Styling)
```
pages/
├── 📄 styles.css                       # Main stylesheet
├── 📄 catalog.css                      # Catalog page styles
├── 📄 collection.css                   # Collection page styles
├── 📄 cart.css                         # Cart page styles
├── 📄 auth.css                         # Authentication styles
└── 📄 responsive.css                   # Mobile responsiveness
```

## **🗄️ DATABASE STRUCTURE** (PostgreSQL)
```
Tables:
├── 📊 users                            # User accounts
├── 📊 purchases                        # Purchase records
├── 📊 pending_orders                   # Orders awaiting payment
├── 📊 designs                          # Design catalog
├── 📊 wishlist                         # User wishlists
└── 📊 sessions                         # User sessions
```

## **🔑 KEY CONFIGURATION FILES**
```
├── 📄 .env                             # Environment variables
│   ├── DATABASE_URL                    # PostgreSQL connection
│   ├── PAYPAL_CLIENT_ID                # PayPal API credentials
│   ├── PAYPAL_CLIENT_SECRET            # PayPal API credentials
│   ├── SESSION_SECRET                  # Session encryption
│   └── PORT                            # Server port
└── 📄 package.json                     # Dependencies & scripts
```

## **🚀 DEPLOYMENT FILES**
```
├── 📄 server-railway-production.js     # Production server
├── 📄 package.json                     # Railway deployment config
└── 📄 .env                             # Production environment
```

## **📋 IMPORTANT NOTES**

### **🔗 File Relationships:**
- **Design IDs** in database (249, 268, 395) → **Folder names** in images/designs/
- **Preview images** in `images/designs/` → **Downloadable files** in `music_lyricss/`
- **Frontend pages** in `pages/` → **Backend API** in `server-railway-production.js`

### **🎯 Critical Paths:**
- **Design images**: `/images/designs/[folder-name]/[folder-name].webp`
- **Download files**: `/music_lyricss/[folder-name]/[folder-name].[format]`
- **API endpoints**: `/api/my-collection/designs`, `/api/download/[designId]/[format]`

### **⚠️ Known Issues:**
- **Image loading fails** due to ID/folder name mismatch (see URGENT_HANDOVER_IMAGE_FIXES.md)
- **Downloads fail** because system uses numeric IDs instead of folder names
- **Server needs restart** after code changes

### **🔧 Maintenance:**
- **Clear browser cache** after frontend changes
- **Restart server** after backend changes
- **Check server logs** for debugging
- **Verify database connections** before deployment 