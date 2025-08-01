// Load environment variables
require('dotenv').config();

const DesignUploadProcessor = require('./design-upload-processor');

async function testCloudinaryIntegration() {
    console.log('🧪 Testing Cloudinary integration...');
    
    try {
        // Create an instance of the processor
        const processor = new DesignUploadProcessor();
        
        // Test Cloudinary configuration
        console.log('📋 Checking Cloudinary configuration...');
        console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING');
        console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING');
        console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING');
        
        // Test if we can access a sample image
        const fs = require('fs').promises;
        const path = require('path');
        
        // Look for a sample WebP file in images/designs
        const designsPath = path.join(__dirname, 'images', 'designs');
        
        try {
            const folders = await fs.readdir(designsPath);
            if (folders.length > 0) {
                const firstFolder = folders[0];
                const webpPath = path.join(designsPath, firstFolder, `${firstFolder}.webp`);
                
                try {
                    await fs.access(webpPath);
                    console.log(`✅ Found test image: ${webpPath}`);
                    
                    // Test Cloudinary upload
                    console.log('☁️ Testing Cloudinary upload...');
                    const cloudinaryUrl = await processor.uploadToCloudinary(firstFolder);
                    
                    if (cloudinaryUrl) {
                        console.log(`✅ Cloudinary upload successful: ${cloudinaryUrl}`);
                        
                        // Test database update
                        console.log('💾 Testing database update...');
                        await processor.updateDatabaseWithCloudinaryUrl(1, cloudinaryUrl);
                        console.log('✅ Database update successful');
                        
                    } else {
                        console.log('⚠️ Cloudinary upload failed or credentials not configured');
                    }
                    
                } catch (error) {
                    console.log(`❌ Test image not found: ${webpPath}`);
                }
            } else {
                console.log('❌ No design folders found for testing');
            }
        } catch (error) {
            console.log('❌ Could not access designs directory:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testCloudinaryIntegration(); 