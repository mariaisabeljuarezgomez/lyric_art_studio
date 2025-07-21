// Environment Setup Script for LyricArt Studio
// Run this script to create your .env file

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔧 Setting up environment variables for LyricArt Studio...\n');

// Generate a secure session secret
const sessionSecret = crypto.randomBytes(32).toString('hex');

const envContent = `# Environment Variables for LyricArt Studio
# Generated on ${new Date().toISOString()}

# Session Configuration
SESSION_SECRET=${sessionSecret}

# Database Configuration (for Railway)
DATABASE_URL=postgresql://postgres:password@localhost:5432/lyricart_studio

# PayPal Configuration
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox

# Application Configuration
NODE_ENV=development
PORT=3001
BASE_URL=http://localhost:3001

# Security
CORS_ORIGIN=http://localhost:3001

# Instructions:
# 1. Replace 'your-paypal-client-id' and 'your-paypal-client-secret' with your actual PayPal credentials
# 2. Update DATABASE_URL with your Railway PostgreSQL connection string
# 3. Change NODE_ENV to 'production' when deploying
# 4. Update BASE_URL and CORS_ORIGIN for your production domain
`;

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists. Creating backup...');
    const backupPath = path.join(__dirname, '.env.backup');
    fs.copyFileSync(envPath, backupPath);
    console.log('✅ Backup created as .env.backup');
}

fs.writeFileSync(envPath, envContent);

console.log('✅ .env file created successfully!');
console.log('🔐 Session secret generated:', sessionSecret.substring(0, 16) + '...');
console.log('\n📝 Next steps:');
console.log('1. Edit .env file with your actual credentials');
console.log('2. Add .env to your .gitignore file (if not already there)');
console.log('3. Set up your Railway environment variables');
console.log('\n🚀 You can now run your server with: node server-enhanced.js'); 