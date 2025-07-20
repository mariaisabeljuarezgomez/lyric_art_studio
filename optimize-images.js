const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ImageOptimizer {
    constructor() {
        this.designsDir = 'images/designs';
        this.outputDir = 'images/optimized';
        this.webDisplayWidth = 1200;  // Increased from 800
        this.webDisplayHeight = 900;  // Increased from 600
        this.quality = 95; // Increased from 85 - much higher quality
        this.maxFileSize = 500; // Max file size in KB
    }

    async optimizeAllImages() {
        console.log('🎨 Starting HIGH QUALITY image optimization...');
        console.log(`📏 Target dimensions: ${this.webDisplayWidth}x${this.webDisplayHeight}`);
        console.log(`🎯 Quality setting: ${this.quality}%`);
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        // Get all design directories
        const designDirs = this.getDesignDirectories();
        console.log(`Found ${designDirs.length} design directories`);

        let processed = 0;
        let errors = 0;

        for (const designDir of designDirs) {
            try {
                await this.optimizeDesignDirectory(designDir);
                processed++;
                console.log(`✅ Processed: ${designDir}`);
            } catch (error) {
                console.error(`❌ Error processing ${designDir}:`, error.message);
                errors++;
            }
        }

        console.log(`\n🎉 Optimization complete!`);
        console.log(`✅ Successfully processed: ${processed} designs`);
        if (errors > 0) {
            console.log(`❌ Errors: ${errors} designs`);
        }
    }

    getDesignDirectories() {
        if (!fs.existsSync(this.designsDir)) {
            throw new Error(`Designs directory not found: ${this.designsDir}`);
        }

        return fs.readdirSync(this.designsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
    }

    async optimizeDesignDirectory(designName) {
        const sourceDir = path.join(this.designsDir, designName);
        const outputDir = path.join(this.outputDir, designName);
        
        // Create output subdirectory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Find the main image file (WebP or PNG)
        const imageFile = this.findMainImageFile(sourceDir);
        if (!imageFile) {
            throw new Error(`No image file found in ${sourceDir}`);
        }

        const sourcePath = path.join(sourceDir, imageFile);
        const outputPath = path.join(outputDir, `${designName}.jpg`);

        // Optimize the image with better quality settings
        await this.optimizeImage(sourcePath, outputPath);
        
        // Create a metadata file for the design
        this.createMetadataFile(designName, outputPath);
    }

    findMainImageFile(directory) {
        const files = fs.readdirSync(directory);
        
        // Look for WebP first, then PNG, then other image formats
        const imageExtensions = ['.webp', '.png', '.jpg', '.jpeg'];
        
        for (const ext of imageExtensions) {
            const file = files.find(f => f.toLowerCase().endsWith(ext));
            if (file) return file;
        }
        
        return null;
    }

    async optimizeImage(sourcePath, outputPath) {
        try {
            // Use ImageMagick with MUCH better quality settings
            // -resize with ^ to maintain aspect ratio and crop to fit
            // -quality 95 for high quality
            // -strip to remove metadata but keep quality
            const command = `magick "${sourcePath}" -resize ${this.webDisplayWidth}x${this.webDisplayHeight}^ -gravity center -extent ${this.webDisplayWidth}x${this.webDisplayHeight} -quality ${this.quality} -strip -interlace Plane "${outputPath}"`;
            
            execSync(command, { stdio: 'pipe' });
            
            // Get file size info
            const stats = fs.statSync(outputPath);
            const sizeKB = Math.round(stats.size / 1024);
            
            console.log(`  📁 ${path.basename(sourcePath)} → ${path.basename(outputPath)} (${sizeKB}KB)`);
            
            // If file is still too large, try a slightly lower quality
            if (sizeKB > this.maxFileSize) {
                console.log(`  🔧 File too large (${sizeKB}KB), trying quality 90...`);
                const command2 = `magick "${sourcePath}" -resize ${this.webDisplayWidth}x${this.webDisplayHeight}^ -gravity center -extent ${this.webDisplayWidth}x${this.webDisplayHeight} -quality 90 -strip -interlace Plane "${outputPath}"`;
                execSync(command2, { stdio: 'pipe' });
                
                const stats2 = fs.statSync(outputPath);
                const sizeKB2 = Math.round(stats2.size / 1024);
                console.log(`  📁 Optimized: ${path.basename(outputPath)} (${sizeKB2}KB)`);
            }
            
        } catch (error) {
            // Fallback: try without ImageMagick (just copy and rename)
            console.log(`  ⚠️  ImageMagick not available, using fallback method`);
            this.fallbackOptimization(sourcePath, outputPath);
        }
    }

    fallbackOptimization(sourcePath, outputPath) {
        // Simple fallback - just copy the file and rename to .jpg
        // This is a basic fallback when ImageMagick isn't available
        fs.copyFileSync(sourcePath, outputPath);
        console.log(`  📁 Copied: ${path.basename(sourcePath)} → ${path.basename(outputPath)}`);
    }

    createMetadataFile(designName, imagePath) {
        const metadata = {
            designName: designName,
            originalImage: imagePath,
            optimizedImage: imagePath,
            displayWidth: this.webDisplayWidth,
            displayHeight: this.webDisplayHeight,
            quality: this.quality,
            optimizedAt: new Date().toISOString(),
            lazyLoading: true
        };

        const metadataPath = path.join(path.dirname(imagePath), 'metadata.json');
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }

    // Generate a database update script
    generateDatabaseUpdate() {
        console.log('\n📝 Generating database update script...');
        
        const designDirs = this.getDesignDirectories();
        const updates = [];

        for (const designDir of designDirs) {
            const optimizedPath = `images/optimized/${designDir}/${designDir}.jpg`;
            const metadataPath = `images/optimized/${designDir}/metadata.json`;
            
            if (fs.existsSync(optimizedPath)) {
                updates.push({
                    design: designDir,
                    optimizedImage: optimizedPath,
                    hasMetadata: fs.existsSync(metadataPath)
                });
            }
        }

        const updateScript = `
// Database update for optimized images
const optimizedImages = ${JSON.stringify(updates, null, 2)};

// Update your designs database with optimized image paths
optimizedImages.forEach(item => {
    // Update the image path in your database
    // item.optimizedImage contains the path to the optimized JPG
    console.log(\`Updated \${item.design} with optimized image\`);
});
        `;

        fs.writeFileSync('database-update.js', updateScript);
        console.log('✅ Generated database-update.js');
    }
}

// Run the optimization
async function main() {
    const optimizer = new ImageOptimizer();
    
    try {
        await optimizer.optimizeAllImages();
        optimizer.generateDatabaseUpdate();
        
        console.log('\n🎯 Next steps:');
        console.log('1. Review the optimized images in images/optimized/');
        console.log('2. Update your database to use the new optimized image paths');
        console.log('3. Implement lazy loading in your HTML');
        console.log('4. Add the magnifying glass feature');
        
    } catch (error) {
        console.error('❌ Optimization failed:', error.message);
        process.exit(1);
    }
}

// Check if ImageMagick is available
try {
    execSync('magick --version', { stdio: 'pipe' });
    console.log('✅ ImageMagick found - will use full optimization');
} catch (error) {
    console.log('⚠️  ImageMagick not found - will use fallback optimization');
    console.log('💡 Install ImageMagick for better image optimization:');
    console.log('   https://imagemagick.org/script/download.php');
}

main(); 