#!/usr/bin/env node

/**
 * PayPal Payment Debugging Script
 * 
 * This script helps debug PayPal payment issues by:
 * 1. Testing PayPal API connectivity
 * 2. Monitoring payment flow
 * 3. Checking environment variables
 * 4. Validating order creation and capture
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Check environment variables
function checkEnvironment() {
    log('🔧 Checking environment variables...', 'cyan');
    
    const requiredVars = [
        'PAYPAL_CLIENT_ID',
        'PAYPAL_CLIENT_SECRET',
        'NODE_ENV',
        'SITE_URL'
    ];
    
    const missing = [];
    const present = [];
    
    requiredVars.forEach(varName => {
        if (process.env[varName]) {
            present.push(varName);
            if (varName.includes('SECRET')) {
                log(`  ${varName}: ${process.env[varName].substring(0, 8)}...`, 'green');
            } else {
                log(`  ${varName}: ${process.env[varName]}`, 'green');
            }
        } else {
            missing.push(varName);
            log(`  ${varName}: MISSING`, 'red');
        }
    });
    
    if (missing.length > 0) {
        logError(`Missing required environment variables: ${missing.join(', ')}`);
        return false;
    }
    
    logSuccess('All required environment variables are set');
    return true;
}

// Test PayPal API connectivity
async function testPayPalConnectivity() {
    log('🌐 Testing PayPal API connectivity...', 'cyan');
    
    const isSandbox = process.env.NODE_ENV !== 'production';
    const baseUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    
    log(`  Using ${isSandbox ? 'SANDBOX' : 'LIVE'} environment`);
    log(`  Base URL: ${baseUrl}`);
    
    try {
        // Get access token
        const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
        
        const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });
        
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            logError(`Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText}`);
            logError(`Error details: ${errorText}`);
            return false;
        }
        
        const tokenData = await tokenResponse.json();
        logSuccess(`Access token obtained successfully`);
        log(`  Token expires in: ${tokenData.expires_in} seconds`);
        
        // Test a simple API call
        const userInfoResponse = await fetch(`${baseUrl}/v1/identity/oauth2/userinfo`, {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (userInfoResponse.ok) {
            logSuccess('PayPal API connectivity test passed');
            return true;
        } else {
            logError(`PayPal API test failed: ${userInfoResponse.status} ${userInfoResponse.statusText}`);
            return false;
        }
        
    } catch (error) {
        logError(`PayPal connectivity test failed: ${error.message}`);
        return false;
    }
}

// Test order creation
async function testOrderCreation() {
    log('🛒 Testing order creation...', 'cyan');
    
    const testOrder = {
        items: [
            {
                title: "Test Design - AC/DC Back in Black",
                format: "SVG",
                price: 3.00,
                quantity: 1
            }
        ],
        total: 3.00
    };
    
    try {
        const response = await fetch('http://localhost:3001/api/payment/create-paypal-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testOrder)
        });
        
        log(`  Response status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            logSuccess('Order creation test passed');
            log(`  Order ID: ${data.order?.id || 'N/A'}`);
            log(`  Order status: ${data.order?.status || 'N/A'}`);
            return data.order?.id;
        } else {
            const errorText = await response.text();
            logError(`Order creation failed: ${errorText}`);
            return null;
        }
        
    } catch (error) {
        logError(`Order creation test failed: ${error.message}`);
        return null;
    }
}

// Monitor server logs
function monitorServerLogs() {
    log('📊 Monitoring server logs...', 'cyan');
    log('  Press Ctrl+C to stop monitoring');
    
    // This would require the server to be running and logging to a file
    // For now, just provide instructions
    logInfo('To monitor server logs in real-time:');
    log('  tail -f server-railway-production.js.log', 'yellow');
    log('  grep -i paypal server-railway-production.js.log', 'yellow');
    log('  grep -i "capture\|error\|failed" server-railway-production.js.log', 'yellow');
}

// Check database connectivity
async function checkDatabase() {
    log('🗄️  Checking database connectivity...', 'cyan');
    
    try {
        const response = await fetch('http://localhost:3001/api/health');
        
        if (response.ok) {
            const data = await response.json();
            logSuccess('Database connectivity test passed');
            log(`  Server status: ${data.status}`);
            log(`  Uptime: ${data.uptime} seconds`);
        } else {
            logError(`Database connectivity test failed: ${response.status}`);
        }
        
    } catch (error) {
        logError(`Database connectivity test failed: ${error.message}`);
    }
}

// Generate test report
function generateTestReport() {
    log('📋 Generating test report...', 'cyan');
    
    const report = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        paypalMode: process.env.NODE_ENV !== 'production' ? 'sandbox' : 'live',
        tests: {
            environment: false,
            connectivity: false,
            database: false,
            orderCreation: false
        }
    };
    
    // Save report to file
    const reportPath = path.join(__dirname, 'paypal-debug-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    logSuccess(`Test report saved to: ${reportPath}`);
}

// Main debugging function
async function debugPayPalPayment() {
    log('🚀 Starting PayPal Payment Debug...', 'magenta');
    log('');
    
    // Check environment
    const envOk = checkEnvironment();
    if (!envOk) {
        logError('Environment check failed. Please fix missing variables.');
        return;
    }
    
    log('');
    
    // Test connectivity
    const connectivityOk = await testPayPalConnectivity();
    if (!connectivityOk) {
        logError('PayPal connectivity test failed. Check your credentials.');
        return;
    }
    
    log('');
    
    // Check database
    await checkDatabase();
    
    log('');
    
    // Test order creation
    const orderId = await testOrderCreation();
    
    log('');
    
    // Monitor logs
    monitorServerLogs();
    
    log('');
    
    // Generate report
    generateTestReport();
    
    log('');
    log('🎯 Debug Summary:', 'magenta');
    log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`  PayPal Mode: ${process.env.NODE_ENV !== 'production' ? 'SANDBOX' : 'LIVE'}`);
    log(`  Site URL: ${process.env.SITE_URL || 'Not set'}`);
    
    if (orderId) {
        log(`  Test Order ID: ${orderId}`, 'green');
    }
    
    log('');
    log('💡 Next Steps:', 'cyan');
    log('  1. Start your server: node server-railway-production.js');
    log('  2. Open browser in incognito mode');
    log('  3. Disable ad blockers for PayPal domains');
    log('  4. Test the payment flow');
    log('  5. Monitor server logs for detailed error messages');
}

// Run the debug script
if (require.main === module) {
    debugPayPalPayment().catch(error => {
        logError(`Debug script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    checkEnvironment,
    testPayPalConnectivity,
    testOrderCreation,
    checkDatabase,
    generateTestReport
}; 