const fs = require('fs');

// Read the JSON file directly
const data = JSON.parse(fs.readFileSync('designs-database.json', 'utf8'));

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
    console.log('❌ Design ID 229 not found in JSON file');
}

// Also check a few other designs to see their prices
console.log('\n📊 Sample of other designs:');
data.designs.slice(0, 5).forEach(design => {
    console.log(`   ID ${design.id}: ${design.artist} - ${design.song} = $${design.price}`);
}); 