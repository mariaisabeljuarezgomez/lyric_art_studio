// Debug script to test wishlist functionality
const fetch = require('node-fetch');

async function testWishlistAPI() {
    const baseUrl = 'https://lyricartstudio.shop'; // Change this to your production URL
    
    console.log('🔍 Testing wishlist API...');
    console.log('Base URL:', baseUrl);
    
    try {
        // Test 1: Check if the site is accessible
        console.log('\n📡 Test 1: Checking site accessibility...');
        const siteResponse = await fetch(baseUrl);
        console.log('Site status:', siteResponse.status);
        
        // Test 2: Check authentication status
        console.log('\n🔐 Test 2: Checking authentication status...');
        const authResponse = await fetch(`${baseUrl}/api/auth/status`, {
            credentials: 'include'
        });
        console.log('Auth status:', authResponse.status);
        
        if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log('Auth data:', authData);
        }
        
        // Test 3: Test wishlist API
        console.log('\n🎯 Test 3: Testing wishlist API...');
        const wishlistResponse = await fetch(`${baseUrl}/api/wishlist`, {
            credentials: 'include'
        });
        console.log('Wishlist status:', wishlistResponse.status);
        
        if (wishlistResponse.ok) {
            const wishlistData = await wishlistResponse.json();
            console.log('Wishlist data:', wishlistData);
        } else {
            const errorText = await wishlistResponse.text();
            console.log('Wishlist error:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Error during testing:', error);
    }
}

// Run the test
testWishlistAPI(); 