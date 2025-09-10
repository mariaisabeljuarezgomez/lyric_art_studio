const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Folders to remove (duplicates)
const foldersToRemove = [
  'alabama-dixieland-delight-guitar-2',
  'eric-church-hell-of-a-view-guitar-3', 
  'eric-church-old-friends-guitar-2'
];

console.log('🗑️  REMOVING DUPLICATE FOLDERS AND DATABASE ENTRIES...\n');
console.log('⚠️  This will permanently delete the following folders:');
foldersToRemove.forEach(folder => console.log(`   - ${folder}`));
console.log('');

// Function to safely delete folder
function deleteFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    console.log(`❌ Folder not found: ${folderPath}`);
    return false;
  }
  
  try {
    // Get folder size before deletion
    const stats = fs.statSync(folderPath);
    const size = stats.isDirectory() ? getFolderSize(folderPath) : stats.size;
    
    // Delete folder recursively
    fs.rmSync(folderPath, { recursive: true, force: true });
    
    console.log(`✅ Deleted: ${path.basename(folderPath)} (${(size / 1024).toFixed(1)} KB)`);
    return true;
  } catch (error) {
    console.log(`❌ Error deleting ${folderPath}: ${error.message}`);
    return false;
  }
}

// Function to get folder size
function getFolderSize(folderPath) {
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

// Function to remove from local database
function removeFromLocalDatabase(folderName) {
  try {
    const dbPath = 'designs-database.json';
    if (!fs.existsSync(dbPath)) {
      console.log(`❌ Database file not found: ${dbPath}`);
      return false;
    }
    
    const database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const originalLength = database.length;
    
    // Remove entries that match the folder name
    const filteredDatabase = database.filter(design => {
      const imagePath = design.image || design.webp || '';
      return !imagePath.includes(folderName);
    });
    
    const removedCount = originalLength - filteredDatabase.length;
    
    if (removedCount > 0) {
      fs.writeFileSync(dbPath, JSON.stringify(filteredDatabase, null, 2));
      console.log(`✅ Removed ${removedCount} entries from local database`);
      return true;
    } else {
      console.log(`⚠️  No database entries found for ${folderName}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error updating local database: ${error.message}`);
    return false;
  }
}

// Function to remove from Railway database
async function removeFromRailwayDatabase(folderName) {
  const client = new Client({
    connectionString: 'postgresql://postgres:OCrMfnkeqCuKljjsbXJVzpVqXnEFMwAG@nozomi.proxy.rlwy.net:18246/railway'
  });

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL database');

    // Find and delete entries that match the folder name
    const result = await client.query(
      'DELETE FROM designs WHERE image_url LIKE $1 OR webp_url LIKE $1',
      [`%${folderName}%`]
    );

    console.log(`✅ Removed ${result.rowCount} entries from Railway database`);
    return true;
  } catch (error) {
    console.log(`❌ Error updating Railway database: ${error.message}`);
    return false;
  } finally {
    await client.end();
  }
}

// Main execution
async function main() {
  let successCount = 0;
  let totalCount = foldersToRemove.length;

  console.log('📁 DELETING FOLDERS...');
  console.log('─'.repeat(40));
  
  for (const folder of foldersToRemove) {
    const folderPath = path.join('images/designs', folder);
    if (deleteFolder(folderPath)) {
      successCount++;
    }
  }

  console.log('\n📊 UPDATING LOCAL DATABASE...');
  console.log('─'.repeat(40));
  
  for (const folder of foldersToRemove) {
    removeFromLocalDatabase(folder);
  }

  console.log('\n🌐 UPDATING RAILWAY DATABASE...');
  console.log('─'.repeat(40));
  
  for (const folder of foldersToRemove) {
    await removeFromRailwayDatabase(folder);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 SUMMARY: Successfully processed ${successCount}/${totalCount} folders`);
  
  if (successCount === totalCount) {
    console.log('✅ All duplicate folders and database entries removed successfully!');
    console.log('🌐 Your website should now show only unique designs.');
  } else {
    console.log('⚠️  Some folders could not be removed. Please check the errors above.');
  }
}

// Run the script
main().catch(console.error);
