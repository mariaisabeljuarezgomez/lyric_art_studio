// Fix all duplicate images in database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixAllDuplicateImages() {
    try {
        console.log('🔧 Fixing all duplicate images in database...');
        
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
        
        console.log(`Found ${Object.keys(duplicates).length} duplicate image URLs to fix.`);
        console.log('');
        
        // Fix each duplicate group
        let fixedCount = 0;
        for (const imageUrl of Object.keys(duplicates)) {
            const designs = duplicates[imageUrl];
            const baseFolder = imageUrl.split('/').pop().replace('.png', '');
            
            console.log(`🔧 Fixing: ${baseFolder} (${designs.length} designs)`);
            
            // For each design in the duplicate group, we need to find the correct folder
            // We'll use a systematic approach based on design ID
            for (let i = 0; i < designs.length; i++) {
                const design = designs[i];
                let correctFolder = baseFolder;
                
                // Add suffix based on position in the group
                if (i === 0) {
                    // First design keeps the base folder
                    correctFolder = baseFolder;
                } else if (i === 1) {
                    // Second design gets -2 suffix
                    correctFolder = baseFolder.replace('-guitar', '-guitar-2');
                } else if (i === 2) {
                    // Third design gets -3 suffix
                    correctFolder = baseFolder.replace('-guitar', '-guitar-3');
                } else if (i === 3) {
                    // Fourth design gets -4 suffix
                    correctFolder = baseFolder.replace('-guitar', '-guitar-4');
                }
                
                // Construct the Cloudinary URL
                const cloudinaryUrl = `https://res.cloudinary.com/dtp1z8lne/image/upload/v1754024036/lyric-art-studio/${correctFolder}/${correctFolder}.png`;
                
                // Update the database
                await pool.query(`
                    UPDATE designs 
                    SET image_url = $1
                    WHERE design_id = $2
                `, [cloudinaryUrl, design.design_id]);
                
                console.log(`   ✅ Design ID ${design.design_id}: ${design.name} -> ${correctFolder}`);
                fixedCount++;
            }
            console.log('');
        }
        
        console.log(`✅ Fixed ${fixedCount} designs with duplicate images!`);
        
        // Verify the fixes
        console.log('\n🔍 Verifying fixes...');
        const verifyResult = await pool.query(`
            SELECT design_id, name, artist, price, image_url 
            FROM designs 
            ORDER BY image_url, design_id
        `);
        
        // Check for remaining duplicates
        const verifyGroups = {};
        verifyResult.rows.forEach(row => {
            const imageUrl = row.image_url;
            if (!verifyGroups[imageUrl]) {
                verifyGroups[imageUrl] = [];
            }
            verifyGroups[imageUrl].push(row);
        });
        
        const remainingDuplicates = {};
        Object.keys(verifyGroups).forEach(imageUrl => {
            if (verifyGroups[imageUrl].length > 1) {
                remainingDuplicates[imageUrl] = verifyGroups[imageUrl];
            }
        });
        
        if (Object.keys(remainingDuplicates).length === 0) {
            console.log('✅ All duplicate images have been fixed!');
        } else {
            console.log(`⚠️ Still have ${Object.keys(remainingDuplicates).length} duplicate image URLs remaining.`);
        }
        
    } catch (error) {
        console.error('❌ Error fixing duplicate images:', error);
    } finally {
        await pool.end();
    }
}

fixAllDuplicateImages(); 