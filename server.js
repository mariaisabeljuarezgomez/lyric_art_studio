const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve JSON files with proper MIME type
app.get('*.json', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for homepage
app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/homepage.html'));
});

// Route for browse gallery
app.get('/browse', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/browse_gallery.html'));
});

// Route for artist profiles
app.get('/artist-profiles', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/artist_profiles.html'));
});

// Route for contact page
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/contact.html'));
});

// Route for about page
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/about.html'));
});

// Route for terms page
app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/terms.html'));
});

// Route for privacy page
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/privacy.html'));
});

// Route for my collection dashboard
app.get('/my-collection', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/my_collection_dashboard.html'));
});

// API route to serve the designs database
app.get('/api/designs', (req, res) => {
    res.sendFile(path.join(__dirname, 'designs-database.json'));
});

// API route to serve the song catalog
app.get('/api/song-catalog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/song-catalog.js'));
});

// Favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content response
});

// Handle 404s with a proper 404 page
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>404 - Page Not Found</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    height: 100vh;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
                h1 { font-size: 3rem; margin-bottom: 20px; }
                p { font-size: 1.2rem; margin-bottom: 30px; }
                a { 
                    color: #ff6b6b; 
                    text-decoration: none; 
                    font-weight: bold;
                    padding: 10px 20px;
                    border: 2px solid #ff6b6b;
                    border-radius: 5px;
                    transition: all 0.3s;
                }
                a:hover { 
                    background: #ff6b6b; 
                    color: white; 
                }
            </style>
        </head>
        <body>
            <h1>404</h1>
            <p>Oops! The page you're looking for doesn't exist.</p>
            <a href="/homepage">Go to Homepage</a>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 LyricArt Studio server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🎵 Designs database available at: http://localhost:${PORT}/api/designs`);
    console.log(`🏠 Homepage: http://localhost:${PORT}/homepage`);
    console.log(`🖼️  Gallery: http://localhost:${PORT}/browse`);
    console.log(`👥 Artist Profiles: http://localhost:${PORT}/artist-profiles`);
    console.log(`📞 Contact: http://localhost:${PORT}/contact`);
    console.log(`ℹ️  About: http://localhost:${PORT}/about`);
    console.log(`📋 Terms: http://localhost:${PORT}/terms`);
    console.log(`🔒 Privacy: http://localhost:${PORT}/privacy`);
    console.log(`\n💡 Press Ctrl+C to stop the server`);
}); 