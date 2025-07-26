const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { Pool } = require('pg');

class DesignUploadProcessor {
    constructor() {
        this.musicLyricsPath = path.join(__dirname, 'music_lyricss');
        this.imagesDesignsPath = path.join(__dirname, 'images', 'designs');
        this.designsDatabasePath = path.join(__dirname, 'designs-database.json');
        
        // PostgreSQL connection
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || "postgresql://postgres:OCrMfnkeqCuKljjsbXJVzpVqXnEFMwAG@nozomi.proxy.rlwy.net:18246/railway",
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        // Known multi-word artists for better parsing
        this.multiWordArtists = [
            'ac-dc', 'led-zeppelin', 'pink-floyd', 'black-sabbath', 'iron-maiden', 
            'deep-purple', 'judas-priest', 'van-halen', 'foo-fighters', 'linkin-park',
            'system-of-a-down', 'rage-against-the-machine', 'alice-in-chains',
            'stone-temple-pilots', 'pearl-jam', 'sound-garden', 'nine-inch-nails',
            'red-hot-chili-peppers', 'guns-n-roses', 'motley-crue', 'def-leppard',
            'the-beatles', 'the-rolling-stones', 'the-who', 'the-doors', 'the-eagles',
            'fleetwood-mac', 'lynyrd-skynyrd', 'allman-brothers', 'crosby-stills-nash',
            'simon-and-garfunkel', 'hall-and-oates', 'brooks-and-dunn'
        ];
        
        this.validShapes = ['guitar', 'piano', 'cassette'];
        this.requiredFormats = ['svg', 'png', 'pdf', 'eps'];
    }

    /**
     * Main processing function for uploaded design folder
     */
    async processUpload(files, filePaths) {
        try {
            console.log('🚀 Starting design upload processing...');
            
            // Step 1: Validate and organize files
            const fileStructure = this.organizeFiles(files, filePaths);
            console.log('📁 File structure organized:', fileStructure);
            
            // Step 2: Parse folder name and generate proper naming
            const designInfo = this.parseDesignInfo(fileStructure.folderName);
            console.log('🎯 Design info parsed:', designInfo);
            
            // Step 3: Validate required files are present
            this.validateRequiredFiles(fileStructure.files);
            console.log('✅ Required files validated');
            
            // Step 4: Generate unique design ID
            const designId = await this.generateDesignId();
            console.log('🆔 Generated design ID:', designId);
            
            // Step 5: Create folder structures and move files
            await this.createFolderStructures(designInfo.folderName);
            await this.processAndMoveFiles(fileStructure.files, designInfo.folderName);
            console.log('📂 Folder structures created and files moved');
            
            // Step 6: Create optimized web image
            await this.createOptimizedWebImage(designInfo.folderName);
            console.log('🖼️ Web image created and optimized');
            
            // Step 7: Update databases
            await this.updateDatabases(designId, designInfo);
            console.log('💾 Databases updated');
            
            const result = {
                success: true,
                designId: designId,
                designName: `${designInfo.artist} - ${designInfo.song}`,
                folderName: designInfo.folderName,
                filesCreated: Object.keys(fileStructure.files).length + 1, // +1 for webp
                message: 'Design successfully added and is now live!'
            };
            
            console.log('🎉 Upload processing completed successfully:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Upload processing failed:', error);
            throw new Error(`Upload processing failed: ${error.message}`);
        }
    }

    /**
     * Organize uploaded files by folder structure
     */
    organizeFiles(files, filePaths) {
        if (!files || files.length === 0) {
            throw new Error('No files provided');
        }

        // Extract folder name from first file path
        const firstPath = filePaths[0];
        const pathParts = firstPath.split('/');
        const folderName = pathParts[0];

        if (!folderName) {
            throw new Error('Could not extract folder name from uploaded files');
        }

        // Group files by type
        const organizedFiles = {};
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filePath = filePaths[i];
            const fileName = file.originalname;
            
            const fileExt = path.extname(fileName).toLowerCase().substring(1);
            
            if (this.requiredFormats.includes(fileExt)) {
                organizedFiles[fileExt] = {
                    file: file,
                    originalPath: filePath,
                    name: fileName
                };
            }
        }

