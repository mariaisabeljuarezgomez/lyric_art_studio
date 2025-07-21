// Server-Side Image Protection Middleware
// Prevents direct access to high-resolution images and implements download protection

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class ImageProtectionMiddleware {
    constructor() {
        this.protectedPaths = [
            '/images/designs/',
            '/music_lyricss/'
        ];
        this.allowedReferrers = [
            'lyricartstudio-production.up.railway.app',
            'localhost:3001',
            '127.0.0.1:3001',
            'localhost',
            '127.0.0.1'
        ];
        this.downloadTokens = new Map();
    }

    // Generate secure download token
    generateDownloadToken(userId, imagePath, expiresIn = 300000) { // 5 minutes
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + expiresIn;
        
        this.downloadTokens.set(token, {
            userId,
            imagePath,
            expiresAt,
            used: false
        });

        // Clean up expired tokens
        this.cleanupExpiredTokens();

        return token;
    }

    // Validate download token
    validateDownloadToken(token, userId) {
        const tokenData = this.downloadTokens.get(token);
        
        if (!tokenData) {
            return { valid: false, reason: 'Invalid token' };
        }

        if (tokenData.expiresAt < Date.now()) {
            this.downloadTokens.delete(token);
            return { valid: false, reason: 'Token expired' };
        }

        if (tokenData.used) {
            return { valid: false, reason: 'Token already used' };
        }

        if (tokenData.userId !== userId) {
            return { valid: false, reason: 'Token user mismatch' };
        }

        return { valid: true, imagePath: tokenData.imagePath };
    }

    // Mark token as used
    markTokenUsed(token) {
        const tokenData = this.downloadTokens.get(token);
        if (tokenData) {
            tokenData.used = true;
        }
    }

    // Clean up expired tokens
    cleanupExpiredTokens() {
        const now = Date.now();
        for (const [token, data] of this.downloadTokens.entries()) {
            if (data.expiresAt < now) {
                this.downloadTokens.delete(token);
            }
        }
    }

    // Check if path should be protected
    isProtectedPath(filePath) {
        return this.protectedPaths.some(protectedPath => 
            filePath.includes(protectedPath)
        );
    }

    // Validate referrer
    isValidReferrer(referer) {
        // Allow access if no referrer (development environment)
        if (!referer) return true;
        
        try {
            const url = new URL(referer);
            return this.allowedReferrers.some(allowed => 
                url.hostname.includes(allowed)
            );
        } catch (error) {
            return false;
        }
    }

    // Main protection middleware
    protectImages() {
        return (req, res, next) => {
            const filePath = req.path;
            
            // Check if this is a protected image
            if (this.isProtectedPath(filePath)) {
                return this.handleProtectedImage(req, res, next);
            }
            
            next();
        };
    }

    // Handle protected image requests
    handleProtectedImage(req, res, next) {
        const filePath = req.path;
        const referer = req.get('Referer');
        const userAgent = req.get('User-Agent');

        // Block direct access attempts
        if (!this.isValidReferrer(referer)) {
            console.log(`🚫 Blocked direct access to: ${filePath} from ${req.ip}`);
            return res.status(403).json({
                error: 'Direct access not allowed',
                message: 'Images must be accessed through the website'
            });
        }

        // Block suspicious user agents
        if (this.isSuspiciousUserAgent(userAgent)) {
            console.log(`🚫 Blocked suspicious user agent: ${userAgent}`);
            return res.status(403).json({
                error: 'Access denied',
                message: 'Suspicious request detected'
            });
        }

        // Add protection headers
        this.addProtectionHeaders(res);

        // Continue with request
        next();
    }

    // Check for suspicious user agents
    isSuspiciousUserAgent(userAgent) {
        if (!userAgent) return true;

        const suspiciousPatterns = [
            /bot/i,
            /crawler/i,
            /spider/i,
            /scraper/i,
            /curl/i,
            /wget/i,
            /python/i,
            /java/i,
            /perl/i,
            /ruby/i,
            /php/i,
            /node/i
        ];

        return suspiciousPatterns.some(pattern => pattern.test(userAgent));
    }

    // Add protection headers
    addProtectionHeaders(res) {
        res.set({
            'X-Content-Type-Options': 'nosniff',
            // Temporarily disabled for development debugging
            // 'X-Frame-Options': 'DENY',
            'X-Download-Options': 'noopen',
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
    }

    // Secure download endpoint
    secureDownload() {
        return async (req, res) => {
            try {
                const { token } = req.params;
                const userId = req.user?.id;

                if (!userId) {
                    return res.status(401).json({
                        error: 'Authentication required'
                    });
                }

                // Validate token
                const validation = this.validateDownloadToken(token, userId);
                if (!validation.valid) {
                    return res.status(403).json({
                        error: 'Invalid download token',
                        reason: validation.reason
                    });
                }

                const { imagePath } = validation;
                const fullPath = path.join(process.cwd(), imagePath);

                // Check if file exists
                if (!fs.existsSync(fullPath)) {
                    return res.status(404).json({
                        error: 'File not found'
                    });
                }

                // Mark token as used
                this.markTokenUsed(token);

                // Stream file with protection
                const stat = fs.statSync(fullPath);
                const fileSize = stat.size;
                const range = req.headers.range;

                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                    const chunksize = (end - start) + 1;
                    const file = fs.createReadStream(fullPath, { start, end });
                    const head = {
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunksize,
                        'Content-Type': 'application/octet-stream',
                        'Content-Disposition': 'attachment; filename="protected-design"',
                        ...this.addProtectionHeaders(res)
                    };
                    res.writeHead(206, head);
                    file.pipe(res);
                } else {
                    const head = {
                        'Content-Length': fileSize,
                        'Content-Type': 'application/octet-stream',
                        'Content-Disposition': 'attachment; filename="protected-design"',
                        ...this.addProtectionHeaders(res)
                    };
                    res.writeHead(200, head);
                    fs.createReadStream(fullPath).pipe(res);
                }

            } catch (error) {
                console.error('Download error:', error);
                res.status(500).json({
                    error: 'Download failed',
                    message: 'An error occurred during download'
                });
            }
        };
    }

    // Generate secure preview URL
    generatePreviewUrl(imagePath, userId) {
        const token = this.generateDownloadToken(userId, imagePath, 60000); // 1 minute for preview
        return `/api/preview/${token}`;
    }

    // Generate secure download URL
    generateDownloadUrl(imagePath, userId) {
        const token = this.generateDownloadToken(userId, imagePath, 300000); // 5 minutes for download
        return `/api/download/${token}`;
    }

    // Rate limiting for image requests
    rateLimit() {
        const requests = new Map();
        
        return (req, res, next) => {
            const ip = req.ip;
            const now = Date.now();
            const windowMs = 60000; // 1 minute
            const maxRequests = 100; // Max 100 requests per minute

            if (!requests.has(ip)) {
                requests.set(ip, []);
            }

            const userRequests = requests.get(ip);
            const validRequests = userRequests.filter(time => now - time < windowMs);

            if (validRequests.length >= maxRequests) {
                return res.status(429).json({
                    error: 'Too many requests',
                    message: 'Rate limit exceeded'
                });
            }

            validRequests.push(now);
            requests.set(ip, validRequests);

            next();
        };
    }

    // Log suspicious activity
    logSuspiciousActivity(req, reason) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            referer: req.get('Referer'),
            path: req.path,
            reason: reason
        };

        console.log('🚨 Suspicious Activity:', JSON.stringify(logEntry, null, 2));
        
        // Could save to file or send to monitoring service
        fs.appendFileSync('suspicious-activity.log', JSON.stringify(logEntry) + '\n');
    }
}

// Export middleware
module.exports = ImageProtectionMiddleware; 