const fs = require('fs');
const path = require('path');

// Function to convert PNG to WebP (placeholder - would need Sharp library)
function convertToWebP(pngPath, webpPath) {
    // This is a placeholder - in a real implementation, you would use Sharp library
    // For now, we'll just copy the PNG file and rename it to .webp
    if (fs.existsSync(pngPath)) {
        fs.copyFileSync(pngPath, webpPath);
        console.log(`Converted: ${pngPath} -> ${webpPath}`);
    }
}

// Function to process all PNG files in music_lyricss directory
function processAllImages() {
    const musicLyricsPath = path.join(__dirname, 'music_lyricss');
    
    if (!fs.existsSync(musicLyricsPath)) {
        console.log('music_lyricss directory not found');
        return;
    }
    
    const folders = fs.readdirSync(musicLyricsPath).filter(item => 
        fs.statSync(path.join(musicLyricsPath, item)).isDirectory()
    );
    
    let convertedCount = 0;
    
    folders.forEach(folder => {
        const folderPath = path.join(musicLyricsPath, folder);
        const files = fs.readdirSync(folderPath);
        
        // Find PNG file
        const pngFile = files.find(file => file.endsWith('.png'));
        if (pngFile) {
            const pngPath = path.join(folderPath, pngFile);
            const webpPath = path.join(folderPath, pngFile.replace('.png', '.webp'));
            
            // Only convert if WebP doesn't exist
            if (!fs.existsSync(webpPath)) {
                convertToWebP(pngPath, webpPath);
                convertedCount++;
            }
        }
    });
    
    console.log(`\nConversion complete! Converted ${convertedCount} images to WebP format.`);
    console.log('Note: This script created placeholder WebP files. For real WebP conversion, install Sharp library:');
    console.log('npm install sharp');
}

// Run the conversion
processAllImages(); 