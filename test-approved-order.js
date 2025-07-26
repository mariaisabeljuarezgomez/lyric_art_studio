#!/usr/bin/env node

/**
 * Test Approved Order Capture
 * This simulates capturing an order that has been approved by the user
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

// Create an order and get the approval URL
async function createOrderWithApproval() {
    log('🛒 Creating order with approval URL...', 'cyan');
    
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

        if (response.ok) {
            const data = await response.json();
            logSuccess(`Order created: ${data.order?.id}`);
            
            // Find the approval link
            const approvalLink = data.order?.links?.find(link => link.rel === 'approve');
            if (approvalLink) {
                logSuccess(`Approval URL: ${approvalLink.href}`);
                logInfo('To test the full flow:');
                log('  1. Open this URL in your browser');
                log('  2. Complete the payment on PayPal');
                log('  3. You\'ll be redirected back with an approved order');
                log('  4. Then the capture should work');
            }
            
            return data.order;
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

// Test capturing a specific order (you can provide an order ID from a completed payment)
async function testCaptureSpecificOrder(orderId) {
    if (!orderId) {
        logInfo('No order ID provided. Creating a new order for testing...');
        const order = await createOrderWithApproval();
        return;
    }
    
    log(`💳 Testing capture of specific order: ${orderId}`, 'cyan');
    
    try {
        const response = await fetch('http://localhost:3001/api/payment/capture-paypal-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderId })
        });

        log(`Capture response status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            logSuccess(`Capture successful: ${data.capture?.id}`);
            log(`Capture status: ${data.capture?.status}`);
            return data;
        } else {
            const errorText = await response.text();
            logError(`Capture failed: ${errorText}`);
            return null;
        }
    } catch (error) {
        logError(`Capture error: ${error.message}`);
        return null;
    }
}

// Main function
async function runTest() {
    log('🚀 Testing Approved Order Flow...', 'cyan');
    log('');
    
    // Get order ID from command line argument or create new order
    const orderId = process.argv[2];
    
    if (orderId) {
        await testCaptureSpecificOrder(orderId);
    } else {
        await createOrderWithApproval();
    }
    
    log('');
    log('💡 Instructions for testing:', 'cyan');
    log('  1. Run this script to get an approval URL');
    log('  2. Open the approval URL in your browser');
    log('  3. Complete the payment on PayPal');
    log('  4. Note the order ID from the redirect URL');
    log('  5. Run: node test-approved-order.js <ORDER_ID>');
}

// Run the test
if (require.main === module) {
    runTest().catch(error => {
        logError(`Test failed: ${error.message}`);
        process.exit(1);
    });
} 