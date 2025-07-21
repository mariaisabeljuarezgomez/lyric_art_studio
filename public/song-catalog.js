// LyricArt Studio - Song Catalog Data Management
class SongCatalogManager {
    constructor() {
        this.songs = [];
        this.filteredSongs = [];
        this.genres = new Map();
        this.artists = new Map();
        this.currentFilters = {
            search: '',
            genres: [],
            instruments: [],
            artists: [],
            decades: [],
            colors: []
        };
        this.sortOrder = 'popularity';
        this.currentView = 'grid';
        
        // Pagination settings
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.hasMoreItems = true;
        
        // Standard price for all designs
        this.standardPrice = 3.00;
        
        // Available formats
        this.formats = ['SVG', 'PDF', 'PNG', 'EPS'];
        
        // Instrument shapes mapping
        this.instrumentShapes = {
            'GUITAR': 'Guitar',
            'PIANO': 'Piano',
            'CASSETTE': 'Cassette',
            'HEART': 'Heart',
            'CIRCLE': 'Circle',
            'SQUARE': 'Square'
        };
        
        // Initialize
        this.init();
    }

    async init() {
        await this.loadSongData();
        this.setupEventListeners();
        this.renderCatalog();
        this.updateFilters();
        updateCartBadge(); // Initialize cart badge
    }

    async loadSongData() {
        try {
            // Load the real designs database from the server
            const response = await fetch('/api/designs');
            if (!response.ok) {
                throw new Error('Failed to load designs database');
            }
            
            const database = await response.json();
            const rawSongData = database.designs.map(design => ({
                id: design.id,
                artist: design.artist,
                song: design.song,
                shape: design.shape,
                genre: design.genre,
                price: design.price,
                formats: design.formats,
                image: design.image,
                webp: design.webp,
                files: design.files
            }));
            
            this.processSongData(rawSongData);
        } catch (error) {
            console.error('Error loading song data:', error);
            // Fallback to empty array if database fails to load
            this.processSongData([]);
        }
    }

    processSongData(rawData) {
        const processedSongs = [];

        rawData.forEach((item, index) => {
            // Skip items with empty songs or invalid data
            if (!item.song || item.song.trim() === '' || !item.artist || item.artist.trim() === '') {
                return;
            }

            // Use the real data from our database
            const song = {
                id: item.id || (index + 1),
                artist: this.cleanArtistName(item.artist),
                song: this.cleanSongName(item.song),
                genre: item.genre || this.determineGenre(item.artist, item.song),
                decade: this.determineDecade(item.artist),
                instrumentShape: item.shape || 'GUITAR', // Use the actual shape from database
                formats: item.formats || ['SVG', 'PDF', 'PNG', 'EPS'],
                price: this.standardPrice, // Always $3.00
                image: item.image || this.getImageForSong(item.artist, item.song),
                webp: item.webp,
                files: item.files,
                popularity: Math.floor(Math.random() * 1000) + 100,
                isNew: Math.random() < 0.1, // 10% chance of being new
                isFeatured: Math.random() < 0.05 // 5% chance of being featured
            };

            processedSongs.push(song);

            // Update genre and artist counts
            if (this.genres.has(song.genre)) {
                this.genres.set(song.genre, this.genres.get(song.genre) + 1);
            } else {
                this.genres.set(song.genre, 1);
            }
            
            if (this.artists.has(song.artist)) {
                this.artists.set(song.artist, this.artists.get(song.artist) + 1);
            } else {
                this.artists.set(song.artist, 1);
            }
        });

        this.songs = processedSongs;
        this.filteredSongs = [...this.songs];
    }

