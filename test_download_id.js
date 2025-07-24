const fs = require('fs');

// Function to get numeric design ID from folder name (copied from server)
const getNumericDesignId = async (folderName) => {
    try {
        // Load the designs database
        const designsData = JSON.parse(fs.readFileSync('designs-database.json', 'utf8'));
        
        // Find the design by folder name in the image path
        const design = designsData.designs.find(d => {
            if (d.image) {
                const pathParts = d.image.split('/');
                if (pathParts.length >= 3) {
                    return pathParts[2] === folderName;
                }
            }
            return false;
        });
        
        if (design) {
            console.log(`✅ Found design ID ${design.id} for folder "${folderName}"`);
            return design.id.toString();
        }
        
        // Fallback: return the folder name if no match found
        console.log(`⚠️ No design found for folder "${folderName}", using folder name as ID`);
        return folderName;
    } catch (error) {
        console.error('❌ Error getting numeric design ID:', error);
        return folderName; // Fallback to original folder name
    }
};

// Test the function
async function test() {
    console.log('🔍 Testing getNumericDesignId function...');
    
    const result = await getNumericDesignId('jake-owen-made-for-you-guitar');
    console.log(`📊 Result: ${result}`);
    
    // Also test frank-sinatra-new-york-piano
    const result2 = await getNumericDesignId('frank-sinatra-new-york-piano');
    console.log(`📊 Result for frank-sinatra: ${result2}`);
    
    // Test ac-dc-highway-to-hell-guitar
    const result3 = await getNumericDesignId('ac-dc-highway-to-hell-guitar');
    console.log(`📊 Result for ac-dc: ${result3}`);
}

test().catch(console.error); 