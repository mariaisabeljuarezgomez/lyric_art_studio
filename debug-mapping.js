const fs = require('fs');
const path = require('path');

// Read Cloudinary upload results
const cloudinaryResultsPath = path.join(__dirname, 'cloudinary-uploads.json');
const cloudinaryResults = JSON.parse(fs.readFileSync(cloudinaryResultsPath, 'utf8'));

// Create a mapping of original paths to Cloudinary URLs
const urlMapping = {};
cloudinaryResults.forEach(result => {
  // Extract the relative path from the full path and normalize to forward slashes
  const relativePath = path.relative(path.join(__dirname, 'images'), result.originalPath);
  const normalizedPath = relativePath.replace(/\\/g, '/'); // Convert backslashes to forward slashes
  urlMapping[normalizedPath] = result.cloudinaryUrl;
});

console.log('📊 Found', Object.keys(urlMapping).length, 'Cloudinary URLs');
console.log('\n🔍 First 5 mappings:');
Object.keys(urlMapping).slice(0, 5).forEach(key => {
  console.log(`  "${key}" → "${urlMapping[key]}"`);
});

// Check a specific database path
const testPath = 'designs/ac-dc-back-in-black-guitar/ac-dc-back-in-black-guitar.webp';
console.log(`\n🔍 Testing path: "${testPath}"`);
console.log(`  Found in mapping: ${urlMapping[testPath] ? 'YES' : 'NO'}`);

// Check what the actual database path looks like
const databasePath = path.join(__dirname, 'designs-database.json');
const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
const firstDesign = database.designs[0];
console.log(`\n🔍 First design image path: "${firstDesign.image}"`);
console.log(`  Found in mapping: ${urlMapping[firstDesign.image] ? 'YES' : 'NO'}`); 