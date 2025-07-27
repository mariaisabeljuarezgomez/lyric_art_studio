#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const PAGES_DIR = './pages';
const PROTECTION_SCRIPTS = [
    '../public/global-image-protection.js',
    '../public/openseadragon-viewer.js'
];

// Files to process
const FILES_TO_PROCESS = [
    'pages/homepage.html',
    'pages/browse_gallery.html', 
    'pages/my_collection.html',
    'pages/admin-custom-designs.html',
    'pages/admin-login.html',
    'pages/artist_profiles.html'
];

function toggleProtection(enable = true) {
    console.log(`🛡️ ${enable ? 'ENABLING' : 'DISABLING'} Image Protection...`);
    
    let filesModified = 0;
    
    FILES_TO_PROCESS.forEach(filePath => {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ File not found: ${filePath}`);
            return;
        }
        
        console.log(`📝 Processing: ${filePath}`);
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        PROTECTION_SCRIPTS.forEach(script => {
            const scriptName = path.basename(script);
            
            if (enable) {
                // ENABLE: Uncomment the scripts
                const commentedPattern = new RegExp(`<!-- <script src="${script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"></script> -->`, 'g');
                const uncommentedReplacement = `<script src="${script}"></script>`;
                
                if (content.includes(`<!-- <script src="${script}"></script> -->`)) {
                    content = content.replace(commentedPattern, uncommentedReplacement);
                    console.log(`  ✅ Enabled: ${scriptName}`);
                    modified = true;
                } else {
                    console.log(`  ℹ️ Already enabled: ${scriptName}`);
                }
            } else {
                // DISABLE: Comment out the scripts
                const uncommentedPattern = new RegExp(`<script src="${script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"></script>`, 'g');
                const commentedReplacement = `<!-- <script src="${script}"></script> -->`;
                
                if (content.includes(`<script src="${script}"></script>`)) {
                    content = content.replace(uncommentedPattern, commentedReplacement);
                    console.log(`  ✅ Disabled: ${scriptName}`);
                    modified = true;
                } else {
                    console.log(`  ℹ️ Already disabled: ${scriptName}`);
                }
            }
        });
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            filesModified++;
            console.log(`  💾 Saved: ${filePath}`);
        }
    });
    
    console.log(`\n🎯 Summary:`);
    console.log(`  📁 Files processed: ${FILES_TO_PROCESS.length}`);
    console.log(`  ✏️ Files modified: ${filesModified}`);
    console.log(`  🛡️ Protection ${enable ? 'ENABLED' : 'DISABLED'}`);
    
    if (enable) {
        console.log(`\n⚠️ IMPORTANT: Restart your server after enabling protection!`);
        console.log(`   Run: npm start`);
    } else {
        console.log(`\n✅ Protection disabled! You can now use F12 and developer tools.`);
    }
}

function showStatus() {
    console.log(`\n🔍 Checking current protection status...\n`);
    
    FILES_TO_PROCESS.forEach(filePath => {
        if (!fs.existsSync(filePath)) {
            console.log(`❌ File not found: ${filePath}`);
            return;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`📄 ${filePath}:`);
        
        PROTECTION_SCRIPTS.forEach(script => {
            const scriptName = path.basename(script);
            const isCommented = content.includes(`<!-- <script src="${script}"></script> -->`);
            const isEnabled = content.includes(`<script src="${script}"></script>`);
            
            if (isCommented) {
                console.log(`  ❌ ${scriptName}: DISABLED`);
            } else if (isEnabled) {
                console.log(`  ✅ ${scriptName}: ENABLED`);
            } else {
                console.log(`  ❓ ${scriptName}: NOT FOUND`);
            }
        });
        console.log('');
    });
}

// Main execution
const command = process.argv[2];

console.log(`🛡️ Image Protection Toggle Script`);
console.log(`================================\n`);

switch (command) {
    case 'enable':
    case 'on':
        toggleProtection(true);
        break;
        
    case 'disable':
    case 'off':
        toggleProtection(false);
        break;
        
    case 'status':
        showStatus();
        break;
        
    default:
        console.log(`Usage: node toggle-image-protection.js [command]`);
        console.log(``);
        console.log(`Commands:`);
        console.log(`  enable/on    - Enable image protection on all pages`);
        console.log(`  disable/off  - Disable image protection on all pages`);
        console.log(`  status       - Show current protection status`);
        console.log(``);
        console.log(`Examples:`);
        console.log(`  node toggle-image-protection.js disable  # Turn off protection`);
        console.log(`  node toggle-image-protection.js enable   # Turn on protection`);
        console.log(`  node toggle-image-protection.js status   # Check status`);
        console.log(``);
        console.log(`⚠️ Remember to restart your server after changing protection status!`);
        break;
} 