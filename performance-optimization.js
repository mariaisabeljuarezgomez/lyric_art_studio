// Performance Optimization for LyricArt Studio Website
// Fixes render blocking issues and improves PageSpeed score

const fs = require('fs');
const path = require('path');

class PerformanceOptimizer {
    constructor() {
        this.projectRoot = __dirname;
    }

    // 1.1.1: Inline critical CSS
    async inlineCriticalCSS() {
        console.log('🔧 Inlining critical CSS...');
        
        const criticalCSS = `
/* Critical CSS for above-the-fold content */
:root {
    --primary: #667eea;
    --secondary: #764ba2;
    --accent: #f093fb;
    --surface: #ffffff;
    --text-primary: #1a1a1a;
    --text-secondary: #666666;
    --border-subtle: #e5e5e5;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.6;
    color: var(--text-primary);
    background: var(--surface);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.header {
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    color: white;
    padding: 1rem 0;
}

.nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.hero {
    text-align: center;
    padding: 4rem 0;
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    color: white;
}

.btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: var(--accent);
    color: white;
    text-decoration: none;
    border-radius: 0.5rem;
    transition: all 0.3s ease;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Loading states */
.loading {
    opacity: 0.7;
    pointer-events: none;
}

/* Responsive design */
@media (max-width: 768px) {
    .container {
        padding: 0 0.5rem;
    }
    
    .hero {
        padding: 2rem 0;
    }
}
        `;

        return criticalCSS;
    }

    // 1.1.2: Defer non-critical JavaScript
    async createDeferredJS() {
        console.log('🔧 Creating deferred JavaScript loader...');
        
        const deferredJS = `
// Deferred JavaScript loader
function loadDeferredScripts() {
    const scripts = [
        '/public/song-catalog.js',
        '/public/openseadragon-viewer.js'
    ];
    
    scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        document.head.appendChild(script);
    });
}

// Load scripts after page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDeferredScripts);
} else {
    loadDeferredScripts();
}
        `;

        return deferredJS;
    }

    // 1.1.3: Optimize font loading
    async optimizeFontLoading() {
        console.log('🔧 Optimizing font loading...');
        
        const fontOptimization = `
<!-- Preload critical fonts -->
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap"></noscript>

<!-- Defer non-critical fonts -->
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap"></noscript>

<link rel="preload" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap"></noscript>
        `;

        return fontOptimization;
    }

    // 1.1.4: Add preconnect hints
    async addPreconnectHints() {
        console.log('🔧 Adding preconnect hints...');
        
        const preconnectHints = `
<!-- Preconnect to external domains -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://openseadragon.github.io">
<link rel="preconnect" href="https://static.rocket.new">
        `;

        return preconnectHints;
    }

    // 1.2.1: Implement lazy loading
    async createLazyLoading() {
        console.log('🔧 Creating lazy loading implementation...');
        
        const lazyLoadingJS = `
// Lazy loading for images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', lazyLoadImages);
        `;

        return lazyLoadingJS;
    }

    // 1.3.1: Add cache headers
    async createCacheHeaders() {
        console.log('🔧 Creating cache headers configuration...');
        
        const cacheHeaders = `
// Cache headers middleware
app.use((req, res, next) => {
    // Cache static assets for 1 year
    if (req.path.match(/\\.(css|js|png|jpg|jpeg|gif|ico|svg|webp)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Cache HTML for 1 hour
    else if (req.path.match(/\\.html$/)) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    // Cache API responses for 5 minutes
    else if (req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'public, max-age=300');
    }
    next();
});
        `;

        return cacheHeaders;
    }

    // Generate optimized HTML template
    async generateOptimizedHTML() {
        console.log('🔧 Generating optimized HTML template...');
        
        const criticalCSS = await this.inlineCriticalCSS();
        const preconnectHints = await this.addPreconnectHints();
        const fontOptimization = await this.optimizeFontLoading();
        
        const optimizedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Lyric Art Studio - Where Lyrics Become Art</title>
    <meta name="description" content="Transform your favorite song lyrics into stunning visual art. Download high-quality SVG, PDF, PNG, and EPS designs for your creative projects.">
    
    ${preconnectHints}
    ${fontOptimization}
    
    <!-- Critical CSS inlined -->
    <style>${criticalCSS}</style>
    
    <!-- Defer non-critical CSS -->
    <link rel="preload" href="/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="/css/main.css"></noscript>
    
    <!-- Defer OpenDragon -->
    <link rel="preload" href="https://openseadragon.github.io/openseadragon/openseadragon.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://openseadragon.github.io/openseadragon/openseadragon.css"></noscript>
</head>
<body>
    <!-- Your existing HTML content here -->
    
    <!-- Deferred JavaScript -->
    <script>
        ${await this.createDeferredJS()}
        ${await this.createLazyLoading()}
    </script>
    
    <!-- Load OpenDragon after page load -->
    <script>
        window.addEventListener('load', function() {
            const script = document.createElement('script');
            script.src = 'https://openseadragon.github.io/openseadragon/openseadragon.min.js';
            document.head.appendChild(script);
        });
    </script>
</body>
</html>`;

        return optimizedHTML;
    }

    // Apply all optimizations
    async applyAllOptimizations() {
        console.log('🚀 Applying all performance optimizations...');
        
        try {
            // Generate optimized files
            const optimizedHTML = await this.generateOptimizedHTML();
            const cacheHeaders = await this.createCacheHeaders();
            
            // Save optimized HTML template
            fs.writeFileSync(path.join(this.projectRoot, 'optimized-template.html'), optimizedHTML);
            
            // Create cache middleware file
            fs.writeFileSync(path.join(this.projectRoot, 'cache-middleware.js'), cacheHeaders);
            
            console.log('✅ Performance optimizations completed!');
            console.log('📁 Generated files:');
            console.log('  - optimized-template.html');
            console.log('  - cache-middleware.js');
            
            return true;
        } catch (error) {
            console.error('❌ Error applying optimizations:', error);
            return false;
        }
    }
}

// Run optimizations if called directly
if (require.main === module) {
    const optimizer = new PerformanceOptimizer();
    optimizer.applyAllOptimizations();
}

module.exports = PerformanceOptimizer; 