const fs = require('fs');
const path = require('path');

console.log('🔍 SEARCHING FOR ALL POTENTIAL DUPLICATE FOLDERS...\n');
console.log('⚠️  This will only SHOW duplicates - NO DELETING will happen!\n');

// Function to get folder size
function getFolderSize(folderPath) {
  if (!fs.existsSync(folderPath)) {
    return 0;
  }
  
  let totalSize = 0;
  const items = fs.readdirSync(folderPath);
  
  for (const item of items) {
    const fullPath = path.join(folderPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      totalSize += getFolderSize(fullPath);
    } else {
      totalSize += stat.size;
    }
  }
  
  return totalSize;
}

// Function to list files in folder
function listFiles(folderPath) {
  if (!fs.existsSync(folderPath)) {
    return [];
  }
  
  const files = [];
  const items = fs.readdirSync(folderPath);
  
  for (const item of items) {
    const fullPath = path.join(folderPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...listFiles(fullPath).map(f => item + '/' + f));
    } else {
      files.push(item);
    }
  }
  
  return files.sort();
}

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
        const files = listFiles(fullPath);
        
        folderData[folder] = { size, files };
        console.log(`  📁 ${folder}: ${(size / 1024).toFixed(1)} KB, ${files.length} files`);
      }
    });
    
    // Check for duplicates by size and file count
    const sizeGroups = {};
    Object.entries(folderData).forEach(([folder, data]) => {
      const key = `${data.size}-${data.files.length}`;
      if (!sizeGroups[key]) {
        sizeGroups[key] = [];
      }
      sizeGroups[key].push({ folder, ...data });
    });
    
    // Report duplicates
    Object.values(sizeGroups).forEach(group => {
      if (group.length > 1) {
        console.log(`  ❌ POTENTIAL DUPLICATES FOUND:`);
        group.forEach(folder => {
          console.log(`     - ${folder.folder} (${(folder.size / 1024).toFixed(1)} KB, ${folder.files.length} files)`);
        });
        
        duplicateGroups.push({
          key,
          duplicates: group.map(g => g.folder),
          size: group[0].size,
          fileCount: group[0].fileCount
        });
        
        totalDuplicates += group.length - 1;
      }
    });
  }
});

console.log('\n' + '='.repeat(80));
console.log(`📊 SUMMARY: Found ${totalDuplicates} potential duplicate folders`);

if (duplicateGroups.length > 0) {
  console.log('\n🗑️  DUPLICATE GROUPS FOUND:');
  duplicateGroups.forEach(group => {
    console.log(`\n🎵 ${group.key}:`);
    console.log(`   Keep: ${group.duplicates[0]}`);
    console.log(`   Remove: ${group.duplicates.slice(1).join(', ')}`);
    console.log(`   Size: ${(group.size / 1024).toFixed(1)} KB, Files: ${group.fileCount}`);
  });
  
  console.log('\n⚠️  PLEASE VERIFY THESE ARE ACTUALLY DUPLICATES BEFORE DELETING!');
  console.log('💡 Check the folder contents manually to confirm they are identical.');
} else {
  console.log('\n✅ No duplicate folders found!');
}

console.log('\n🔒 NO FILES HAVE BEEN DELETED - This was just an analysis!');
