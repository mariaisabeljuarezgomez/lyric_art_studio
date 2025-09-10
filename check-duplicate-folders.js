const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Function to get folder hash (based on all files and their contents)
function getFolderHash(folderPath) {
  const files = [];
  
  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else {
        const relativePath = path.relative(folderPath, fullPath).replace(/\\/g, '/');
        const fileHash = crypto.createHash('md5').update(fs.readFileSync(fullPath)).digest('hex');
        files.push({ path: relativePath, hash: fileHash, size: stat.size });
      }
    }
  }
  
  scanDir(folderPath);
  
  // Sort files by path for consistent hashing
  files.sort((a, b) => a.path.localeCompare(b.path));
  
  // Create hash of all file info
  const combined = files.map(f => `${f.path}:${f.hash}:${f.size}`).join('|');
  return crypto.createHash('md5').update(combined).digest('hex');
}

// Function to get folder size
function getFolderSize(folderPath) {
  let totalSize = 0;
  
  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else {
        totalSize += stat.size;
      }
    }
  }
  
  scanDir(folderPath);
  return totalSize;
}

// Function to list all files in folder
function listFolderContents(folderPath) {
  const files = [];
  
  function scanDir(dir, baseDir = folderPath) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath, baseDir);
      } else {
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        files.push({ path: relativePath, size: stat.size });
      }
    }
  }
  
  scanDir(folderPath);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

console.log('🔍 Checking for duplicate folders by comparing entire folder contents...\n');

// Get all design folders
const designsDir = 'images/designs';
const folders = fs.readdirSync(designsDir).filter(item => {
  return fs.statSync(path.join(designsDir, item)).isDirectory();
});

console.log(`📁 Found ${folders.length} design folders to check\n`);

// Group folders by artist-song pattern
const folderGroups = {};

folders.forEach(folder => {
  // Extract artist and song from folder name
  const parts = folder.split('-');
  if (parts.length >= 3) {
    const artist = parts[0];
    const song = parts.slice(1, -1).join('-'); // Everything except last part (usually 'guitar')
    const key = `${artist}-${song}`;
    
    if (!folderGroups[key]) {
      folderGroups[key] = [];
    }
    folderGroups[key].push(folder);
  }
});

// Check for duplicates within each group
let totalDuplicates = 0;
const duplicateGroups = [];

Object.entries(folderGroups).forEach(([key, folders]) => {
  if (folders.length > 1) {
    console.log(`\n🎵 Checking group: ${key} (${folders.length} folders)`);
    
    const folderData = {};
    
    // Get data for each folder
    folders.forEach(folder => {
      const fullPath = path.join(designsDir, folder);
      if (fs.existsSync(fullPath)) {
        const size = getFolderSize(fullPath);
        const hash = getFolderHash(fullPath);
        const contents = listFolderContents(fullPath);
        
        folderData[folder] = { size, hash, contents };
        console.log(`  📁 ${folder}: ${(size / 1024).toFixed(1)} KB, ${contents.length} files`);
      }
    });
    
    // Check for duplicates
    const hashGroups = {};
    Object.entries(folderData).forEach(([folder, data]) => {
      if (!hashGroups[data.hash]) {
        hashGroups[data.hash] = [];
      }
      hashGroups[data.hash].push({ folder, ...data });
    });
    
    // Report duplicates
    Object.entries(hashGroups).forEach(([hash, group]) => {
      if (group.length > 1) {
        console.log(`  ❌ DUPLICATE FOUND: ${group.map(g => g.folder).join(', ')}`);
        console.log(`     Size: ${(group[0].size / 1024).toFixed(1)} KB`);
        console.log(`     Files: ${group[0].contents.map(f => f.path).join(', ')}`);
        
        duplicateGroups.push({
          key,
          duplicates: group.map(g => g.folder),
          size: group[0].size,
          files: group[0].contents
        });
        
        totalDuplicates += group.length - 1; // -1 because we keep one
      }
    });
  }
});

console.log('\n' + '='.repeat(80));
console.log(`📊 SUMMARY: Found ${totalDuplicates} duplicate folders out of ${folders.length} total folders`);

if (duplicateGroups.length > 0) {
  console.log('\n🗑️  DUPLICATE FOLDERS TO REMOVE:');
  duplicateGroups.forEach(group => {
    console.log(`\n🎵 ${group.key}:`);
    group.duplicates.slice(1).forEach(folder => {
      console.log(`   - ${folder} (${(group.size / 1024).toFixed(1)} KB)`);
    });
  });
  
  console.log('\n💡 RECOMMENDATION:');
  console.log('   Keep the first folder in each duplicate group and remove the others.');
  console.log('   This will eliminate duplicate designs from your website.');
} else {
  console.log('\n✅ No duplicate folders found!');
}
