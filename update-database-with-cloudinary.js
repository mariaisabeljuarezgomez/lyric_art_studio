const fs = require('fs');
const path = require('path');

// Function to update database with Cloudinary URLs
function updateDatabaseWithCloudinary() {
  try {
    // Read the current database
    const databasePath = path.join(__dirname, 'designs-database.json');
    const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));

    // Read Cloudinary upload results (you'll need to run the upload script first)
    const cloudinaryResultsPath = path.join(__dirname, 'cloudinary-uploads.json');

    if (!fs.existsSync(cloudinaryResultsPath)) {
      console.log('❌ cloudinary-uploads.json not found. Please run upload-to-cloudinary.js first.');
      return;
    }

    const cloudinaryResults = JSON.parse(fs.readFileSync(cloudinaryResultsPath, 'utf8'));

    // Create a mapping of original paths to Cloudinary URLs
    const urlMapping = {};
    cloudinaryResults.forEach(result => {
      // Extract the relative path from the full path and normalize to forward slashes
      const relativePath = path.relative(path.join(__dirname, 'images'), result.originalPath);
      const normalizedPath = relativePath.replace(/\\/g, '/'); // Convert backslashes to forward slashes
      urlMapping[normalizedPath] = result.cloudinaryUrl;
    });

    console.log(`📊 Found ${Object.keys(urlMapping).length} Cloudinary URLs`);

    // Update database entries - handle the "designs" array structure
    let updatedCount = 0;
    database.designs.forEach(design => {
      if (design.image && urlMapping[design.image]) {
        const oldImage = design.image;
        design.image = urlMapping[design.image];
        design.webp = urlMapping[design.image]; // Update webp field too

        console.log(`✅ Updated: ${oldImage} → ${design.image}`);
        updatedCount++;
      } else if (design.image) {
        console.log(`❌ No Cloudinary URL found for: ${design.image}`);
      }
    });

    // Save updated database
    fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));
    console.log(`\n📊 Database updated! ${updatedCount} designs now use Cloudinary URLs`);

  } catch (error) {
    console.error('❌ Error updating database:', error);
  }
}

// Function to create a backup before updating
function createBackup() {
  const databasePath = path.join(__dirname, 'designs-database.json');
  const backupPath = path.join(__dirname, 'designs-database-backup.json');

  if (fs.existsSync(databasePath)) {
    fs.copyFileSync(databasePath, backupPath);
    console.log(`📦 Backup created: ${backupPath}`);
  }
}

// Run the update
if (require.main === module) {
  console.log('🔄 Creating backup...');
  createBackup();

  console.log('🔄 Updating database with Cloudinary URLs...');
  updateDatabaseWithCloudinary();
}

module.exports = { updateDatabaseWithCloudinary, createBackup }; 