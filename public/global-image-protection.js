// Global Image Protection System
// This script provides comprehensive protection against image theft and developer tools

(function() {
    'use strict';

    // Global protection state
    let protectionActive = true;
    let devToolsDetected = false;

    // EMERGENCY DISABLE FUNCTION - Call this from console to disable protection
    window.emergencyDisableProtection = function() {
        console.log('🚨 EMERGENCY: Disabling all image protection...');
        
        // Remove the debug button
        const debugButton = document.getElementById('debug-button');
        if (debugButton) {
            debugButton.remove();
        }
        
        // Remove CSS protections
        const style = document.getElementById('image-protection-styles');
        if (style) {
            style.remove();
        }
        
        // Clear any protection flags
        window.globalProtectionInitialized = false;
        window.devToolsDetected = false;
        protectionActive = false;
        
        // Remove all event listeners by recreating the document
        const newBody = document.body.cloneNode(true);
        document.body.parentNode.replaceChild(newBody, document.body);
        
        // Override the blocking functions
        const originalAddEventListener = document.addEventListener;
        document.addEventListener = function(type, listener, options) {
            if (type === 'keydown' || type === 'contextmenu' || type === 'dragstart' || type === 'selectstart' || type === 'copy' || type === 'cut') {
                return; // Don't add protection listeners
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
        
        console.log('✅ All image protection disabled. You can now use F12 and developer tools.');
        alert('Image protection disabled. You can now use developer tools.');
    };

    // Initialize global protection
    function initGlobalProtection() {
        console.log('🛡️ Initializing global image protection...');
        
        // Safety check - don't initialize if already done
        if (window.globalProtectionInitialized) {
            console.log('⚠️ Global protection already initialized, skipping...');
            return;
        }
        
        // Disable right-click on images only
        disableRightClick();
        
        // Disable keyboard shortcuts (but allow normal functionality)
        disableKeyboardShortcuts();
        
        // Disable drag and drop on images only
        disableDragAndDrop();
        
        // Disable text selection on images only
        disableTextSelection();
        
        // Disable copy/paste on images only
        disableCopyPaste();
        
        // Enhanced developer tools detection
        enhancedDevToolsDetection();
        
        // Screenshot detection
        detectScreenshots();
        
        // Apply CSS protections
        applyCSSProtections();
        
        // Mark as initialized
        window.globalProtectionInitialized = true;
        
        console.log('✅ Global image protection initialized');
        console.log('🚨 To disable protection, run: emergencyDisableProtection() in console');
    }

    // Disable right-click on images only
    function disableRightClick() {
        document.addEventListener('contextmenu', function(e) {
            // Only block right-click on images and canvas
            if (e.target && (e.target.tagName === 'IMG' || e.target.closest('.openseadragon-canvas'))) {
                e.preventDefault();
                showProtectionMessage('Right-click disabled for image protection');
                return false;
            }
        }, true);
    }

    // Disable keyboard shortcuts (but allow normal functionality)
    function disableKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Only block shortcuts when not in input fields
            const isInInput = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true');
            
            if (isInInput) {
                return; // Allow normal keyboard shortcuts in input fields
            }

            // Prevent common screenshot shortcuts
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'u')) {
                e.preventDefault();
                showProtectionMessage('Screenshot shortcuts disabled');
                return false;
            }
            
            // Prevent F12 developer tools
            if (e.key === 'F12') {
                e.preventDefault();
                showProtectionMessage('Developer tools disabled');
                return false;
            }

            // Prevent Ctrl+Shift+I (Developer Tools)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                showProtectionMessage('Developer tools disabled');
                return false;
            }

            // Prevent Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                showProtectionMessage('Developer console disabled');
                return false;
            }

            // Prevent Ctrl+Shift+C (Inspect Element)
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                showProtectionMessage('Inspect element disabled');
                return false;
            }

            // Prevent Ctrl+U (View Source)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                showProtectionMessage('View source disabled');
                return false;
            }

            // Prevent Print Screen key
            if (e.key === 'PrintScreen' || e.key === 'Print') {
                e.preventDefault();
                showProtectionMessage('Print screen disabled');
                return false;
            }

            // Prevent Alt+PrintScreen
            if (e.altKey && (e.key === 'PrintScreen' || e.key === 'Print')) {
                e.preventDefault();
                showProtectionMessage('Print screen disabled');
                return false;
            }

            // EMERGENCY BYPASS: Ctrl+Alt+Shift+D to disable protection
            if (e.ctrlKey && e.altKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                window.emergencyDisableProtection();
                return false;
            }
        }, true);
    }

    // Disable drag and drop
    function disableDragAndDrop() {
        document.addEventListener('dragstart', function(e) {
            if (e.target && (e.target.tagName === 'IMG' || e.target.closest('.openseadragon-canvas'))) {
                e.preventDefault();
                showProtectionMessage('Drag and drop disabled');
                return false;
            }
        }, true);
    }

    // Disable text selection
    function disableTextSelection() {
        document.addEventListener('selectstart', function(e) {
            if (e.target && e.target.closest && e.target.closest('.openseadragon-canvas')) {
                e.preventDefault();
                return false;
            }
        }, true);
    }

    // Disable copy/paste on images only
    function disableCopyPaste() {
        document.addEventListener('copy', function(e) {
            if (e.target && e.target.closest && e.target.closest('.openseadragon-canvas')) {
                e.preventDefault();
                showProtectionMessage('Copy disabled for image protection');
                return false;
            }
        }, true);

        document.addEventListener('cut', function(e) {
            // Only block cut on images and canvas
            if (e.target && (e.target.tagName === 'IMG' || e.target.closest('.openseadragon-canvas'))) {
                e.preventDefault();
                showProtectionMessage('Cut disabled for image protection');
                return false;
            }
        }, true);

        document.addEventListener('paste', function(e) {
            // Only block paste on images and canvas
            if (e.target && (e.target.tagName === 'IMG' || e.target.closest('.openseadragon-canvas'))) {
                e.preventDefault();
                showProtectionMessage('Paste disabled for image protection');
                return false;
            }
        }, true);
    }

    // Enhanced developer tools detection
    function enhancedDevToolsDetection() {
        let devtools = { open: false, orientation: null };
        
        // Method 1: Size detection
        setInterval(function() {
            const threshold = 160;
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            
            if (widthThreshold || heightThreshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    devToolsDetected = true;
                    showProtectionMessage('Developer tools detected - image protection active');
                    activateEmergencyProtection();
                }
            } else {
                devtools.open = false;
                devToolsDetected = false;
            }
        }, 500);

        // Method 2: Console.log detection
        const originalLog = console.log;
        console.log = function(...args) {
            if (devtools.open) {
                showProtectionMessage('Console access detected');
            }
            return originalLog.apply(console, args);
        };

        // Method 3: Debugger detection
        setInterval(function() {
            const start = performance.now();
            debugger;
            const end = performance.now();
            if (end - start > 100) {
                showProtectionMessage('Debugger detected');
                activateEmergencyProtection();
            }
        }, 1000);

        // Method 4: Firebug detection
        if (window.console && (window.console.firebug || window.console.exception)) {
            showProtectionMessage('Firebug detected');
            activateEmergencyProtection();
        }

        // Method 5: Performance timing detection
        setInterval(function() {
            if (performance.timing.loadEventEnd > 0) {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                if (loadTime > 10000) { // Suspicious load time
                    showProtectionMessage('Suspicious page load detected');
                }
            }
        }, 2000);
    }

    // Emergency protection activation
    function activateEmergencyProtection() {
        // Hide all images temporarily
        const images = document.querySelectorAll('img');
        images.forEach(function(img) {
            img.style.filter = 'blur(10px)';
            img.style.transition = 'filter 0.3s';
        });

        // Show warning message
        showProtectionMessage('EMERGENCY: Developer tools detected - Images protected');

        // Restore after 5 seconds
        setTimeout(function() {
            images.forEach(function(img) {
                img.style.filter = 'none';
            });
        }, 5000);
    }

    // Detect screenshot attempts
    function detectScreenshots() {
        // Monitor for fullscreen changes
        document.addEventListener('fullscreenchange', function() {
            showProtectionMessage('Fullscreen mode detected - screenshots may be attempted');
        });

        // Monitor for visibility changes
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                showProtectionMessage('Page visibility changed - potential screenshot attempt');
            }
        });

        // Monitor for window focus changes
        window.addEventListener('blur', function() {
            showProtectionMessage('Window focus lost - potential screenshot attempt');
        });

        // Monitor for window resize
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                showProtectionMessage('Window resize detected - potential screenshot attempt');
            }, 100);
        });
    }

    // Apply CSS protections
    function applyCSSProtections() {
        if (!document.querySelector('style[data-global-protection]')) {
            const style = document.createElement('style');
            style.setAttribute('data-global-protection', 'true');
            style.textContent = `
                /* Global image protection styles */
                img {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                    -webkit-touch-callout: none !important;
                    -webkit-user-drag: none !important;
                    pointer-events: auto !important;
                }

                .openseadragon-canvas {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                    -webkit-touch-callout: none !important;
                    -webkit-user-drag: none !important;
                }

                .openseadragon-container {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                }

                /* Disable text selection for images and canvas only */
                img, canvas, .openseadragon-canvas, .openseadragon-container {
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                }

                /* Allow text selection for interactive elements */
                input, textarea, [contenteditable="true"], button, a, .btn-primary, .btn-secondary {
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                    user-select: text !important;
                }

                /* Allow text selection for navigation and UI elements */
                nav, header, footer, .navigation, .menu, .hamburger-menu-btn {
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                    user-select: text !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Show protection messages
    function showProtectionMessage(message) {
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'global-protection-notification';
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
                max-width: 300px;
                word-wrap: break-word;
            ">
                <strong>🛡️ Protection Active:</strong> ${message}
            </div>
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(function() {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Public API
    window.GlobalImageProtection = {
        init: initGlobalProtection,
        disable: function() {
            protectionActive = false;
            console.log('Global image protection disabled');
            
            // Remove protection styles
            const protectionStyle = document.querySelector('style[data-global-protection]');
            if (protectionStyle) {
                protectionStyle.remove();
            }
        },
        enable: function() {
            protectionActive = true;
            console.log('Global image protection enabled');
            
            // Re-apply protection styles
            applyCSSProtections();
        },
        isActive: function() {
            return protectionActive;
        },
        isDevToolsDetected: function() {
            return devToolsDetected;
        },
        // Emergency disable for debugging
        emergencyDisable: function() {
            protectionActive = false;
            window.globalProtectionInitialized = false;
            console.log('🚨 Emergency: Global image protection completely disabled');
            
            // Remove all protection styles
            const protectionStyle = document.querySelector('style[data-global-protection]');
            if (protectionStyle) {
                protectionStyle.remove();
            }
        }
    };

    // Initialize protection when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGlobalProtection);
    } else {
        initGlobalProtection();
    }

    // Also initialize on window load for late-loading content
    window.addEventListener('load', function() {
        if (protectionActive) {
            // Re-apply protections for dynamically loaded content
            setTimeout(initGlobalProtection, 1000);
        }
    });

})(); 