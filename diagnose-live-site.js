#!/usr/bin/env node

/**
 * DIAGNOSTIC SCRIPT FOR LIVE SITE PAYMENT ISSUES
 * This script will help identify what's wrong with the payment system on the live site
 */

console.log('🔍 DIAGNOSING LIVE SITE PAYMENT ISSUES');
console.log('=====================================\n');

// Check environment variables
console.log('📋 ENVIRONMENT VARIABLES CHECK:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('PORT:', process.env.PORT || 'NOT SET');
console.log('SITE_URL:', process.env.SITE_URL || 'NOT SET');

// PayPal Configuration
console.log('\n💳 PAYPAL CONFIGURATION:');
console.log('PAYPAL_CLIENT_ID exists:', !!process.env.PAYPAL_CLIENT_ID);
console.log('PAYPAL_CLIENT_SECRET exists:', !!process.env.PAYPAL_CLIENT_SECRET);
console.log('PAYPAL_WEBHOOK_ID exists:', !!process.env.PAYPAL_WEBHOOK_ID);

// OAuth Configuration
console.log('\n🔐 OAUTH CONFIGURATION:');
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('GITHUB_CLIENT_ID exists:', !!process.env.GITHUB_CLIENT_ID);
console.log('GITHUB_CLIENT_SECRET exists:', !!process.env.GITHUB_CLIENT_SECRET);

// Database Configuration
console.log('\n🗄️ DATABASE CONFIGURATION:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DB_HOST exists:', !!process.env.DB_HOST);
console.log('DB_USER exists:', !!process.env.DB_USER);
console.log('DB_PASSWORD exists:', !!process.env.DB_PASSWORD);
console.log('DB_NAME exists:', !!process.env.DB_NAME);

// Email Configuration
console.log('\n📧 EMAIL CONFIGURATION:');
console.log('EMAIL_HOST exists:', !!process.env.EMAIL_HOST);
console.log('EMAIL_PORT exists:', !!process.env.EMAIL_PORT);
console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);

// Determine PayPal environment
const isLocalhost = process.env.PORT === '3001' || process.env.PORT === '8080' || !process.env.PORT;
const useSandbox = process.env.NODE_ENV !== 'production' || isLocalhost;
const PAYPAL_BASE_URL = useSandbox 
    ? 'https://api-m.sandbox.paypal.com' 
    : 'https://api-m.paypal.com';

console.log('\n🎯 PAYPAL ENVIRONMENT DETERMINATION:');
console.log('isLocalhost:', isLocalhost);
console.log('useSandbox:', useSandbox);
console.log('PayPal Base URL:', PAYPAL_BASE_URL);
console.log('Expected Environment:', useSandbox ? 'SANDBOX' : 'LIVE');

// Check for critical issues
console.log('\n🚨 CRITICAL ISSUES CHECK:');

let criticalIssues = [];

if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    criticalIssues.push('❌ PayPal credentials missing - payments will fail');
}

if (process.env.NODE_ENV === 'production' && useSandbox) {
    criticalIssues.push('❌ Using SANDBOX PayPal on PRODUCTION - payments will fail');
}

if (!process.env.DATABASE_URL && (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME)) {
    criticalIssues.push('❌ Database configuration missing - server will crash');
}

if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    criticalIssues.push('❌ Email configuration missing - confirmation emails will fail');
}

if (criticalIssues.length === 0) {
    console.log('✅ No critical issues found');
} else {
    console.log('Critical issues found:');
    criticalIssues.forEach(issue => console.log(issue));
}

// Recommendations
console.log('\n💡 RECOMMENDATIONS:');

if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ NODE_ENV is not set to "production" - this may cause issues');
    console.log('   Set NODE_ENV=production on live server');
}

if (!process.env.SITE_URL) {
    console.log('⚠️ SITE_URL not set - PayPal return URLs may be incorrect');
    console.log('   Set SITE_URL=https://lyricartstudio.shop on live server');
}

if (useSandbox && process.env.NODE_ENV === 'production') {
    console.log('⚠️ Using sandbox PayPal on production - payments will not work');
    console.log('   Ensure you have LIVE PayPal credentials for production');
}

console.log('\n🔧 NEXT STEPS:');
console.log('1. Check Railway environment variables');
console.log('2. Ensure NODE_ENV=production on live server');
console.log('3. Verify PayPal LIVE credentials (not sandbox)');
console.log('4. Test PayPal authentication');
console.log('5. Check server logs for specific errors');

console.log('\n📞 FOR RAILWAY DEPLOYMENT:');
console.log('- Go to Railway Dashboard');
console.log('- Select your project');
console.log('- Go to Variables tab');
console.log('- Check all environment variables are set correctly');
console.log('- Redeploy if variables were changed');

console.log('\n✅ DIAGNOSIS COMPLETE'); 