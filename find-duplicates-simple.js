const fs = require('fs');
const path = require('path');

console.log('🔍 Finding duplicate folders by size comparison...\n');

// Check specific known duplicate patterns
const patterns = [
  {
    name: 'Alabama Dixieland Delight',
    folders: [
      'alabama-dixieland-delight-guitar',
      'alabama-dixieland-delight-guitar-2', 
      'alabama-dixieland-delight-guitar-ss'
    ]
  },
  {
    name: 'Eric Church Hell of a View',
    folders: [
      'eric-church-hell-of-a-view-guitar',
      'eric-church-hell-of-a-view-guitar-2',
      'eric-church-hell-of-a-view-guitar-3'
    ]
  },
  {
    name: 'Eric Church Old Friends',
    folders: [
      'eric-church-old-friends-guitar',
      'eric-church-old-friends-guitar-2'
    ]
  }
];

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

patterns.forEach(pattern => {
  console.log(`\n🎵 ${pattern.name}:`);
  
  const folderData = pattern.folders.map(folder => {
    const fullPath = path.join('images/designs', folder);
    const size = getFolderSize(fullPath);
    const files = listFiles(fullPath);
    const exists = fs.existsSync(fullPath);
    
    return {
      folder,
      exists,
      size,
      files,
      fileCount: files.length
    };
  });
  
  // Show folder info
  folderData.forEach(data => {
    if (data.exists) {
      console.log(`  📁 ${data.folder}: ${(data.size / 1024).toFixed(1)} KB, ${data.fileCount} files`);
      console.log(`     Files: ${data.files.join(', ')}`);
    } else {
      console.log(`  ❌ ${data.folder}: NOT FOUND`);
    }
  });
  
  // Check for duplicates
  const existingFolders = folderData.filter(f => f.exists);
  const sizeGroups = {};
  
  existingFolders.forEach(folder => {
    const key = `${folder.size}-${folder.fileCount}`;
    if (!sizeGroups[key]) {
      sizeGroups[key] = [];
    }
    sizeGroups[key].push(folder);
  });
  
  // Report duplicates
  Object.values(sizeGroups).forEach(group => {
    if (group.length > 1) {
      console.log(`  ❌ DUPLICATE FOUND: ${group.map(g => g.folder).join(', ')}`);
      console.log(`     Size: ${(group[0].size / 1024).toFixed(1)} KB, Files: ${group[0].fileCount}`);
    }
  });
});

console.log('\n' + '='.repeat(60));
console.log('✅ Analysis complete!');
