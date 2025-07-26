#!/usr/bin/env node

/**
 * PayPal Credentials Checker
 * Checks if your PayPal credentials are valid without exposing them
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

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Check credential format
function checkCredentialFormat() {
    log('🔍 Checking credential format...', 'cyan');
    
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const nodeEnv = process.env.NODE_ENV;
    
    log(`Environment: ${nodeEnv || 'Not set'}`);
    
    if (!clientId) {
        logError('PAYPAL_CLIENT_ID is not set');
        return false;
    }
    
    if (!clientSecret) {
        logError('PAYPAL_CLIENT_SECRET is not set');
        return false;
    }
    
    // Check client ID format
    if (clientId.startsWith('Ae')) {
        logSuccess('Client ID format: SANDBOX (starts with Ae)');
    } else if (clientId.startsWith('AQ')) {
        logSuccess('Client ID format: LIVE (starts with AQ)');
    } else {
        logWarning(`Client ID format: Unknown (starts with ${clientId.substring(0, 2)})`);
    }
    
    // Check client secret length
    if (clientSecret.length >= 20) {
        logSuccess(`Client Secret length: ${clientSecret.length} characters (looks good)`);
    } else {
        logWarning(`Client Secret length: ${clientSecret.length} characters (might be too short)`);
    }
    
    // Check environment consistency
    const isSandbox = nodeEnv !== 'production';
    const clientIdIsSandbox = clientId.startsWith('Ae');
    
    if (isSandbox && clientIdIsSandbox) {
        logSuccess('Environment and credentials match: SANDBOX');
    } else if (!isSandbox && !clientIdIsSandbox) {
        logSuccess('Environment and credentials match: LIVE');
    } else {
        logError('Environment and credentials mismatch!');
        log(`  NODE_ENV: ${nodeEnv} (${isSandbox ? 'sandbox' : 'live'})`);
        log(`  Client ID: ${clientIdIsSandbox ? 'sandbox' : 'live'}`);
        return false;
    }
    
    return true;
}

// Test credentials with PayPal API
async function testCredentials() {
    log('🔑 Testing credentials with PayPal API...', 'cyan');
    
    const isSandbox = process.env.NODE_ENV !== 'production';
    const baseUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    
    log(`Testing against: ${baseUrl}`);
    
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

        if (response.ok) {
            const data = await response.json();
            logSuccess('Credentials are valid!');
            log(`Token expires in: ${data.expires_in} seconds`);
            return true;
        } else {
            const errorData = await response.json();
            logError(`Credentials are invalid: ${errorData.error}`);
            logError(`Error description: ${errorData.error_description}`);
            
            // Provide specific guidance based on error
            if (errorData.error === 'invalid_client') {
                logWarning('This usually means:');
                log('  1. Client ID or Secret is incorrect');
                log('  2. You\'re using sandbox credentials with live API or vice versa');
                log('  3. Credentials have been revoked or expired');
            }
            
            return false;
        }
    } catch (error) {
        logError(`Network error: ${error.message}`);
        return false;
    }
}

// Main function
async function checkCredentials() {
    log('🚀 PayPal Credentials Checker', 'cyan');
    log('');
    
    // Check format first
    const formatOk = checkCredentialFormat();
    if (!formatOk) {
        logError('Credential format check failed');
        return;
    }
    
    log('');
    
    // Test with PayPal API
    const apiOk = await testCredentials();
    
    log('');
    log('📊 Summary:', 'cyan');
    log(`  Format Check: ${formatOk ? '✅ Pass' : '❌ Fail'}`);
    log(`  API Test: ${apiOk ? '✅ Pass' : '❌ Fail'}`);
    
    if (formatOk && apiOk) {
        logSuccess('Your PayPal credentials are working correctly!');
    } else {
        logError('Your PayPal credentials need to be fixed.');
        log('');
        log('🔧 Next Steps:', 'cyan');
        log('  1. Go to PayPal Developer Dashboard');
        log('  2. Check if you\'re using the right environment (sandbox vs live)');
        log('  3. Generate new credentials if needed');
        log('  4. Update your .env file with the correct credentials');
    }
}

// Run the check
if (require.main === module) {
    checkCredentials().catch(error => {
        logError(`Check failed: ${error.message}`);
        process.exit(1);
    });
} 