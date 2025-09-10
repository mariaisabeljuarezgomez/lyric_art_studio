const fs = require('fs');
const path = require('path');

console.log('🔍 IDENTIFYING POTENTIAL DUPLICATE FOLDERS...\n');
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

// Check specific patterns that might have duplicates
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
  },
  {
    name: 'Led Zeppelin Stairway to Heaven',
    folders: [
      'led-zeppelin-stairway-to-heaven-guitar',
      'led-zeppelin-stairway-to-heaven-guitar-0001',
      'led-zeppelin-stairway-to-heaven-guitar-01',
      'led-zeppelin-stairway-to-heaven-guitar-2',
      'led-zeppelin-stairway-to-heaven-guitar-3',
      'led-zeppelin-stairway-to-heaven-guitar-4'
    ]
  }
];

let totalDuplicates = 0;
const duplicateGroups = [];

patterns.forEach(pattern => {
  console.log(`\n🎵 ${pattern.name}:`);
  console.log('─'.repeat(50));
  
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
      console.log(`📁 ${data.folder}`);
      console.log(`   Size: ${(data.size / 1024).toFixed(1)} KB`);
      console.log(`   Files: ${data.fileCount} (${data.files.join(', ')})`);
    } else {
      console.log(`❌ ${data.folder}: NOT FOUND`);
    }
  });
  
  // Check for duplicates by size and file count
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
      console.log(`\n❌ POTENTIAL DUPLICATES FOUND:`);
      group.forEach(folder => {
        console.log(`   - ${folder.folder} (${(folder.size / 1024).toFixed(1)} KB, ${folder.fileCount} files)`);
      });
      
      duplicateGroups.push({
        pattern: pattern.name,
        duplicates: group.map(g => g.folder),
        size: group[0].size,
        fileCount: group[0].fileCount
      });
      
      totalDuplicates += group.length - 1;
    }
  });
});

console.log('\n' + '='.repeat(80));
console.log(`📊 SUMMARY: Found ${totalDuplicates} potential duplicate folders`);

if (duplicateGroups.length > 0) {
  console.log('\n🗑️  DUPLICATE GROUPS TO REVIEW:');
  duplicateGroups.forEach(group => {
    console.log(`\n🎵 ${group.pattern}:`);
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
