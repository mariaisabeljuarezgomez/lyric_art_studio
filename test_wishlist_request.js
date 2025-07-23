// Test script to debug wishlist request
const fetch = require('node-fetch');

async function testWishlistRequest() {
    try {
        console.log('🧪 Testing wishlist request...');
        
        const designId = 'elvis-hunk-of-burning-love-guitar';
        const requestBody = { designId };
        
        console.log('📤 Request body:', JSON.stringify(requestBody));
        
        const response = await fetch('http://localhost:3001/api/wishlist/add', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': 'connect.sid=VfbFht4Os6VGU4wvmU6o-iW-2ayq0pbo'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📥 Response status:', response.status);
        const data = await response.text();
        console.log('📥 Response body:', data);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testWishlistRequest(); 