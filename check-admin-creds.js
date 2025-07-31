require('dotenv').config();

console.log('🔐 Admin Credentials Check');
console.log('==========================');

// Check environment variables
console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME || 'NOT_SET (using default: admin)');
console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'SET' : 'NOT_SET (using default: secure-admin-password-2025)');
console.log('ADMIN_IP_WHITELIST:', process.env.ADMIN_IP_WHITELIST || 'NOT_SET (allowing all IPs)');

// Show what credentials should work
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'secure-admin-password-2025';

console.log('\n📋 Current Admin Credentials:');
console.log('=============================');
console.log('Username:', adminUsername);
console.log('Password:', adminPassword);

// Check IP whitelist
const ADMIN_IP_WHITELIST = process.env.ADMIN_IP_WHITELIST ?
    process.env.ADMIN_IP_WHITELIST.split(',').map(ip => ip.trim()) :
    ['*'];

console.log('\n🌐 IP Whitelist Configuration:');
console.log('==============================');
if (ADMIN_IP_WHITELIST.includes('*')) {
    console.log('✅ All IPs are allowed (no restrictions)');
} else {
    console.log('🔒 Restricted IPs:', ADMIN_IP_WHITELIST.join(', '));
    console.log('⚠️  If your IP is not in this list, login will be blocked');
}

console.log('\n🔧 Troubleshooting Steps:');
console.log('========================');
console.log('1. Try logging in with the credentials above');
console.log('2. If that doesn\'t work, check your Railway environment variables');
console.log('3. Make sure ADMIN_USERNAME and ADMIN_PASSWORD are set in Railway');
console.log('4. Check if ADMIN_IP_WHITELIST is blocking your IP address');
console.log('5. Restart the server after updating environment variables');

console.log('\n🌐 Admin Login URLs:');
console.log('====================');
console.log('Local: http://localhost:3001/admin/login');
console.log('Live: https://lyricartstudio.shop/admin/login');

console.log('\n📝 To fix IP restrictions in Railway:');
console.log('====================================');
console.log('1. Go to Railway Dashboard');
console.log('2. Navigate to your project');
console.log('3. Go to "Variables" tab');
console.log('4. Set ADMIN_IP_WHITELIST=* (to allow all IPs)');
console.log('5. Or add your IP: ADMIN_IP_WHITELIST=127.0.0.1,::1,your_ip_here');
console.log('6. Restart the server'); 