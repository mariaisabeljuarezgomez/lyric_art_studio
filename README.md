# LyricArt Studio - Digital Music Design Marketplace

A premium digital marketplace for music-inspired lyric art designs in SVG, PDF, PNG, and EPS formats.

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm start
   ```
   or
   ```bash
   node server.js
   ```

3. **Access Your Website**
   - Open your browser and go to: `http://localhost:3001`
   - The server will automatically serve your files and handle CORS issues

## 📁 Project Structure

```
LYRIC STUDIO WEBSITE/
├── index.html                 # Main entry point (redirects to homepage)
├── pages/
│   ├── homepage.html          # Main homepage with featured designs
│   ├── browse_gallery.html    # Gallery with search and filters
│   └── artist_profiles.html   # Artist information pages
├── public/
│   └── song-catalog.js        # JavaScript for managing design data
├── css/
│   └── main.css              # Main stylesheet
├── images/
│   └── designs/              # Optimized WebP images for web
├── music_lyricss/            # Original high-resolution files (never modify)
├── designs-database.json     # Complete design database
├── server.js                 # Local development server
└── package.json              # Project dependencies
```

## 🎵 Features

- **430+ Designs**: Complete database of lyric art designs
- **Multiple Formats**: SVG, PDF, PNG, EPS for all designs
- **Real-time Search**: Search by song, artist, or lyrics
- **Genre Filtering**: Filter by Rock, Country, Pop, etc.
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Optimized Images**: WebP format with PNG fallback
- **$3.00 Pricing**: Consistent pricing across all designs

## 🔧 Development

### Running the Server
The local server solves CORS issues when developing locally:
- Serves static files from the project root
- Provides API endpoint for the designs database
- Handles proper MIME types for JSON files

### File Structure Notes
- **Original Files**: `music_lyricss/` contains the original high-resolution files (never modify)
- **Web Images**: `images/designs/` contains optimized WebP images for web display
- **Database**: `designs-database.json` contains all design metadata and file paths

## 📊 Current Stats

- **Total Designs**: 430+
- **Artists**: 100+
- **Genres**: Rock, Country, Pop, Alternative Rock, Classic Rock, Reggae
- **Shapes**: Guitar, Piano, Cassette, Heart, Circle, Square
- **Price**: $3.00 per design

## 🛠️ Technical Stack

- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: JSON-based design catalog
- **Images**: WebP optimization with PNG fallback
- **Server**: Local Express server for development

## 📝 Copyright Notice

All song titles, lyrics, and artist names are trademarks and copyrights of their respective owners. These designs are sold as artistic interpretations for personal, non-commercial use only. No commercial rights to the underlying musical works are conveyed with purchase.

## 🚀 Next Steps

1. **Test the Website**: Visit `http://localhost:3001` to see your designs
2. **Browse Gallery**: Check out the search and filtering functionality
3. **Future Development**: Add payment processing, user accounts, and download functionality

---

**Note**: This is a development setup. For production, you'll want to deploy to a proper web server with HTTPS and additional security measures.
