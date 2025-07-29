const http = require('http');

http.get('http://localhost:3001/api/designs', (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            const design229 = jsonData.designs.find(design => design.id === 229);
            
            if (design229) {
                console.log('✅ Found design ID 229:');
                console.log('   Artist:', design229.artist);
                console.log('   Song:', design229.song);
                console.log('   Price:', design229.price);
                
                if (design229.price === 0.5) {
                    console.log('✅ LOCAL API IS SERVING CORRECT PRICE!');
                } else {
                    console.log('❌ LOCAL API IS SERVING WRONG PRICE!');
                }
            } else {
                console.log('❌ Design ID 229 not found in local API');
            }
        } catch (error) {
            console.error('Error parsing JSON:', error.message);
        }
    });
}).on('error', (error) => {
    console.error('Error:', error.message);
}); 