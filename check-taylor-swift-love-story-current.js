// Check current Taylor Swift Love Story designs in database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkTaylorSwiftLoveStoryCurrent() {
    try {
        console.log('🔍 Checking current Taylor Swift Love Story designs in database...');
        
        // Check current state
        const currentResult = await pool.query(`
            SELECT design_id, name, artist, price, image_url
            FROM designs
            WHERE name LIKE '%Love Story%'
            ORDER BY design_id
        `);
        
        console.log('Current Taylor Swift Love Story designs:');
        currentResult.rows.forEach(row => {
            const folderName = row.image_url.split('/').pop().replace('.png', '');
            console.log(`Design ID ${row.design_id}: ${row.name} - $${row.price}`);
            console.log(`   URL: ${row.image_url}`);
            console.log(`   Folder: ${folderName}`);
            console.log('');
        });
        
        console.log('✅ Check complete!');
        
    } catch (error) {
        console.error('❌ Error checking Taylor Swift Love Story designs:', error);
    } finally {
        await pool.end();
    }
}

checkTaylorSwiftLoveStoryCurrent(); 