        return {
            folderName: folderName,
            files: organizedFiles
        };
    }

    /**
     * Parse folder name into artist, song, and shape components
     */
    parseDesignInfo(originalFolderName) {
        console.log('🔍 Parsing folder name:', originalFolderName);
        
        // Convert to lowercase and replace spaces/special chars with hyphens
        let cleaned = originalFolderName.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

        const parts = cleaned.split('-').filter(part => part.length > 0);
        
        if (parts.length < 2) {
            throw new Error('Folder name must contain at least artist and song (e.g., "AC DC BACK IN BLACK GUITAR")');
        }

        // Identify shape (default to guitar if not specified)
        let shape = 'guitar';
        let contentParts = [...parts];
        
        // Check if last part is a valid shape
        const lastPart = parts[parts.length - 1];
        if (this.validShapes.includes(lastPart)) {
            shape = lastPart;
            contentParts = parts.slice(0, -1);
        }

        // Identify artist (check for multi-word artists first)
        let artist = contentParts[0];
        let songParts = contentParts.slice(1);
        
        // Check for multi-word artists
        for (const multiArtist of this.multiWordArtists) {
            const artistTokens = multiArtist.split('-');
            if (contentParts.length >= artistTokens.length) {
                const potentialArtist = contentParts.slice(0, artistTokens.length).join('-');
                if (potentialArtist === multiArtist) {
                    artist = multiArtist;
                    songParts = contentParts.slice(artistTokens.length);
                    break;
                }
            }
        }

        if (songParts.length === 0) {
            throw new Error('Could not identify song name from folder structure');
        }

        const song = songParts.join('-');
        const folderName = `${artist}-${song}-${shape}`;

        return {
            artist: this.capitalizeWords(artist.replace(/-/g, ' ')),
            song: this.capitalizeWords(song.replace(/-/g, ' ')),
            shape: shape.toUpperCase(),
            folderName: folderName,
            originalName: originalFolderName
        };
    }

    /**
     * Capitalize words properly
     */
    capitalizeWords(str) {
        return str.split(' ').map(word => {
            // Handle special cases
            const lowerWord = word.toLowerCase();
            if (['of', 'the', 'and', 'in', 'on', 'at', 'to', 'for', 'with', 'by'].includes(lowerWord)) {
                return lowerWord;
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
    }

    /**
     * Validate that all required file formats are present
     */
    validateRequiredFiles(files) {
        const missingFormats = [];
        
        for (const format of this.requiredFormats) {
            if (!files[format]) {
                missingFormats.push(format.toUpperCase());
            }
        }
        
        if (missingFormats.length > 0) {
            throw new Error(`Missing required file formats: ${missingFormats.join(', ')}. Please ensure your folder contains SVG, PNG, PDF, and EPS files.`);
        }
    }

    /**
     * Generate next available design ID
     */
    async generateDesignId() {
        try {
            // Get highest ID from PostgreSQL database
            const result = await this.pool.query('SELECT MAX(CAST(design_id AS INTEGER)) as max_id FROM designs WHERE design_id ~ \'^[0-9]+$\'');
            const maxId = result.rows[0].max_id || 0;
            return (maxId + 1).toString();
        } catch (error) {
            console.error('Error generating design ID:', error);
            throw new Error('Failed to generate design ID');
        }
    }

    /**
     * Create folder structures in both music_lyricss and images/designs
     */
    async createFolderStructures(folderName) {
        const musicFolder = path.join(this.musicLyricsPath, folderName);
        const imagesFolder = path.join(this.imagesDesignsPath, folderName);
        
        try {
            await fs.mkdir(musicFolder, { recursive: true });
            await fs.mkdir(imagesFolder, { recursive: true });
            console.log(`📁 Created folders: ${folderName}`);
        } catch (error) {
            throw new Error(`Failed to create folder structures: ${error.message}`);
        }
    }

    /**
     * Process and move files to appropriate locations
     */
    async processAndMoveFiles(files, folderName) {
        const musicFolder = path.join(this.musicLyricsPath, folderName);
        
        for (const [format, fileData] of Object.entries(files)) {
            try {
                const newFileName = `${folderName}.${format}`;
                const targetPath = path.join(musicFolder, newFileName);
                
                // Write file buffer to target location
                const buffer = await this.fileToBuffer(fileData.file);
                await fs.writeFile(targetPath, buffer);
                
                console.log(`📄 Moved ${format.toUpperCase()}: ${newFileName}`);
            } catch (error) {
                throw new Error(`Failed to process ${format} file: ${error.message}`);
            }
        }
    }

    /**
     * Convert File object to Buffer (Node.js multer version)
     */
    async fileToBuffer(file) {
        // Multer already provides file.buffer for memory storage
        return file.buffer;
    }

    /**
     * Create optimized WebP image for web display
     */
    async createOptimizedWebImage(folderName) {
        const sourcePngPath = path.join(this.musicLyricsPath, folderName, `${folderName}.png`);
        const targetWebpPath = path.join(this.imagesDesignsPath, folderName, `${folderName}.webp`);
        
        try {
            // Check if source PNG exists
            await fs.access(sourcePngPath);
            
            // Convert PNG to optimized WebP
            await sharp(sourcePngPath)
                .webp({ 
                    quality: 85, 
                    effort: 6,
                    lossless: false 
                })
                .resize(800, 800, { 
                    fit: 'inside', 
                    withoutEnlargement: true 
                })
                .toFile(targetWebpPath);
                
            console.log(`🖼️ Created optimized WebP: ${folderName}.webp`);
        } catch (error) {
            throw new Error(`Failed to create web image: ${error.message}`);
        }
    }

    /**
     * Update both PostgreSQL and JSON databases
     */
    async updateDatabases(designId, designInfo) {
        try {
            // Update PostgreSQL database
            await this.updatePostgreSQLDatabase(designId, designInfo);
            
            // Update JSON database
            await this.updateJSONDatabase(designId, designInfo);
            
            console.log('💾 Both databases updated successfully');
        } catch (error) {
            throw new Error(`Database update failed: ${error.message}`);
        }
    }

    /**
     * Update PostgreSQL database
     */
    async updatePostgreSQLDatabase(designId, designInfo) {
        const imageUrl = `images/designs/${designInfo.folderName}/${designInfo.folderName}.webp`;
        
        const insertQuery = `
            INSERT INTO designs (design_id, name, artist, price, rating, review_count, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        const values = [
            designId,
            designInfo.song,
            designInfo.artist,
            3, // Default price
            0, // Default rating
            0, // Default review count
            imageUrl
        ];
        
        await this.pool.query(insertQuery, values);
        console.log(`✅ PostgreSQL: Added design ID ${designId}`);
    }

    /**
     * Update JSON database
     */
    async updateJSONDatabase(designId, designInfo) {
        try {
            // Read existing database
            const data = await fs.readFile(this.designsDatabasePath, 'utf8');
            const designsDB = JSON.parse(data);
            
            // Create new design entry
            const newDesign = {
                id: parseInt(designId),
                artist: designInfo.artist,
                song: designInfo.song,
                shape: designInfo.shape,
                genre: this.determineGenre(designInfo.artist), // Auto-determine genre
                price: 3,
                formats: ["SVG", "PDF", "PNG", "EPS"],
                image: `images/designs/${designInfo.folderName}/${designInfo.folderName}.webp`,
                webp: `images/designs/${designInfo.folderName}/${designInfo.folderName}.webp`,
                files: {
                    svg: `music_lyricss/${designInfo.folderName}/${designInfo.folderName}.svg`,
                    pdf: `music_lyricss/${designInfo.folderName}/${designInfo.folderName}.pdf`,
                    png: `music_lyricss/${designInfo.folderName}/${designInfo.folderName}.png`,
                    eps: `music_lyricss/${designInfo.folderName}/${designInfo.folderName}.eps`
                }
            };
            
            // Add to designs array
            designsDB.designs.push(newDesign);
            
            // Sort by ID to maintain order
            designsDB.designs.sort((a, b) => a.id - b.id);
            
            // Write back to file
            await fs.writeFile(this.designsDatabasePath, JSON.stringify(designsDB, null, 2));
            console.log(`✅ JSON Database: Added design ID ${designId}`);
            
        } catch (error) {
            throw new Error(`JSON database update failed: ${error.message}`);
        }
    }

    /**
     * Auto-determine genre based on artist (basic implementation)
     */
    determineGenre(artist) {
        const artistLower = artist.toLowerCase();
        
        // Rock artists
        const rockArtists = ['ac-dc', 'led-zeppelin', 'metallica', 'black-sabbath', 'iron-maiden', 'deep-purple'];
        if (rockArtists.some(rockArtist => artistLower.includes(rockArtist.replace('-', ' ')))) {
            return 'Rock';
        }
        
        // Country artists
        const countryArtists = ['taylor swift', 'carrie underwood', 'blake shelton', 'keith urban'];
        if (countryArtists.some(countryArtist => artistLower.includes(countryArtist))) {
            return 'Country';
        }
        
        // Pop artists
        const popArtists = ['the beatles', 'michael jackson', 'madonna', 'elvis'];
        if (popArtists.some(popArtist => artistLower.includes(popArtist))) {
            return 'Pop';
        }
        
        // Default to Rock
        return 'Rock';
    }

    /**
     * Cleanup function for failed uploads
     */
    async cleanup(folderName) {
        if (!folderName) return;
        
        try {
            const musicFolder = path.join(this.musicLyricsPath, folderName);
            const imagesFolder = path.join(this.imagesDesignsPath, folderName);
            
            await fs.rmdir(musicFolder, { recursive: true }).catch(() => {});
            await fs.rmdir(imagesFolder, { recursive: true }).catch(() => {});
            
            console.log(`🧹 Cleaned up folders for: ${folderName}`);
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

module.exports = DesignUploadProcessor; 