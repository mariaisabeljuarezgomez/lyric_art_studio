console.log('🔍 Registration Form Debug');
console.log('==========================');

// Test the registration form functionality
async function testRegistrationForm() {
    try {
        console.log('📝 Testing registration form submission...');
        
        // Simulate form data
        const formData = {
            name: 'Debug Test User',
            email: 'debug-test@lyricartstudio.com',
            password: 'test123456'
        };
        
        console.log('📧 Form data:', formData);
        
        // Test the API call
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📊 Response body:', responseText);
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ Registration successful!');
                console.log('📊 User data:', data);
            } catch (e) {
                console.log('⚠️ Response is not valid JSON');
            }
        } else {
            console.log('❌ Registration failed');
            console.log('❌ Error details:', responseText);
        }
        
    } catch (error) {
        console.error('💥 Error in registration form:', error);
    }
}

// Test notification function
function testNotification() {
    console.log('🔔 Testing notification system...');
    
    // Test success notification
    showNotification('Test success message', 'success');
    
    // Test error notification
    setTimeout(() => {
        showNotification('Test error message', 'error');
    }, 2000);
}

// Check if required elements exist
function checkFormElements() {
    console.log('🔍 Checking form elements...');
    
    const form = document.getElementById('registerForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const notification = document.getElementById('notification');
    
    console.log('📋 Form elements found:');
    console.log('   Form:', !!form);
    console.log('   Name input:', !!nameInput);
    console.log('   Email input:', !!emailInput);
    console.log('   Password input:', !!passwordInput);
    console.log('   Confirm password input:', !!confirmPasswordInput);
    console.log('   Notification div:', !!notification);
    
    if (!form || !nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
        console.error('❌ Missing required form elements!');
        return false;
    }
    
    console.log('✅ All form elements found');
    return true;
}

// Main debug function
function debugRegistration() {
    console.log('🚀 Starting registration debug...\n');
    
    // Check form elements
    const elementsOk = checkFormElements();
    
    if (elementsOk) {
        // Test notification system
        testNotification();
        
        // Test API call
        setTimeout(() => {
            testRegistrationForm();
        }, 3000);
    } else {
        console.error('❌ Cannot proceed - missing form elements');
    }
}

// Run debug when page loads
if (typeof window !== 'undefined') {
    // This will run in the browser
    window.debugRegistration = debugRegistration;
    console.log('🔧 Debug function loaded. Run debugRegistration() in console to test.');
} else {
    // This will run in Node.js
    debugRegistration();
} 