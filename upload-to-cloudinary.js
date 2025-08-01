const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary (replace with your credentials)
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

// Function to upload all design images
async function uploadAllDesigns() {
  const designsDir = path.join(__dirname, 'images', 'designs');
  const uploadResults = [];

  // Read all design folders
  const designFolders = fs.readdirSync(designsDir);
  
  for (const folder of designFolders) {
    const folderPath = path.join(designsDir, folder);
    const stats = fs.statSync(folderPath);
    
    if (stats.isDirectory()) {
      console.log(`📁 Processing folder: ${folder}`);
      
      // Read all images in the folder
      const files = fs.readdirSync(folderPath);
      const imageFiles = files.filter(file => 
        file.endsWith('.webp') || file.endsWith('.png') || file.endsWith('.jpg')
      );
      
      for (const imageFile of imageFiles) {
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
    }
  }
  
  // Save results to JSON file
  const resultsFile = path.join(__dirname, 'cloudinary-uploads.json');
  fs.writeFileSync(resultsFile, JSON.stringify(uploadResults, null, 2));
  console.log(`\n📊 Upload complete! Results saved to: ${resultsFile}`);
  console.log(`✅ Total uploaded: ${uploadResults.length} images`);
  
  return uploadResults;
}

// Run the upload
if (require.main === module) {
  uploadAllDesigns().catch(console.error);
}

module.exports = { uploadImage, uploadAllDesigns }; 