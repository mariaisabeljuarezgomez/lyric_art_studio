// Check for duplicate images in database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkDuplicateImages() {
    try {
        console.log('🔍 Checking for duplicate images in database...');
        
        // Get all designs with their image URLs
        const result = await pool.query(`
            SELECT design_id, name, artist, price, image_url 
            FROM designs 
            ORDER BY image_url, design_id
        `);
        
        // Group designs by image URL
        const imageGroups = {};
        result.rows.forEach(row => {
            const imageUrl = row.image_url;
            if (!imageGroups[imageUrl]) {
                imageGroups[imageUrl] = [];
            }
            imageGroups[imageUrl].push(row);
        });
        
        // Find duplicates (more than one design using the same image)
        const duplicates = {};
        Object.keys(imageGroups).forEach(imageUrl => {
            if (imageGroups[imageUrl].length > 1) {
                duplicates[imageUrl] = imageGroups[imageUrl];
            }
        });
        
        if (Object.keys(duplicates).length === 0) {
            console.log('✅ No duplicate images found! All designs have unique images.');
        } else {
            console.log(`❌ Found ${Object.keys(duplicates).length} duplicate image URLs:`);
            console.log('');
            
            Object.keys(duplicates).forEach(imageUrl => {
                const designs = duplicates[imageUrl];
                const folderName = imageUrl.split('/').pop().replace('.png', '');
                console.log(`📁 Folder: ${folderName}`);
                console.log(`🔗 URL: ${imageUrl}`);
                console.log(`📊 Used by ${designs.length} designs:`);
                designs.forEach(design => {
                    console.log(`   - Design ID ${design.design_id}: ${design.name} - $${design.price}`);
                });
                console.log('');
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking for duplicate images:', error);
    } finally {
        await pool.end();
    }
}

checkDuplicateImages(); 