    cleanArtistName(artist) {
        if (!artist) return '';
        
        // Handle special cases and clean up artist names
        let cleaned = artist.trim()
            .replace(/^(THE |The )/i, '')
            .replace(/\s+/g, ' ')
            .replace(/[^a-zA-Z0-9\s&'-]/g, '');

        // Handle specific cases
        if (cleaned.includes('GUNS AND ROSES')) cleaned = 'GUNS N\' ROSES';
        if (cleaned.includes('LED ZEPELLIN')) cleaned = 'LED ZEPPELIN';
        if (cleaned.includes('LYNYRD SYNYRD')) cleaned = 'LYNYRD SKYNYRD';
        if (cleaned.includes('FOO FIGHERS')) cleaned = 'FOO FIGHTERS';
        if (cleaned.startsWith('Unknown')) cleaned = 'VARIOUS ARTISTS';

        return cleaned || 'UNKNOWN ARTIST';
    }

    cleanSongName(song) {
        if (!song) return '';
        
        return song.trim()
            .replace(/\s+/g, ' ')
            .replace(/[^a-zA-Z0-9\s'-]/g, '');
    }

    determineGenre(artist, song) {
        // Genre mapping based on artist patterns
        const genreMap = {
            'Rock': [
                'AC/DC', 'METALLICA', 'BLACK SABBATH', 'LED ZEPPELIN', 'QUEEN', 
                'GUNS N\' ROSES', 'LYNYRD SKYNYRD', 'PINK FLOYD', 'THE DOORS',
                'IRON MAIDEN', 'KISS', 'OZZY OSBOURNE', 'PEARL JAM', 'NIRVANA',
                'FOO FIGHTERS', 'GREEN DAY', 'THE BEATLES', 'ROLLING STONES',
                'CREAM', 'THE EAGLES', 'BOSTON', 'JOURNEY', 'RUSH', 'AEROSMITH',
                'ALICE IN CHAINS', 'CANDLEBOX', 'STONE TEMPLE PILOTS', 'GODSMACK',
                'FIVE FINGER DEATH PUNCH', 'DISTURBED', 'SHINEDOWN'
            ],
            'Country': [
                'GARTH BROOKS', 'KENNY CHESNEY', 'GEORGE STRAIT', 'TIM MCGRAW',
                'CARRIE UNDERWOOD', 'BLAKE SHELTON', 'CHRIS STAPLETON', 'LUKE COMBS',
                'MORGAN WALLEN', 'ZACH BRYAN', 'ALABAMA', 'HANK WILLIAMS JR',
                'JOHNNY CASH', 'WILLIE NELSON', 'DOLLY PARTON', 'KENNY ROGERS',
                'BRAD PAISLEY', 'ERIC CHURCH', 'THOMAS RHETT', 'JAKE OWEN',
                'LEE BRICE', 'BRANTLEY GILBERT', 'CODY JINKS', 'CODY JOHNSON',
                'BROOKS AND DUNN', 'RASCAL FLATTS', 'OLD DOMINION', 'JORDAN DAVIS',
                'ELVIE SHANE', 'JELLY ROLL', 'RILEY GREEN', 'COOPER ALAN'
            ],
            'Pop': [
                'TAYLOR SWIFT', 'ED SHEERAN', 'JUSTIN BIEBER', 'ELTON JOHN',
                'BILLY JOEL', 'PHIL COLLINS', 'BRYAN ADAMS', 'CHICAGO',
                'POST MALONE', 'GEORGE EZRA', 'TWENTY ONE PILOTS'
            ],
            'Alternative Rock': [
                'BRING ME THE HORIZON', 'FALLING IN REVERSE', 'PIERCE THE VEIL',
                'TAKING BACK SUNDAY', 'BLIND MELON', 'INCUBUS', 'RED HOT CHILI PEPPERS',
                'DAVE MATTHEWS BAND', 'WATERPARKS', 'NIGHTWISH'
            ],
            'Classic Rock': [
                'BOB SEGER', 'TOM PETTY', 'BRUCE SPRINGSTEEN', 'NEIL YOUNG',
                'VAN MORRISON', 'GORDON LIGHTFOOT', 'JOE WALSH', 'REO SPEEDWAGON',
                'DOOBIE BROTHERS', 'BLUE OYSTER CULT', 'TESLA', 'WHITESNAKE'
            ],
            'Folk/Singer-Songwriter': [
                'BOB MARLEY', 'JAMES TAYLOR', 'JOHN DENVER', 'JONI MITCHELL',
                'JACK JOHNSON', 'DAVE LOGGINS', 'ARLO GUTHRIE', 'GRATEFUL DEAD',
                'SIMON AND GARFUNKEL', 'CAROL KING', 'SARA BAREILLES'
            ],
            'Jazz/Standards': [
                'FRANK SINATRA', 'TONY BENNETT', 'HARRY CONNICK JR'
            ],
            'R&B/Soul': [
                'HEATWAVE', 'BARRY MANILOW', 'MICHEL BOLTON', 'TEDDY SWIMS'
            ],
            'Hip-Hop': [
                'DR FEAT SNOOP DOG'
            ],
            'Progressive': [
                'KING CRIMSON', 'JETHRO TULL', 'RUSH'
            ]
        };

        for (const [genre, artists] of Object.entries(genreMap)) {
            if (artists.some(a => artist.toUpperCase().includes(a.toUpperCase()))) {
                return genre;
            }
        }

        return 'Rock'; // Default genre
    }

    determineDecade(artist) {
        // Rough decade mapping based on artist peak popularity
        const decadeMap = {
            '2020s': ['MORGAN WALLEN', 'ZACH BRYAN', 'LUKE COMBS', 'POST MALONE', 'TAYLOR SWIFT'],
            '2010s': ['ED SHEERAN', 'TWENTY ONE PILOTS', 'IMAGINE DRAGONS'],
            '2000s': ['GREEN DAY', 'FOO FIGHTERS', 'NICKELBACK'],
            '90s': ['NIRVANA', 'PEARL JAM', 'ALICE IN CHAINS', 'STONE TEMPLE PILOTS'],
            '80s': ['GUNS N\' ROSES', 'METALLICA', 'BON JOVI', 'PRINCE'],
            '70s': ['LED ZEPPELIN', 'PINK FLOYD', 'QUEEN', 'AC/DC', 'LYNYRD SKYNYRD'],
            '60s': ['THE BEATLES', 'THE DOORS', 'ROLLING STONES']
        };

        for (const [decade, artists] of Object.entries(decadeMap)) {
            if (artists.some(a => artist.toUpperCase().includes(a.toUpperCase()))) {
                return decade;
            }
        }

        return '80s'; // Default decade
    }

    getImageForSong(artist, song) {
        // Return a placeholder image - in real implementation, this would fetch actual images
        const images = [
            'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3',
            'https://images.pixabay.com/photo/2016/11/23/15/48/audience-1853662_1280.jpg',
            'https://images.pexels.com/photos/164743/pexels-photo-164743.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3',
            'https://images.pixabay.com/photo/2017/08/10/08/47/music-2619264_1280.jpg',
            'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        ];
        
        // Use hash of artist + song to consistently return same image for same song
        const hash = (artist + song ).split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        
        return images[Math.abs(hash) % images.length];
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }

        // View toggle
        const gridView = document.getElementById('grid-view');
        const listView = document.getElementById('list-view');
        
        if (gridView) {
            gridView.addEventListener('click', () => {
                this.currentView = 'grid';
                this.updateViewButtons();
                this.renderCatalog();
            });
        }
        
        if (listView) {
            listView.addEventListener('click', () => {
                this.currentView = 'list';
                this.updateViewButtons();
                this.renderCatalog();
            });
        }

        // Genre filters
        const genreFilters = document.getElementById('genre-filters');
        if (genreFilters) {
            genreFilters.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    this.updateGenreFilters();
                    this.applyFilters();
                }
            });
        }

        // Instrument filters
        const instrumentFilters = document.getElementById('instrument-filters');
        if (instrumentFilters) {
            instrumentFilters.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    this.updateInstrumentFilters();
                    this.applyFilters();
                }
            });
        }
    }

    updateGenreFilters() {
        const checkboxes = document.querySelectorAll('#genre-filters input[type="checkbox"]');
        this.currentFilters.genres = [];
        
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const genre = checkbox.closest('label').querySelector('span').textContent.split(' (')[0];
                this.currentFilters.genres.push(genre);
            }
        });
    }

    updateInstrumentFilters() {
        const checkboxes = document.querySelectorAll('#instrument-filters input[type="checkbox"]');
        this.currentFilters.instruments = [];
        
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const displayName = checkbox.closest('label').querySelector('span').textContent.split(' (')[0];
                // Map display names to database values
                let databaseValue = displayName;
                if (displayName === 'Guitar') databaseValue = 'GUITAR';
                else if (displayName === 'Piano Keys') databaseValue = 'PIANO';
                else if (displayName === 'Cassette Tape') databaseValue = 'CASSETTE';
                
                this.currentFilters.instruments.push(databaseValue);
            }
        });
    }

    updateFiltersFromCheckboxes() {
        // Update genre filters
        const genreCheckboxes = document.querySelectorAll('#genre-filters input[type="checkbox"]');
        this.currentFilters.genres = [];
        genreCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const genre = checkbox.closest('label').querySelector('span').textContent.split(' (')[0];
                this.currentFilters.genres.push(genre);
            }
        });

        // Update instrument filters
        const instrumentCheckboxes = document.querySelectorAll('#instrument-filters input[type="checkbox"]');
        this.currentFilters.instruments = [];
        instrumentCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const displayName = checkbox.closest('label').querySelector('span').textContent.split(' (')[0];
                // Map display names to database values
                let databaseValue = displayName;
                if (displayName === 'Guitar') databaseValue = 'GUITAR';
                else if (displayName === 'Piano Keys') databaseValue = 'PIANO';
                else if (displayName === 'Cassette Tape') databaseValue = 'CASSETTE';
                
                this.currentFilters.instruments.push(databaseValue);
            }
        });
    }

    applyFilters() {
        this.filteredSongs = this.songs.filter(song => {
            // Search filter - make it case-insensitive
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const matchesSearch = song.artist.toLowerCase().includes(searchTerm) ||
                                    song.song.toLowerCase().includes(searchTerm);
                if (!matchesSearch) return false;
            }

            // Genre filter - make it case-insensitive
            if (this.currentFilters.genres.length > 0) {
                const songGenre = song.genre.toLowerCase();
                const hasMatchingGenre = this.currentFilters.genres.some(genre => 
                    genre.toLowerCase() === songGenre
                );
                if (!hasMatchingGenre) return false;
            }

            // Instrument filter - make it case-insensitive
            if (this.currentFilters.instruments.length > 0) {
                const songInstrument = song.instrumentShape.toLowerCase();
                const hasMatchingInstrument = this.currentFilters.instruments.some(instrument => 
                    instrument.toLowerCase() === songInstrument
                );
                if (!hasMatchingInstrument) return false;
            }

            return true;
        });

        // Reset pagination when filters change
        this.currentPage = 1;
        this.renderCatalog();
        this.updateResultsCount();
    }

    updateResultsCount() {
        const resultsCount = document.getElementById('results-count');
        if (resultsCount) {
            resultsCount.textContent = this.filteredSongs.length;
        }
    }

    updateViewButtons() {
        const gridView = document.getElementById('grid-view');
        const listView = document.getElementById('list-view');
        
        if (gridView && listView) {
            if (this.currentView === 'grid') {
                gridView.classList.add('text-accent', 'bg-accent/20');
                gridView.classList.remove('text-text-secondary');
                listView.classList.remove('text-accent', 'bg-accent/20');
                listView.classList.add('text-text-secondary');
            } else {
                listView.classList.add('text-accent', 'bg-accent/20');
                listView.classList.remove('text-text-secondary');
                gridView.classList.remove('text-accent', 'bg-accent/20');
                gridView.classList.add('text-text-secondary');
            }
        }
    }

    renderCatalog() {
        const catalogContainer = document.getElementById('catalog-container');
        if (!catalogContainer) return;

        if (this.currentView === 'grid') {
            this.renderGridView();
        } else {
            this.renderListView();
        }
    }

    renderGridView() {
        const catalogContainer = document.getElementById('catalog-container');
        if (!catalogContainer) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const songsToShow = this.filteredSongs.slice(startIndex, endIndex);

        // If it's the first page, replace content; otherwise, append
        if (this.currentPage === 1) {
            catalogContainer.innerHTML = songsToShow.map(song => this.renderSongCard(song)).join('');
        } else {
            catalogContainer.innerHTML += songsToShow.map(song => this.renderSongCard(song)).join('');
        }

        // Update load more button visibility
        this.updateLoadMoreButton();
    }

    updateLoadMoreButton() {
        const loadMoreContainer = document.getElementById('load-more-container');
        if (!loadMoreContainer) return;

        const totalItems = this.filteredSongs.length;
        const displayedItems = this.currentPage * this.itemsPerPage;
        this.hasMoreItems = displayedItems < totalItems;

        if (this.hasMoreItems) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }

    renderListView() {
        const catalogContainer = document.getElementById('catalog-container');
        if (!catalogContainer) return;

        const songsPerPage = 10;
        const currentPage = 1;
        const startIndex = (currentPage - 1) * songsPerPage;
        const endIndex = startIndex + songsPerPage;
        const songsToShow = this.filteredSongs.slice(startIndex, endIndex);

        catalogContainer.innerHTML = `
            <div class="space-y-4">
                ${songsToShow.map(song => this.renderSongListItem(song)).join('')}
            </div>
        `;
    }

    renderSongCard(song) {
        // Use the correct image paths from the database
        const imageSrc = '/' + song.image;
        const webpSrc = '/' + song.webp;
        
        // Store high-res path for OpenSeadragon
        const highResPath = '/' + song.webp;
        
        return `
            <div class="card-surface group cursor-pointer hover:border-accent transition-smooth" 
                 onclick="openDesignModal('${imageSrc}', '${song.song}', '${song.artist}', '${song.instrumentShape}', ${song.price}, '${highResPath}')">
                <div class="relative aspect-square overflow-hidden rounded-t-lg" style="background-color: white;">
                    <picture>
                        <source srcset="${webpSrc}" type="image/webp">
                        <img src="${imageSrc}" alt="${song.song} by ${song.artist}" 
                             class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                             style="padding: 8px;"
                             oncontextmenu="return false;"
                             draggable="false">
                    </picture>
                    
                    <!-- Zoom Button - Mobile friendly -->
                    <div class="absolute top-2 right-2 bg-accent text-white p-2 md:p-2 rounded-full opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 hover:opacity-100 transition-opacity duration-300 cursor-pointer touch-manipulation"
                         onclick="event.stopPropagation(); openProtectedDesignViewer('${highResPath}', '${song.song}', '${song.artist}')"
                         title="Zoom to see high-resolution details">
                        <span class="text-sm md:text-base">🔍</span>
                    </div>
                    
                    <!-- Purchase Button - Mobile friendly -->
                    <div class="absolute bottom-2 right-2 bg-accent text-white px-2 py-1 md:px-3 md:py-1 rounded-lg opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 hover:opacity-100 transition-opacity duration-300 cursor-pointer text-xs md:text-sm font-semibold touch-manipulation"
                         onclick="event.stopPropagation(); openDesignModal('${imageSrc}', '${song.song}', '${song.artist}', '${song.instrumentShape}', ${song.price}, '${highResPath}')"
                         title="Purchase this design">
                        $${song.price.toFixed(2)}
                    </div>
                    
                    ${song.isNew ? '<div class="absolute top-2 left-2 bg-accent text-primary text-xs px-2 py-1 rounded">NEW</div>' : ''}
                    ${song.isFeatured ? '<div class="absolute top-2 left-12 bg-yellow-500 text-primary text-xs px-2 py-1 rounded">FEATURED</div>' : ''}
                </div>
                <div class="p-3 md:p-4">
                    <h3 class="font-montserrat font-semibold text-base md:text-lg mb-1 truncate">${song.song}</h3>
                    <p class="text-text-secondary text-xs md:text-sm mb-2">${song.artist}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-accent font-bold text-sm md:text-base">$${song.price.toFixed(2)}</span>
                        <div class="flex space-x-1">
                            ${song.formats.map(format => `<span class="bg-surface text-xs px-1 md:px-2 py-0.5 md:py-1 rounded">${format}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSongListItem(song) {
        // Use the correct image paths from the database
        const imageSrc = '/' + song.image;
        const webpSrc = '/' + song.webp;
        const highResPath = '/' + song.webp;
        
        return `
            <div class="card-surface p-4 flex items-center space-x-4 group cursor-pointer hover:border-accent transition-smooth"
                 onclick="openDesignModal('${imageSrc}', '${song.song}', '${song.artist}', '${song.instrumentShape}', ${song.price}, '${highResPath}')">
                <div class="relative w-20 h-20 flex-shrink-0 rounded" style="background-color: white;">
                    <picture>
                        <source srcset="${webpSrc}" type="image/webp">
                        <img src="${imageSrc}" alt="${song.song} by ${song.artist}" 
                             class="w-full h-full object-contain rounded" style="padding: 4px;"
                             oncontextmenu="return false;"
                             draggable="false">
                    </picture>
                </div>
                <div class="flex-1">
                    <h3 class="font-montserrat font-semibold text-lg">${song.song}</h3>
                    <p class="text-text-secondary">${song.artist}</p>
                    <div class="flex items-center space-x-2 mt-1">
                        <span class="text-xs bg-surface px-2 py-1 rounded">${song.genre}</span>
                        <span class="text-xs bg-surface px-2 py-1 rounded">${song.instrumentShape}</span>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-accent font-bold text-lg">$${song.price.toFixed(2)}</div>
                    <div class="flex space-x-1 mt-1">
                        ${song.formats.map(format => `<span class="bg-surface text-xs px-1 py-0.5 rounded">${format}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    updateFilters() {
        this.updateGenreFilterCounts();
        this.updateInstrumentFilterCounts();
    }

    updateGenreFilterCounts() {
        const genreLabels = document.querySelectorAll('#genre-filters label span');
        genreLabels.forEach(label => {
            const genre = label.textContent.split(' (')[0];
            const count = this.genres.get(genre) || 0;
            label.textContent = `${genre} (${count})`;
        });
    }

    updateInstrumentFilterCounts() {
        const instrumentLabels = document.querySelectorAll('#instrument-filters label span');
        instrumentLabels.forEach(label => {
            const instrument = label.textContent.split(' (')[0];
            let count = 0;
            
            // Map the display names to the database values
            if (instrument === 'Guitar') {
                count = this.songs.filter(song => song.instrumentShape === 'GUITAR').length;
            } else if (instrument === 'Piano Keys') {
                count = this.songs.filter(song => song.instrumentShape === 'PIANO').length;
            } else if (instrument === 'Cassette Tape') {
                count = this.songs.filter(song => song.instrumentShape === 'CASSETTE').length;
            }
            
            label.textContent = `${instrument} (${count})`;
        });
    }
}

// Global function for opening design modal
function openDesignModal(imageSrc, songTitle, artistName, shape, price, highResPath) {
    // Use WebP for display, high-res path for zoom
    let correctedImageSrc = imageSrc;
    if (!correctedImageSrc.startsWith('/')) {
        correctedImageSrc = '/' + correctedImageSrc;
    }
    
    // Use high-res path for zoom functionality
    let correctedHighResPath = highResPath || imageSrc;
    if (!correctedHighResPath.startsWith('/')) {
        correctedHighResPath = '/' + correctedHighResPath;
    }
    
    // Create modal HTML with proper inline styles
    const modalHTML = `
        <div id="design-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 8px;">
            <div style="position: relative; width: 100%; max-width: 400px; background-color: white; border-radius: 8px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); max-height: 95vh; overflow-y: auto;">
                <!-- Close button -->
                <button onclick="closeDesignModal()" style="position: absolute; top: 8px; right: 8px; z-index: 10; padding: 8px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.9); color: #6B7280; border: none; cursor: pointer;">
                    <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                
                <div style="padding: 16px;">
                    <!-- Header -->
                    <div style="margin-bottom: 16px; padding-right: 40px;">
                        <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin: 0 0 4px 0;">${songTitle}</h2>
                        <p style="font-size: 14px; color: #6B7280; margin: 0;">by ${artistName}</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <!-- Image Section -->
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background-color: white; border: 1px solid #E5E7EB; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                                <picture>
                                    <source srcset="${correctedImageSrc}" type="image/webp">
                                    <img src="${correctedImageSrc.replace('.webp', '.png')}" alt="${songTitle}" 
                                         style="width: 100%; height: 100%; object-fit: contain; padding: 12px;"
                                         oncontextmenu="return false;"
                                         draggable="false">
                                </picture>
                                
                                <!-- Zoom Button -->
                                <div style="position: absolute; top: 8px; right: 8px; background-color: #2563EB; color: white; padding: 8px; border-radius: 50%; cursor: pointer; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
                                     onclick="openProtectedDesignViewer('${correctedHighResPath}', '${songTitle}', '${artistName}')"
                                     title="Zoom to see high-resolution details">
                                    <span style="font-size: 14px;">🔍</span>
                                </div>
                            </div>
                            
                            <!-- Tags -->
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                <span style="background-color: #DBEAFE; color: #1E40AF; font-size: 12px; padding: 4px 8px; border-radius: 4px;">${shape}</span>
                                <span style="background-color: #D1FAE5; color: #065F46; font-size: 12px; padding: 4px 8px; border-radius: 4px;">High Quality</span>
                            </div>
                        </div>
                        
                        <!-- Details Section -->
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <!-- Price -->
                            <div style="font-size: 24px; font-weight: bold; color: #2563EB;">$${price.toFixed(2)}</div>
                            
                            <!-- Description -->
                            <p style="font-size: 14px; color: #6B7280; line-height: 1.5; margin: 0;">
                                This high-quality digital design is perfect for printing, vinyl cutting, 
                                embroidery, laser engraving, or any other creative project. Each design 
                                comes in multiple formats to ensure compatibility with your preferred software.
                            </p>
                            
                            <!-- Formats -->
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <h4 style="font-weight: 600; font-size: 14px; color: #111827; margin: 0;">Available Formats:</h4>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    <span style="background-color: #F3F4F6; color: #374151; font-size: 12px; padding: 4px 8px; border-radius: 4px;">SVG</span>
                                    <span style="background-color: #F3F4F6; color: #374151; font-size: 12px; padding: 4px 8px; border-radius: 4px;">PDF</span>
                                    <span style="background-color: #F3F4F6; color: #374151; font-size: 12px; padding: 4px 8px; border-radius: 4px;">PNG</span>
                                    <span style="background-color: #F3F4F6; color: #374151; font-size: 12px; padding: 4px 8px; border-radius: 4px;">EPS</span>
                                </div>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div style="display: flex; flex-direction: column; gap: 12px; padding-top: 8px;">
                                <button style="width: 100%; background-color: #2563EB; color: white; padding: 12px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 14px; transition: background-color 0.2s;" 
                                        onmouseover="this.style.backgroundColor='#1D4ED8'" 
                                        onmouseout="this.style.backgroundColor='#2563EB'"
                                        onclick="addToCart('${songTitle}', ${price})">
                                    Add to Cart
                                </button>
                                <button style="width: 100%; background-color: #059669; color: white; padding: 12px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 14px; transition: background-color 0.2s;" 
                                        onmouseover="this.style.backgroundColor='#047857'" 
                                        onmouseout="this.style.backgroundColor='#059669'"
                                        onclick="buyNow('${songTitle}', ${price})">
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = '';
    
    // Add click outside to close functionality
    const modal = document.getElementById('design-modal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeDesignModal();
        }
    });
    
    // Add escape key to close functionality
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDesignModal();
        }
    });
}

function closeDesignModal() {
    const modal = document.getElementById('design-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Add to cart functionality
async function addToCart(songTitle, price) {
    const id = songTitle.toLowerCase().replace(/\s+/g, '-');
    await fetch('/api/cart/add', {
            method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, qty: 1, price })
        });
    updateCartBadge();
}

// Buy now functionality
async function buyNow(songTitle, price) {
    await addToCart(songTitle, price);
    location.href = '/checkout';
}

// Update cart badge function
async function updateCartBadge() {
    try {
        console.log('🛒 Updating cart badge...');
        const response = await fetch('/api/cart/count', { credentials: 'include' });
        const data = await response.json();
        console.log('🛒 Cart count data:', data);
        
        const cartCount = document.getElementById('cart-count');
        if (!cartCount) {
            console.error('❌ Cart count element not found!');
            return;
        }
        
        const count = data.count || 0;
        console.log('🛒 Cart count:', count);
        
        cartCount.textContent = count;
        // Always show the cart count, even when 0
        cartCount.classList.remove('hidden');
        console.log('✅ Cart count updated to:', count);
    } catch (error) {
        console.error('❌ Error updating cart count:', error);
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.classList.add('hidden');
        }
    }
}

// Show notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Clear all filters function
function clearAllFilters() {
    // Reset search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Reset checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset filters and reapply
    if (window.songCatalog) {
        window.songCatalog.currentFilters = {
            search: '',
            genres: [],
            instruments: [],
            artists: [],
            decades: [],
            colors: []
        };
        window.songCatalog.applyFilters();
    }
}

// Function to open protected design viewer
function openProtectedDesignViewer(imagePath, songTitle, artistName) {
    console.log('Opening protected design viewer:', imagePath);
    
    if (typeof window.createProtectedViewer === 'undefined') {
        console.error('Protected image viewer not loaded');
        alert('Image viewer not available. Please refresh the page.');
        return;
    }

    // Create modal HTML
    const modalHTML = `
        <div id="protected-viewer-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 8px;">
            <div style="position: relative; width: 100%; height: 100%; max-width: 1200px; max-height: 95vh; background-color: white; border-radius: 8px; overflow: hidden;">
                <!-- Header -->
                <div style="position: absolute; top: 0; left: 0; right: 0; background: linear-gradient(to right, #2563EB, #1D4ED8); color: white; padding: 12px; z-index: 10;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1; min-width: 0;">
                            <h2 style="font-size: 18px; font-weight: bold; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${songTitle}</h2>
                            <p style="font-size: 12px; opacity: 0.9; margin: 4px 0 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${artistName}</p>
                        </div>
                        <button onclick="closeProtectedViewerModal()" style="color: white; background: none; border: none; font-size: 24px; font-weight: bold; cursor: pointer; margin-left: 8px; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                            ×
                        </button>
                    </div>
                </div>
                
                <!-- Protected Viewer Container -->
                <div id="protected-viewer-container" style="width: 100%; height: 100%; margin-top: 60px; background-color: white;"></div>
                
                <!-- Instructions -->
                <div style="position: absolute; bottom: 8px; left: 8px; right: 8px; background-color: rgba(0, 0, 0, 0.75); color: white; padding: 8px; border-radius: 8px; font-size: 12px; text-align: center;">
                    <p style="margin: 0;">🔍 Scroll to zoom • 🖱️ Drag to pan • 📱 Pinch to zoom on mobile • 🛡️ Image protected</p>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Initialize protected viewer
    setTimeout(() => {
        try {
            console.log('🔍 About to call createProtectedViewer...');
            console.log('🔍 createProtectedViewer function available:', typeof window.createProtectedViewer);
            console.log('🔍 OpenSeadragon available:', typeof OpenSeadragon);
            
            window.createProtectedViewer('protected-viewer-container', imagePath);
            console.log('✅ Protected viewer initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing protected viewer:', error);
            alert('Error loading image viewer. Please try again.');
        }
    }, 100);
}

// Close protected viewer modal
function closeProtectedViewerModal() {
    const modal = document.getElementById('protected-viewer-modal');
    if (modal) {
        modal.remove();
    }
}

// Load more songs function
function loadMoreSongs() {
    if (window.songCatalog && window.songCatalog.hasMoreItems) {
        window.songCatalog.currentPage++;
        window.songCatalog.renderGridView();
    }
}

// Magnifying Glass Functionality
function initializeMagnifier() {
    const magnifierContainers = document.querySelectorAll('.magnifier-container');
    
    magnifierContainers.forEach(container => {
        const img = container.querySelector('img');
        const lens = container.querySelector('.magnifier-lens');
        
        if (!img || !lens) return;
        
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate lens position
            const lensSize = 150; // Match CSS
            const lensX = x - lensSize / 2;
            const lensY = y - lensSize / 2;
            
            // Keep lens within container bounds
            const maxX = rect.width - lensSize;
            const maxY = rect.height - lensSize;
            
            lens.style.left = Math.max(0, Math.min(lensX, maxX)) + 'px';
            lens.style.top = Math.max(0, Math.min(lensY, maxY)) + 'px';
            
            // Calculate zoom position
            const zoomLevel = 20; // 20x zoom
            const zoomX = (x / rect.width) * 100;
            const zoomY = (y / rect.height) * 100;
            
            // Set background position for zoom effect
            lens.style.backgroundImage = `url(${img.dataset.zoomSrc || img.src})`;
            lens.style.backgroundPosition = `${-x * zoomLevel + lensSize/2}px ${-y * zoomLevel + lensSize/2}px`;
        });
        
        // Hide lens when mouse leaves
        container.addEventListener('mouseleave', () => {
            lens.style.opacity = '0';
        });
        
        // Show lens when mouse enters
        container.addEventListener('mouseenter', () => {
            lens.style.opacity = '1';
        });
    });
}

// Initialize magnifier when catalog is rendered
const originalRenderCatalog = SongCatalogManager.prototype.renderCatalog;
SongCatalogManager.prototype.renderCatalog = function() {
    originalRenderCatalog.call(this);
    // Initialize magnifier after rendering
    setTimeout(initializeMagnifier, 100);
};

// Initialize magnifier on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeMagnifier, 500);
});

// Initialize the catalog when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.songCatalog = new SongCatalogManager();
});
