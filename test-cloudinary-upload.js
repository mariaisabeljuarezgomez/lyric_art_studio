const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dtp1z8lne',
  api_key: '677745198117524',
  api_secret: 'Dypa29eKiehRY3FKci1sW0YrkAo'
});

// Function to upload a single image
async function uploadImage(filePath, folderName) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `lyric-art-studio/${folderName}`,
      public_id: path.basename(filePath, path.extname(filePath)),
      overwrite: true
    });
    console.log(`✅ Uploaded: ${filePath} → ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Failed to upload ${filePath}:`, error.message);
    return null;
  }
}

// Function to test upload with just a few images
async function testUpload() {
  const designsDir = path.join(__dirname, 'images', 'designs');
  const uploadResults = [];
  
  // Test with just 3 folders to make sure it works
  const testFolders = ['led-zeppelin-stairway-to-heaven-guitar', 'the-eagles-hotel-california-guitar', 'the-beatles-hey-jude-guitar'];
  
  for (const folder of testFolders) {
    const folderPath = path.join(designsDir, folder);
    
    if (fs.existsSync(folderPath)) {
      console.log(`📁 Testing folder: ${folder}`);
      
      // Read all images in the folder
      const files = fs.readdirSync(folderPath);
      const imageFiles = files.filter(file => 
        file.endsWith('.webp') || file.endsWith('.png') || file.endsWith('.jpg')
      );
      
      // Only upload the first image from each folder for testing
      if (imageFiles.length > 0) {
        const imageFile = imageFiles[0];
        const imagePath = path.join(folderPath, imageFile);
        const url = await uploadImage(imagePath, folder);
        
        if (url) {
          uploadResults.push({
            originalPath: imagePath,
            cloudinaryUrl: url,
            folder: folder,
            filename: imageFile
          });
        }
      }
    } else {
      console.log(`⚠️  Folder not found: ${folder}`);
    }
  }
  
  // Save test results
  const resultsFile = path.join(__dirname, 'cloudinary-test-uploads.json');
  fs.writeFileSync(resultsFile, JSON.stringify(uploadResults, null, 2));
  console.log(`\n📊 Test upload complete! Results saved to: ${resultsFile}`);
  console.log(`✅ Total test uploaded: ${uploadResults.length} images`);
  
  return uploadResults;
}

// Run the test
if (require.main === module) {
  console.log('🧪 Testing Cloudinary upload with a few images...');
  testUpload().catch(console.error);
}

module.exports = { uploadImage, testUpload }; 