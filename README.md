# Lyric Art Studio - Digital Music Design Marketplace

A premium digital marketplace for music-inspired lyric art designs in SVG, PDF, PNG, and EPS formats. Complete e-commerce platform with PayPal integration, email notifications, and user authentication.

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)
- PostgreSQL database (for production)

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd LYRIC-STUDIO-WEBSITE
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   or for production:
   ```bash
   npm start
   ```

5. **Access Your Website**
   - Development: `http://localhost:3001`
   - Production: `https://lyricartstudio-production.up.railway.app`

## 📁 Project Structure

```
LYRIC STUDIO WEBSITE/
├── index.html                 # Main entry point (redirects to homepage)
├── server-railway-production.js # Production server with all features
├── server-enhanced.js         # Enhanced development server
├── pages/
│   ├── homepage.html          # Main homepage with featured designs
│   ├── browse_gallery.html    # Gallery with search and filters
│   ├── artist_profiles.html   # Artist information pages
│   ├── login.html            # User authentication
│   ├── register.html         # User registration
│   ├── checkout.html         # Payment processing
│   ├── account.html          # User account management
│   ├── downloads.html        # Purchase downloads
│   └── my_collection_dashboard.html # User collections
├── public/
│   ├── song-catalog.js       # JavaScript for managing design data
│   └── openseadragon-viewer.js # Image viewer with zoom/pan
├── css/
│   ├── main.css              # Main stylesheet
│   └── tailwind.css          # Tailwind CSS framework
├── images/
│   └── designs/              # Optimized WebP images for web
├── music_lyricss/            # Original high-resolution files
├── designs-database.json     # Complete design database (400+ designs)
├── package.json              # Project dependencies
└── Various configuration and documentation files
```

## 🎵 Features

### **Core Functionality**
- **400+ Designs**: Complete database of lyric art designs
- **Multiple Formats**: SVG, PDF, PNG, EPS for all designs
- **Real-time Search**: Search by song, artist, or lyrics
- **Genre Filtering**: Filter by Rock, Country, Pop, etc.
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Optimized Images**: WebP format with PNG fallback
- **$3.00 Pricing**: Consistent pricing across all designs

### **E-commerce Features**
- **Shopping Cart**: Server-side cart with session persistence
- **User Authentication**: Registration, login, and account management
- **PayPal Integration**: Complete payment processing with webhooks
- **Order Management**: Purchase history and download access
- **Email Notifications**: Order confirmations and customer support

### **Advanced Features**
- **Zoom & Pan**: Professional image viewer with OpenDragon
- **Artist Profiles**: Detailed artist information and collections
- **Session Management**: Persistent user sessions with PostgreSQL
- **Security**: CORS, CSRF protection, and secure headers
- **Email System**: Professional HTML email templates

## 🔧 Development

### **Server Options**
- **Development**: `server-enhanced.js` - Full features for local development
- **Production**: `server-railway-production.js` - Optimized for Railway deployment

### **Key Technologies**
- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (sessions), JSON (designs)
- **Email**: Nodemailer with Namecheap Private Email
- **Payment**: PayPal Checkout Server SDK
- **Deployment**: Railway with automatic CI/CD

### **Environment Variables**
```env
# Database
DATABASE_URL=postgresql://...
SESSION_SECRET=your_session_secret

# Email Configuration
EMAIL_HOST=smtp.privateemail.com
EMAIL_PORT=587
EMAIL_USER=admin@lyricartstudio.shop
EMAIL_PASS=your_email_password
EMAIL_FROM_NAME=Lyric Art Studio

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
SITE_URL=https://lyricartstudio-production.up.railway.app

# General
NODE_ENV=production
PORT=3001
```

## 📊 Current Stats

- **Total Designs**: 400+
- **Artists**: 50+
- **Genres**: Rock, Country, Pop, Alternative Rock, Classic Rock, Reggae
- **Shapes**: Guitar, Piano, Cassette, Heart, Circle, Square
- **Price**: $3.00 per design
- **Formats**: SVG, PDF, PNG, EPS
- **Users**: 2 default accounts (test and admin)

## 🛠️ Technical Stack

### **Frontend**
- **HTML5**: Semantic markup and accessibility
- **CSS3**: Tailwind CSS for responsive design
- **JavaScript**: Vanilla JS with modern ES6+ features
- **Image Viewer**: OpenDragon for professional zoom/pan

### **Backend**
- **Node.js**: Server runtime environment
- **Express.js**: Web application framework
- **PostgreSQL**: Session storage and user data
- **Nodemailer**: Email sending functionality
- **PayPal SDK**: Payment processing integration

### **Infrastructure**
- **Railway**: Production deployment and hosting
- **PostgreSQL**: Database service
- **Namecheap Private Email**: SMTP email service
- **PayPal**: Payment processing and webhooks

## 🚀 Production Deployment

### **Railway Deployment**
- **URL**: https://lyricartstudio-production.up.railway.app
- **Auto-deploy**: Enabled on git push
- **Database**: PostgreSQL add-on
- **Environment**: Production with HTTPS

### **Features in Production**
- ✅ **Complete E-commerce**: Shopping cart, payments, downloads
- ✅ **User Authentication**: Registration, login, sessions
- ✅ **Email System**: Order confirmations and notifications
- ✅ **PayPal Integration**: Secure payment processing
- ✅ **Responsive Design**: Mobile and desktop optimized
- ✅ **Security**: CORS, CSRF protection, secure headers

## 📝 Copyright Notice

All song titles, lyrics, and artist names are trademarks and copyrights of their respective owners. These designs are sold as artistic interpretations for personal, non-commercial use only. No commercial rights to the underlying musical works are conveyed with purchase.

## 🔗 Documentation

- **[Comprehensive Project Review](./COMPREHENSIVE_PROJECT_REVIEW.md)**: Complete project overview and technical details
- **[Email System Implementation](./EMAIL_SYSTEM_IMPLEMENTATION.md)**: Email functionality documentation
- **[PayPal Integration](./PAYPAL_INTEGRATION_IMPLEMENTATION.md)**: Payment processing setup
- **[Railway Setup](./RAILWAY_SETUP.md)**: Deployment configuration
- **[Cart Session Solution](./CART_SESSION_PROBLEM_SOLUTION.md)**: Session persistence fixes

## 🚀 Next Steps

1. **Test the Website**: Visit the production URL to see your designs
2. **Browse Gallery**: Check out the search and filtering functionality
3. **Test E-commerce**: Try the complete purchase flow
4. **User Accounts**: Test registration and login functionality
5. **Future Development**: Add admin panel, analytics, and advanced features

---

**Status**: ✅ **FULLY OPERATIONAL** - Complete e-commerce platform with payment processing, email notifications, and user authentication.

**Last Updated**: January 2025
