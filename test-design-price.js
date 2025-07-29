const fetch = require('node-fetch');

async function testDesignPrice() {
    try {
        console.log('🔍 Testing design price from API...');
        
        // Test the API endpoint
        const response = await fetch('http://localhost:3001/api/designs');
        const data = await response.json();
        
        console.log('📊 API Response Status:', response.status);
        console.log('📊 Total designs in API:', data.designs.length);
        
        // Find design ID 229
        const design229 = data.designs.find(design => design.id === 229);
        
        if (design229) {
            console.log('✅ Found design ID 229:');
            console.log('   Artist:', design229.artist);
            console.log('   Song:', design229.song);
            console.log('   Price:', design229.price);
            console.log('   Expected price: 0.5');
            
            if (design229.price === 0.5) {
                console.log('✅ PRICE IS CORRECT!');
            } else {
                console.log('❌ PRICE IS WRONG! Expected 0.5, got:', design229.price);
            }
        } else {
            console.log('❌ Design ID 229 not found in API response');
        }
        
        // Also check the JSON file directly
        console.log('\n🔍 Checking JSON file directly...');
        const fs = require('fs');
        const jsonData = JSON.parse(fs.readFileSync('designs-database.json', 'utf8'));
        const directDesign229 = jsonData.designs.find(design => design.id === 229);
        
        if (directDesign229) {
            console.log('✅ Found design ID 229 in JSON file:');
            console.log('   Price in JSON file:', directDesign229.price);
        } else {
            console.log('❌ Design ID 229 not found in JSON file');
        }
        
    } catch (error) {
        console.error('❌ Error testing design price:', error);
    }
}

testDesignPrice(); 