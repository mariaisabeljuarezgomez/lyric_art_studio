#!/usr/bin/env node

/**
 * Simple PayPal Capture Test
 * Tests the exact capture functionality that's failing
 */

require('dotenv').config();

const fetch = require('node-fetch');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
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

// Test PayPal access token
async function testPayPalToken() {
    log('🔑 Testing PayPal access token...', 'cyan');
    
    const isSandbox = process.env.NODE_ENV !== 'production';
    const baseUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    
    try {
        const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
        
        const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            const errorText = await response.text();
            logError(`Token request failed: ${response.status} ${response.statusText}`);
            logError(`Error: ${errorText}`);
            return null;
        }

        const data = await response.json();
        logSuccess(`Access token obtained: ${data.access_token.substring(0, 20)}...`);
        return data.access_token;
    } catch (error) {
        logError(`Token request error: ${error.message}`);
        return null;
    }
}

// Test order creation
async function testOrderCreation() {
    log('🛒 Testing order creation...', 'cyan');
    
    try {
        const response = await fetch('http://localhost:3001/api/payment/create-paypal-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: [
                    {
                        title: "Test Design",
                        format: "SVG",
                        price: 3.00,
                        quantity: 1
                    }
                ],
                total: 3.00
            })
        });

        log(`Response status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            logSuccess(`Order created: ${data.order?.id}`);
            return data.order?.id;
        } else {
            const errorText = await response.text();
            logError(`Order creation failed: ${errorText}`);
            return null;
        }
    } catch (error) {
        logError(`Order creation error: ${error.message}`);
        return null;
    }
}

// Test direct PayPal capture (bypassing your server)
async function testDirectCapture(orderId, accessToken) {
    log('💳 Testing direct PayPal capture...', 'cyan');
    
    const isSandbox = process.env.NODE_ENV !== 'production';
    const baseUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    
    try {
        const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'PayPal-Request-Id': `test_capture_${Date.now()}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({})
        });

        log(`Capture response status: ${response.status}`);
        log(`Capture response headers:`, Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const data = await response.json();
            logSuccess(`Direct capture successful: ${data.id}`);
            log(`Capture status: ${data.status}`);
            return data;
        } else {
            const errorText = await response.text();
            logError(`Direct capture failed: ${errorText}`);
            return null;
        }
    } catch (error) {
        logError(`Direct capture error: ${error.message}`);
        return null;
    }
}

// Test your server's capture endpoint
async function testServerCapture(orderId) {
    log('🖥️  Testing server capture endpoint...', 'cyan');
    
    try {
        const response = await fetch('http://localhost:3001/api/payment/capture-paypal-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderId })
        });

        log(`Server capture response status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            logSuccess(`Server capture successful: ${data.capture?.id}`);
            return data;
        } else {
            const errorText = await response.text();
            logError(`Server capture failed: ${errorText}`);
            return null;
        }
    } catch (error) {
        logError(`Server capture error: ${error.message}`);
        return null;
    }
}

// Main test function
async function runTests() {
    log('🚀 Starting PayPal Capture Tests...', 'cyan');
    log('');
    
    // Test 1: Get access token
    const accessToken = await testPayPalToken();
    if (!accessToken) {
        logError('Cannot proceed without access token');
        return;
    }
    
    log('');
    
    // Test 2: Create order
    const orderId = await testOrderCreation();
    if (!orderId) {
        logError('Cannot proceed without order ID');
        return;
    }
    
    log('');
    
    // Test 3: Test direct PayPal capture
    const directCapture = await testDirectCapture(orderId, accessToken);
    
    log('');
    
    // Test 4: Test your server's capture endpoint
    const serverCapture = await testServerCapture(orderId);
    
    log('');
    log('📊 Test Summary:', 'cyan');
    log(`  Order ID: ${orderId}`);
    log(`  Direct Capture: ${directCapture ? '✅ Success' : '❌ Failed'}`);
    log(`  Server Capture: ${serverCapture ? '✅ Success' : '❌ Failed'}`);
    
    if (!directCapture && !serverCapture) {
        logError('Both direct and server capture failed - this indicates a PayPal API issue');
    } else if (directCapture && !serverCapture) {
        logError('Direct capture works but server capture fails - this indicates a server-side issue');
    } else if (!directCapture && serverCapture) {
        logError('Server capture works but direct capture fails - this is unexpected');
    } else {
        logSuccess('Both capture methods work correctly');
    }
}

// Run the tests
if (require.main === module) {
    runTests().catch(error => {
        logError(`Test failed: ${error.message}`);
        process.exit(1);
    });
} 