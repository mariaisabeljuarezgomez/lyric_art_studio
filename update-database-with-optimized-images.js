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

// Update the database with optimized images
function updateDatabaseWithOptimizedImages() {
    console.log('🔄 Updating database with optimized images...');
    
    const database = loadDesignsDatabase();
    if (!database) {
        console.log('❌ Could not load database');
        return;
    }
    
    let updatedCount = 0;
    let totalCount = database.designs.length;
    
    database.designs.forEach(design => {
        const optimizedPath = `images/optimized/${design.id}/${design.id}.jpg`;
        const optimizedPathExists = fs.existsSync(optimizedPath);
        
        if (optimizedPathExists) {
            // Update the image path to use optimized JPG
            design.image = optimizedPath;
            design.webp = optimizedPath; // Also update webp reference
            updatedCount++;
            console.log(`✅ Updated: ${design.id}`);
        } else {
            console.log(`⚠️  Optimized image not found for: ${design.id}`);
        }
    });
    
    // Save the updated database
    try {
        fs.writeFileSync('designs-database.json', JSON.stringify(database, null, 2));
        console.log(`\n🎉 Database updated successfully!`);
        console.log(`✅ Updated ${updatedCount} out of ${totalCount} designs`);
        console.log(`📁 Database saved to: designs-database.json`);
        
        // Show some examples of the updates
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
updateDatabaseWithOptimizedImages(); 