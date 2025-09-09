const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Function to update database with Cloudinary URLs
async function updateDatabaseWithCloudinary() {
  const client = new Client({
    connectionString: 'postgresql://postgres:OCrMfnkeqCuKljjsbXJVzpVqXnEFMwAG@nozomi.proxy.rlwy.net:18246/railway'
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Read Cloudinary upload results
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
      
      // Also create a mapping for .webp files (database has .webp, but Cloudinary has .png)
      const webpPath = normalizedPath.replace(/\.png$/, '.webp');
      urlMapping[webpPath] = result.cloudinaryUrl;
    });

    console.log(`📊 Found ${Object.keys(urlMapping).length} Cloudinary URLs`);

    // Get all designs from database
    const result = await client.query('SELECT design_id, image_url FROM designs');
    const designs = result.rows;

    console.log(`📊 Found ${designs.length} designs in database`);

    // Update each design with Cloudinary URL
    let updatedCount = 0;
    for (const design of designs) {
      if (design.image_url) {
        // Remove the "images/" prefix from the database path to match the Cloudinary mapping
        const pathWithoutImages = design.image_url.replace(/^images\//, '');
        
        if (urlMapping[pathWithoutImages]) {
          const newImageUrl = urlMapping[pathWithoutImages];
          
          await client.query(
            'UPDATE designs SET image_url = $1 WHERE design_id = $2',
            [newImageUrl, design.design_id]
          );

          console.log(`✅ Updated design ${design.design_id}: ${design.image_url} → ${newImageUrl}`);
          updatedCount++;
        } else {
          console.log(`❌ No Cloudinary URL found for design ${design.design_id}: ${design.image_url} (looked for: ${pathWithoutImages})`);
        }
      }
    }

    console.log(`\n📊 Database updated! ${updatedCount} designs now use Cloudinary URLs`);

  } catch (error) {
    console.error('❌ Error updating database:', error);
  } finally {
    await client.end();
  }
}

// Run the update
if (require.main === module) {
  console.log('🔄 Updating database with Cloudinary URLs...');
  updateDatabaseWithCloudinary();
}

module.exports = { updateDatabaseWithCloudinary }; 