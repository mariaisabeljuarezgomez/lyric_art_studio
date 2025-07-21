
// Cache headers middleware
app.use((req, res, next) => {
    // Cache static assets for 1 year
    if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|webp)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Cache HTML for 1 hour
    else if (req.path.match(/\.html$/)) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    // Cache API responses for 5 minutes
    else if (req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'public, max-age=300');
    }
    next();
});
        