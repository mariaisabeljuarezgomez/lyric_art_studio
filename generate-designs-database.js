const fs = require('fs');
const path = require('path');

// Function to parse folder name into design data
function parseFolderName(folderName) {
    // Remove common suffixes
    let cleanName = folderName
        .replace(/-copy$/, '')
        .replace(/-ss$/, '')
        .replace(/-2$/, '')
        .replace(/-3$/, '')
        .replace(/-4$/, '')
        .replace(/-white$/, '')
        .replace(/-guitar2$/, '-guitar')
        .replace(/-gutar$/, '-guitar');
    
    // Split by hyphens
    const parts = cleanName.split('-');
    
    // Find the shape (last part)
    let shape = parts[parts.length - 1].toUpperCase();
    
    // Clean up shape names
    if (shape === 'GUTAR') shape = 'GUITAR';
    if (shape === 'GUITAR2') shape = 'GUITAR';
    if (shape === 'RED') shape = 'GUITAR';
    if (shape === 'HEART') shape = 'GUITAR';
    if (shape === 'STORY') shape = 'GUITAR';
    if (shape === 'WHEEL') shape = 'GUITAR';
    if (shape === 'LIFE') shape = 'GUITAR';
    if (shape === 'STYLE') shape = 'GUITAR';
    if (shape === 'NEW') shape = 'GUITAR';
    if (shape === 'YOU') shape = 'GUITAR';
    if (shape === 'COPY') shape = 'GUITAR';
    if (shape === 'FIRE') shape = 'GUITAR';
    if (shape === 'CRAZY') shape = 'GUITAR';
    if (shape === 'STATE') shape = 'GUITAR';
    if (shape === 'LYRICS') shape = 'GUITAR';
    if (shape === 'DESIGN') shape = 'GUITAR';
    if (shape === 'WHITE') shape = 'GUITAR';
    if (shape === 'WEEPS') shape = 'GUITAR';
    if (shape === 'SEASON') shape = 'GUITAR';
    if (shape === 'MOONDANCE') shape = 'GUITAR';
    
    // Remove shape from parts
    parts.pop();
    
    // Handle special cases for artist names
    let artist = '';
    let song = '';
    
    // Special artist mappings
    const artistMappings = {
        'ac-dc': 'AC/DC',
        'van-morrison': 'Van Morrison',
        'the-beatles': 'The Beatles',
        'the-eagles': 'The Eagles',
        'the-rolling-stones': 'The Rolling Stones',
        'the-doors': 'The Doors',
        'the-pretenders': 'The Pretenders',
        'the-outlaws': 'The Outlaws',
        'the-judds': 'The Judds',
        'the-turtles': 'The Turtles',
        'bob-segar': 'Bob Seger',
        'bob-seger': 'Bob Seger',
        'simon-and-garfunkle': 'Simon and Garfunkel',
        'simon-and-garfunkel': 'Simon and Garfunkel',
        'taylor-swift': 'Taylor Swift',
        'ed-sheeran': 'Ed Sheeran',
        'billy-joel': 'Billy Joel',
        'elton-john': 'Elton John',
        'willie-nelson': 'Willie Nelson',
        'tim-mcgraw': 'Tim McGraw',
        'blake-shelton': 'Blake Shelton',
        'carrie-underwood': 'Carrie Underwood',
        'chris-stapleton': 'Chris Stapleton',
        'cody-jinks': 'Cody Jinks',
        'zach-bryan': 'Zach Bryan',
        'tyler-childers': 'Tyler Childers'
    };
    
    // Try to find artist in the beginning
    for (let i = 1; i <= 4; i++) {
        const potentialArtist = parts.slice(0, i).join('-');
        if (artistMappings[potentialArtist]) {
            artist = artistMappings[potentialArtist];
            song = parts.slice(i).join(' ').replace(/\b\w/g, l => l.toUpperCase());
            break;
        }
    }
    
    // If no artist found, try to parse manually
    if (!artist) {
        // Look for common patterns
        if (parts[0] === 'ac' && parts[1] === 'dc') {
            artist = 'AC/DC';
            song = parts.slice(2).join(' ').replace(/\b\w/g, l => l.toUpperCase());
        } else if (parts[0] === 'the' && parts.length > 2) {
            artist = 'The ' + parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
            song = parts.slice(2).join(' ').replace(/\b\w/g, l => l.toUpperCase());
        } else {
            // Default: first part is artist, rest is song
            artist = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            song = parts.slice(1).join(' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    }
    
    // Determine genre
    let genre = determineGenre(artist, song);
    
    return {
        artist,
        song,
        shape,
        genre
    };
}

// Function to determine genre based on artist and song
function determineGenre(artist, song) {
    const artistLower = artist.toLowerCase();
    const songLower = song.toLowerCase();
    
    // Rock artists
    if (artistLower.includes('ac/dc') || artistLower.includes('aerosmith') || 
        artistLower.includes('black sabbath') || artistLower.includes('led zeppelin') ||
        artistLower.includes('the eagles') || artistLower.includes('the beatles') ||
        artistLower.includes('the rolling stones') || artistLower.includes('pink floyd') ||
        artistLower.includes('the doors') || artistLower.includes('the pretenders') ||
        artistLower.includes('the outlaws') || artistLower.includes('van morrison') ||
        artistLower.includes('bob seger') || artistLower.includes('bob segar') ||
        artistLower.includes('tom petty') || artistLower.includes('bruce springsteen')) {
        return 'Rock';
    }
    
    // Country artists
    if (artistLower.includes('alabama') || artistLower.includes('willie nelson') ||
        artistLower.includes('tim mcgraw') || artistLower.includes('blake shelton') ||
        artistLower.includes('carrie underwood') || artistLower.includes('chris stapleton') ||
        artistLower.includes('cody jinks') || artistLower.includes('zach bryan') ||
        artistLower.includes('tyler childers') || artistLower.includes('thomas rhett') ||
        artistLower.includes('brad paisley') || artistLower.includes('brantley gilbert')) {
        return 'Country';
    }
    
    // Pop artists
    if (artistLower.includes('taylor swift') || artistLower.includes('ed sheeran') ||
        artistLower.includes('billy joel') || artistLower.includes('elton john') ||
        artistLower.includes('barry manilow') || artistLower.includes('chicago')) {
        return 'Pop';
    }
    
    // Alternative Rock
    if (artistLower.includes('alice in chains') || artistLower.includes('stone temple pilots') ||
        artistLower.includes('blind melon') || artistLower.includes('candlebox') ||
        artistLower.includes('shinedown') || artistLower.includes('disturbed')) {
        return 'Alternative Rock';
    }
    
    // Folk/Singer-Songwriter
    if (artistLower.includes('simon and garfunkel') || artistLower.includes('james taylor') ||
        artistLower.includes('carol king') || artistLower.includes('joni mitchell')) {
        return 'Folk/Singer-Songwriter';
    }
    
    // Default to Rock for most cases
    return 'Rock';
}

// Main function to generate database
function generateDatabase() {
    const musicLyricsPath = path.join(__dirname, 'music_lyricss');
    const folders = fs.readdirSync(musicLyricsPath).filter(item => 
        fs.statSync(path.join(musicLyricsPath, item)).isDirectory()
    );
    
    const designs = [];
    let id = 1;
    
    folders.forEach(folder => {
        const folderPath = path.join(musicLyricsPath, folder);
        const files = fs.readdirSync(folderPath);
        
        // Check if folder has the required files
        const hasPng = files.some(file => file.endsWith('.png'));
        const hasSvg = files.some(file => file.endsWith('.svg'));
        const hasPdf = files.some(file => file.endsWith('.pdf'));
        const hasEps = files.some(file => file.endsWith('.eps'));
        
        if (hasPng) { // Only include if PNG exists (main image)
            const designData = parseFolderName(folder);
            
            const design = {
                id: id++,
                artist: designData.artist,
                song: designData.song,
                shape: designData.shape,
                genre: designData.genre,
                price: 3.00,
                formats: [],
                image: `music_lyricss/${folder}/${folder}.png`,
                webp: `music_lyricss/${folder}/${folder}.webp`,
                files: {}
            };
            
            // Add available formats
            if (hasSvg) {
                design.formats.push('SVG');
                design.files.svg = `music_lyricss/${folder}/${folder}.svg`;
            }
            if (hasPdf) {
                design.formats.push('PDF');
                design.files.pdf = `music_lyricss/${folder}/${folder}.pdf`;
            }
            if (hasPng) {
                design.formats.push('PNG');
                design.files.png = `music_lyricss/${folder}/${folder}.png`;
            }
            if (hasEps) {
                design.formats.push('EPS');
                design.files.eps = `music_lyricss/${folder}/${folder}.eps`;
            }
            
            designs.push(design);
        }
    });
    
    const database = {
        designs,
        metadata: {
            totalDesigns: designs.length,
            lastUpdated: new Date().toISOString().split('T')[0],
            pricing: {
                standardPrice: 3.00,
                currency: "USD"
            },
            formats: ["SVG", "PDF", "PNG", "EPS"],
            shapes: ["GUITAR", "PIANO", "CASSETTE"],
            genres: ["Rock", "Country", "Pop", "Alternative Rock", "Classic Rock", "Folk/Singer-Songwriter", "Hip-Hop", "Electronic", "Jazz", "Blues"]
        }
    };
    
    // Write to file
    fs.writeFileSync('designs-database.json', JSON.stringify(database, null, 2));
    console.log(`Generated database with ${designs.length} designs`);
    
    // Generate statistics
    const stats = {
        total: designs.length,
        byShape: {},
        byGenre: {},
        byArtist: {}
    };
    
    designs.forEach(design => {
        stats.byShape[design.shape] = (stats.byShape[design.shape] || 0) + 1;
        stats.byGenre[design.genre] = (stats.byGenre[design.genre] || 0) + 1;
        stats.byArtist[design.artist] = (stats.byArtist[design.artist] || 0) + 1;
    });
    
    console.log('\nStatistics:');
    console.log('By Shape:', stats.byShape);
    console.log('By Genre:', stats.byGenre);
    console.log('Top Artists:', Object.entries(stats.byArtist)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([artist, count]) => `${artist}: ${count}`)
        .join(', ')
    );
}

// Run the script
generateDatabase(); 