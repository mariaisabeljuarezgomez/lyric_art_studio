const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Function to fix Railway database with correct Cloudinary URLs
async function fixRailwayDatabase() {
  const client = new Client({
    connectionString: 'postgresql://postgres:OCrMfnkeqCuKljjsbXJVzpVqXnEFMwAG@nozomi.proxy.rlwy.net:18246/railway'
  });

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL database');

    // Read Cloudinary upload results
    const cloudinaryResultsPath = path.join(__dirname, 'cloudinary-uploads.json');
    if (!fs.existsSync(cloudinaryResultsPath)) {
      console.log('❌ cloudinary-uploads.json not found. Please run upload-to-cloudinary.js first.');
      return;
    }

    const cloudinaryResults = JSON.parse(fs.readFileSync(cloudinaryResultsPath, 'utf8'));

    // Create a mapping of folder names to Cloudinary URLs
    const urlMapping = {};
    cloudinaryResults.forEach(result => {
      const folderName = result.folder;
      urlMapping[folderName] = result.cloudinaryUrl;
    });

    console.log(`📊 Found ${Object.keys(urlMapping).length} Cloudinary URLs`);

    // Get all designs from Railway database
    const result = await client.query('SELECT design_id, image_url FROM designs');
    const designs = result.rows;

    console.log(`📊 Found ${designs.length} designs in Railway database`);

    // Update each design with correct Cloudinary URL
    let updatedCount = 0;
    for (const design of designs) {
      // Extract folder name from the current image URL
      let folderName = null;
      
      if (design.image_url && design.image_url.includes('lyric-art-studio/')) {
        // Extract folder name from Cloudinary URL
        const match = design.image_url.match(/lyric-art-studio\/([^\/]+)\//);
        if (match) {
          folderName = match[1];
        }
      } else if (design.image_url && design.image_url.includes('designs/')) {
        // Extract folder name from local path
        const match = design.image_url.match(/designs\/([^\/]+)\//);
        if (match) {
          folderName = match[1];
        }
      }

      if (folderName && urlMapping[folderName]) {
        const newImageUrl = urlMapping[folderName];
        
        await client.query(
          'UPDATE designs SET image_url = $1 WHERE design_id = $2',
          [newImageUrl, design.design_id]
        );

        console.log(`✅ Updated design ${design.design_id}: ${design.image_url} → ${newImageUrl}`);
        updatedCount++;
      } else {
        console.log(`❌ No Cloudinary URL found for design ${design.design_id}: ${design.image_url} (folder: ${folderName})`);
      }
    }

    console.log(`\n📊 Railway database updated! ${updatedCount} designs now use correct Cloudinary URLs`);

  } catch (error) {
    console.error('❌ Error updating Railway database:', error);
  } finally {
    await client.end();
  }
}

// Run the fix
if (require.main === module) {
  console.log('🔄 Fixing Railway database with correct Cloudinary URLs...');
  fixRailwayDatabase();
}

module.exports = { fixRailwayDatabase };
