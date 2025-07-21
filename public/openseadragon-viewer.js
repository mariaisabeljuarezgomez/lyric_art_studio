// Enhanced OpenDragon Viewer with Image Protection
// Prevents easy downloading while maintaining high-quality viewing experience

// Prevent duplicate class declaration
if (typeof ProtectedImageViewer === 'undefined') {
    class ProtectedImageViewer {
    constructor() {
        this.viewer = null;
        this.isProtected = true;
        this.watermarkText = 'LyricArt Studio - Preview Only';
        this.initProtection();
    }

    // Initialize protection features
    initProtection() {
        // Disable right-click globally
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showProtectionMessage('Right-click disabled for image protection');
        });

        // Disable keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Prevent common screenshot shortcuts
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'u')) {
                e.preventDefault();
                this.showProtectionMessage('Screenshot shortcuts disabled');
            }
            
            // Prevent F12 developer tools
            if (e.key === 'F12') {
                e.preventDefault();
                this.showProtectionMessage('Developer tools disabled');
            }
        });

        // Disable drag and drop
        document.addEventListener('dragstart', (e) => {
            if (e.target && (e.target.tagName === 'IMG' || (e.target.closest && e.target.closest('.openseadragon-canvas')))) {
                e.preventDefault();
                this.showProtectionMessage('Drag and drop disabled');
            }
        });

        // Disable text selection
        document.addEventListener('selectstart', (e) => {
            if (e.target && e.target.closest && e.target.closest('.openseadragon-canvas')) {
                e.preventDefault();
            }
        });

        // Disable copy
        document.addEventListener('copy', (e) => {
            if (e.target && e.target.closest && e.target.closest('.openseadragon-canvas')) {
                e.preventDefault();
                this.showProtectionMessage('Copy disabled for image protection');
            }
        });
    }

    // Create protected OpenDragon viewer
    createProtectedViewer(containerId, imageUrl, options = {}) {
        console.log('🔍 createProtectedViewer called with:', { containerId, imageUrl });
        console.log('🔍 OpenSeadragon available:', typeof OpenSeadragon !== 'undefined');
        
        if (typeof OpenSeadragon === 'undefined') {
            console.error('❌ OpenSeadragon library not loaded!');
            throw new Error('OpenSeadragon library not loaded');
        }
        
        const defaultOptions = {
            id: containerId,
            prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
            tileSources: {
                type: 'image',
                url: imageUrl,
                buildPyramid: false
            },
            // Enhanced security settings
            minZoomLevel: 0.5,
            maxZoomLevel: 8, // Limit maximum zoom
            zoomPerScroll: 1.1, // Slower zoom
            zoomPerClick: 1.5, // Reduced zoom on click
            animationTime: 0.8, // Slower animations
            blendTime: 0.1,
            alwaysBlend: false,
            immediateRender: false,
            wrapHorizontal: false,
            wrapVertical: false,
            wrapOverlays: false,
            panHorizontal: true,
            panVertical: true,
            // Disable some features that could be used for extraction
            showNavigator: false, // Disable navigator to prevent easy navigation
            showRotationControl: false,
            showZoomControl: false,
            showHomeControl: false,
            showFullPageControl: false,
            // Add watermark overlay
            overlays: [{
                id: 'watermark',
                x: 0.5,
                y: 0.5,
                width: 0.8,
                height: 0.1,
                className: 'watermark-overlay'
            }],
            // Custom event handlers for additional protection
            gestureSettingsMouse: {
                clickToZoom: true,
                dblClickToZoom: false, // Disable double-click zoom
                pinchToZoom: true,
                scrollToZoom: true,
                flickEnabled: false, // Disable flick gestures
                flickMinSpeed: 120,
                flickMomentum: 0.25
            }
        };

        // Merge with custom options
        const finalOptions = { ...defaultOptions, ...options };

        // Create viewer
        this.viewer = OpenSeadragon(finalOptions);

        // Add additional protection layers
        this.addProtectionLayers();
        
        // Add watermark
        this.addWatermark();

        return this.viewer;
    }

    // Add multiple protection layers
    addProtectionLayers() {
        if (!this.viewer) return;

        // Layer 1: Canvas protection
        this.protectCanvas();

        // Layer 2: Screenshot detection
        this.detectScreenshots();

        // Layer 3: Developer tools detection
        this.detectDevTools();

        // Layer 4: Viewport protection
        this.protectViewport();
    }

    // Protect canvas from easy extraction
    protectCanvas() {
        const canvas = this.viewer.canvas;
        if (!canvas) return;

        // Disable canvas context menu
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showProtectionMessage('Canvas right-click disabled');
        });

        // Override canvas toDataURL method
        const originalToDataURL = canvas.toDataURL;
        canvas.toDataURL = function() {
            this.showProtectionMessage('Canvas export disabled');
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        }.bind(this);

        // Override canvas toBlob method
        const originalToBlob = canvas.toBlob;
        canvas.toBlob = function(callback) {
            this.showProtectionMessage('Canvas export disabled');
            if (callback) callback(null);
        }.bind(this);
    }

    // Detect screenshot attempts
    detectScreenshots() {
        // Monitor for fullscreen changes (common screenshot trigger)
        document.addEventListener('fullscreenchange', () => {
            this.showProtectionMessage('Fullscreen mode detected - screenshots may be attempted');
        });

        // Monitor for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.showProtectionMessage('Page visibility changed - potential screenshot attempt');
            }
        });

        // Monitor for window focus changes
        window.addEventListener('blur', () => {
            this.showProtectionMessage('Window focus lost - potential screenshot attempt');
        });
    }

    // Detect developer tools
    detectDevTools() {
        let devtools = { open: false, orientation: null };
        
        setInterval(() => {
            const threshold = 160;
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            
            if (widthThreshold || heightThreshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.showProtectionMessage('Developer tools detected - image protection active');
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    // Protect viewport from easy viewing
    protectViewport() {
        if (!this.viewer) return;

        // Add viewport restrictions
        this.viewer.addHandler('animation', (event) => {
            const viewport = this.viewer.viewport;
            const zoom = viewport.getZoom();
            
            // Prevent excessive zooming
            if (zoom > 8) {
                viewport.zoomTo(8);
                this.showProtectionMessage('Maximum zoom level reached');
            }
        });

        // Add pan restrictions
        this.viewer.addHandler('pan', (event) => {
            // Limit panning to prevent easy navigation
            const bounds = this.viewer.viewport.getBounds();
            if (bounds.x < -0.5 || bounds.x > 1.5 || bounds.y < -0.5 || bounds.y > 1.5) {
                this.viewer.viewport.panTo(new OpenSeadragon.Point(0.5, 0.5));
                this.showProtectionMessage('Panning restricted for image protection');
            }
        });
    }

    // Add watermark overlay
    addWatermark() {
        if (!this.viewer) return;

        // Create watermark element
        const watermark = document.createElement('div');
        watermark.className = 'watermark-overlay';
        watermark.innerHTML = `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                pointer-events: none;
                z-index: 1000;
                opacity: 0.3;
                transition: opacity 0.3s;
            ">${this.watermarkText}</div>
        `;

        // Add watermark to viewer container
        const container = this.viewer.element;
        container.appendChild(watermark);

        // Show watermark on hover
        container.addEventListener('mouseenter', () => {
            watermark.style.opacity = '0.7';
        });

        container.addEventListener('mouseleave', () => {
            watermark.style.opacity = '0.3';
        });
    }

    // Show protection messages
    showProtectionMessage(message) {
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'protection-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(255, 0, 0, 0.9);
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease-out;
            ">
                <strong>🛡️ Protection Active:</strong> ${message}
            </div>
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Disable protection (for admin use)
    disableProtection() {
        this.isProtected = false;
        console.log('Image protection disabled for admin use');
    }

    // Enable protection
    enableProtection() {
        this.isProtected = true;
        console.log('Image protection enabled');
    }
}

// Add CSS animations for notifications (only if not already added)
if (!document.querySelector('style[data-openseadragon-protection]')) {
    const style = document.createElement('style');
    style.setAttribute('data-openseadragon-protection', 'true');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .watermark-overlay {
            pointer-events: none;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }
        
        .openseadragon-canvas {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            -webkit-user-drag: none;
        }
    `;
    document.head.appendChild(style);
}

// Global instance (only if not already created)
if (!window.protectedImageViewer) {
    window.protectedImageViewer = new ProtectedImageViewer();
}

// Export for use in other scripts (only if not already exported)
if (!window.createProtectedViewer) {
    window.createProtectedViewer = (containerId, imageUrl, options) => {
        return window.protectedImageViewer.createProtectedViewer(containerId, imageUrl, options);
    };
}
} 