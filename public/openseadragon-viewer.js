// OpenSeadragon Viewer for High-Resolution Design Images
class OpenSeadragonViewer {
    constructor() {
        this.viewer = null;
        this.currentImage = null;
    }

    // Initialize OpenSeadragon viewer
    initViewer(containerId, imagePath) {
        if (this.viewer) {
            this.viewer.destroy();
        }

        // Check if mobile device
        const isMobile = window.innerWidth <= 768;

        this.viewer = OpenSeadragon({
            id: containerId,
            prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
            tileSources: {
                type: 'image',
                url: imagePath
            },
            showNavigator: !isMobile, // Hide navigator on mobile to save space
            navigatorPosition: 'BOTTOM_RIGHT',
            navigatorSizeRatio: 0.25,
            navigatorMaintainSizeRatio: true,
            navigatorTopRatio: 0.1,
            navigatorLeftRatio: 0.1,
            navigatorBackground: '#333',
            navigatorBorderColor: '#ff6b35',
            navigatorDisplayMode: 'always',
            zoomPerScroll: isMobile ? 1.1 : 1.2, // Slower zoom on mobile
            zoomPerClick: isMobile ? 1.5 : 2, // Smaller zoom on mobile
            minZoomLevel: 0.5,
            maxZoomLevel: isMobile ? 8 : 10, // Lower max zoom on mobile
            animationTime: 0.3, // Faster animations on mobile
            blendTime: 0.1,
            alwaysBlend: false,
            autoHideControls: true,
            immediateRender: false,
            wrapHorizontal: false,
            wrapVertical: false,
            wrapOverlays: false,
            panHorizontal: true,
            panVertical: true,
            showRotationControl: false,
            backgroundColor: '#FFFFFF', // Add white background
            gestureSettingsMouse: {
                clickToZoom: true,
                dblClickToZoom: true,
                pinchToZoom: true,
                scrollToZoom: true
            },
            gestureSettingsTouch: {
                pinchToZoom: true,
                scrollToZoom: false,
                clickToZoom: true,
                dblClickToZoom: true
            }
        });

        // Add white background overlay
        setTimeout(() => {
            const canvas = this.viewer.canvas;
            if (canvas) {
                canvas.style.backgroundColor = '#FFFFFF';
            }
            
            // Also apply white background to the container
            const container = document.getElementById(containerId);
            if (container) {
                container.style.backgroundColor = '#FFFFFF';
            }
            
            // Apply white background to all OpenSeadragon elements
            const openseadragonElements = container.querySelectorAll('.openseadragon-canvas, .openseadragon-canvas-overlay');
            openseadragonElements.forEach(element => {
                element.style.backgroundColor = '#FFFFFF';
            });
        }, 100);

        // Disable right-click context menu
        this.viewer.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // Disable drag and drop
        this.viewer.canvas.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });

        return this.viewer;
    }

    // Open design in OpenSeadragon modal
    openDesignViewer(imagePath, songTitle, artistName) {
        // Create modal HTML with inline styles for reliability
        const modalHTML = `
            <div id="openseadragon-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 8px;">
                <div style="position: relative; width: 100%; height: 100%; max-width: 1200px; max-height: 95vh; background-color: white; border-radius: 8px; overflow: hidden;">
                    <!-- Header -->
                    <div style="position: absolute; top: 0; left: 0; right: 0; background: linear-gradient(to right, #2563EB, #1D4ED8); color: white; padding: 12px; z-index: 10;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1; min-width: 0;">
                                <h2 style="font-size: 18px; font-weight: bold; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${songTitle}</h2>
                                <p style="font-size: 12px; opacity: 0.9; margin: 4px 0 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${artistName}</p>
                            </div>
                            <button onclick="closeOpenSeadragonModal()" style="color: white; background: none; border: none; font-size: 24px; font-weight: bold; cursor: pointer; margin-left: 8px; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                                ×
                            </button>
                        </div>
                    </div>
                    
                    <!-- OpenSeadragon Container with white background -->
                    <div id="openseadragon-container" style="width: 100%; height: 100%; margin-top: 60px; background-color: white;"></div>
                    
                    <!-- Instructions -->
                    <div style="position: absolute; bottom: 8px; left: 8px; right: 8px; background-color: rgba(0, 0, 0, 0.75); color: white; padding: 8px; border-radius: 8px; font-size: 12px; text-align: center;">
                        <p style="margin: 0;">🔍 Scroll to zoom • 🖱️ Drag to pan • 📱 Pinch to zoom on mobile</p>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Initialize OpenSeadragon with mobile-optimized settings
        setTimeout(() => {
            this.initViewer('openseadragon-container', imagePath);
        }, 100);
    }
}

// Global instance
window.openSeadragonViewer = new OpenSeadragonViewer();

// Close modal function
function closeOpenSeadragonModal() {
    const modal = document.getElementById('openseadragon-modal');
    if (modal) {
        modal.remove();
    }
    if (window.openSeadragonViewer.viewer) {
        window.openSeadragonViewer.viewer.destroy();
        window.openSeadragonViewer.viewer = null;
    }
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeOpenSeadragonModal();
    }
}); 