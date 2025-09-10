const fs = require('fs');
const crypto = require('crypto');

// Function to get file hash
function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Check Alabama Dixieland Delight designs
console.log('🔍 Checking Alabama Dixieland Delight designs...\n');

const alabamaFiles = [
  'images/designs/alabama-dixieland-delight-guitar/alabama-dixieland-delight-guitar.webp',
  'images/designs/alabama-dixieland-delight-guitar-2/alabama-dixieland-delight-guitar-2.webp',
  'images/designs/alabama-dixieland-delight-guitar-ss/alabama-dixieland-delight-guitar-ss.webp'
];

const alabamaHashes = {};
alabamaFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const hash = getFileHash(file);
    const fileName = file.split('/').pop();
    alabamaHashes[fileName] = hash;
    console.log(`✅ ${fileName}: ${hash}`);
  } else {
    console.log(`❌ ${file} - File not found`);
  }
});

// Check for duplicates
const alabamaHashValues = Object.values(alabamaHashes);
const alabamaUniqueHashes = [...new Set(alabamaHashValues)];
console.log(`\n📊 Alabama Dixieland Delight: ${alabamaUniqueHashes.length} unique images out of ${alabamaFiles.length} files`);

if (alabamaUniqueHashes.length < alabamaFiles.length) {
  console.log('❌ DUPLICATE IMAGES FOUND in Alabama Dixieland Delight!');
} else {
  console.log('✅ All Alabama Dixieland Delight images are unique');
}

console.log('\n' + '='.repeat(60) + '\n');

// Check Eric Church Hell of a View designs
console.log('🔍 Checking Eric Church Hell of a View designs...\n');

const ericFiles = [
  'images/designs/eric-church-hell-of-a-view-guitar/eric-church-hell-of-a-view-guitar.webp',
  'images/designs/eric-church-hell-of-a-view-guitar-2/eric-church-hell-of-a-view-guitar-2.webp',
  'images/designs/eric-church-hell-of-a-view-guitar-3/eric-church-hell-of-a-view-guitar-3.webp'
];

const ericHashes = {};
ericFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const hash = getFileHash(file);
    const fileName = file.split('/').pop();
    ericHashes[fileName] = hash;
    console.log(`✅ ${fileName}: ${hash}`);
  } else {
    console.log(`❌ ${file} - File not found`);
  }
});

// Check for duplicates
const ericHashValues = Object.values(ericHashes);
const ericUniqueHashes = [...new Set(ericHashValues)];
console.log(`\n📊 Eric Church Hell of a View: ${ericUniqueHashes.length} unique images out of ${ericFiles.length} files`);

if (ericUniqueHashes.length < ericFiles.length) {
  console.log('❌ DUPLICATE IMAGES FOUND in Eric Church Hell of a View!');
} else {
  console.log('✅ All Eric Church Hell of a View images are unique');
}

console.log('\n' + '='.repeat(60) + '\n');

// Summary
const totalFiles = alabamaFiles.length + ericFiles.length;
const totalUnique = alabamaUniqueHashes.length + ericUniqueHashes.length;
console.log(`📊 SUMMARY: ${totalUnique} unique images out of ${totalFiles} total files`);

if (totalUnique < totalFiles) {
  console.log('❌ DUPLICATE IMAGES DETECTED - This explains why the website shows identical images!');
  console.log('💡 Solution: Replace the duplicate image files with unique designs');
} else {
  console.log('✅ All images are unique - The issue might be elsewhere');
}