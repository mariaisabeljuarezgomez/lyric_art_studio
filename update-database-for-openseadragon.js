const fs = require('fs');
const path = require('path');

// Load the current designs database
function loadDesignsDatabase() {
    try {
        const databasePath = 'designs-database.json';
        if (fs.existsSync(databasePath)) {
            const data = fs.readFileSync(databasePath, 'utf8');
            return JSON.parse(data);
        } else {
            console.log('❌ Designs database not found');
            return null;
        }
    } catch (error) {
        console.error('❌ Error loading database:', error.message);
        return null;
    }
}

// Update the database to use original high-resolution images for OpenSeadragon
function updateDatabaseForOpenSeadragon() {
    console.log('🔄 Updating database for OpenSeadragon high-resolution zooming...');
    
    const database = loadDesignsDatabase();
    if (!database) {
        console.log('❌ Could not load database');
        return;
    }
    
    let updatedCount = 0;
    let totalCount = database.designs.length;
    
    database.designs.forEach(design => {
        // Use original high-resolution WebP images for OpenSeadragon
        const originalPath = `images/designs/${design.id}/${design.id}.webp`;
        const originalPathExists = fs.existsSync(originalPath);
        
        if (originalPathExists) {
            // Update to use original high-resolution images
            design.image = originalPath;
            design.webp = originalPath;
            design.highResImage = originalPath; // Add high-res reference for OpenSeadragon
            updatedCount++;
            console.log(`✅ Updated for OpenSeadragon: ${design.id}`);
        } else {
            console.log(`⚠️  Original image not found for: ${design.id}`);
        }
    });
    
    // Save the updated database
    try {
        fs.writeFileSync('designs-database.json', JSON.stringify(database, null, 2));
        console.log(`\n🎉 Database updated for OpenSeadragon!`);
        console.log(`✅ Updated ${updatedCount} out of ${totalCount} designs`);
        console.log(`📁 Now using original high-resolution images for zooming`);
        
        // Show some examples
        console.log('\n📋 Example updates:');
        const examples = database.designs.slice(0, 3);
        examples.forEach(design => {
            console.log(`  ${design.id}: ${design.image}`);
        });
        
    } catch (error) {
        console.error('❌ Error saving database:', error.message);
    }
}

// Run the update
updateDatabaseForOpenSeadragon(); 