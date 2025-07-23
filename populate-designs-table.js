const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function populateDesignsTable() {
    try {
        console.log('🔄 Starting designs table population...');
        
        // Read the designs database
        const designsData = JSON.parse(fs.readFileSync('designs-database.json', 'utf8'));
        console.log(`📊 Found ${designsData.designs.length} designs in JSON database`);
        
        // Drop and recreate designs table to fix structure
        console.log('📋 Recreating designs table...');
        await pool.query('DROP TABLE IF EXISTS designs');
        await pool.query(`
            CREATE TABLE designs (
                design_id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                artist VARCHAR(255) NOT NULL,
                genre VARCHAR(100),
                category VARCHAR(100),
                price DECIMAL(10,2) DEFAULT 3.00,
                rating DECIMAL(3,2) DEFAULT 4.5,
                review_count INTEGER DEFAULT 10,
                image_url VARCHAR(500)
            );
        `);
        
        // Insert designs from JSON database
        console.log('📥 Inserting designs into database...');
        let insertedCount = 0;
        
        for (const design of designsData.designs) {
            try {
                // Generate a design_id from the folder name or use the id
                const designId = design.id || design.artist?.toLowerCase().replace(/\s+/g, '-') + '-' + design.song?.toLowerCase().replace(/\s+/g, '-') + '-' + design.shape?.toLowerCase();
                
                // Map shape to category
                let category = 'GUITAR';
                if (design.shape === 'PIANO') category = 'PIANO';
                else if (design.shape === 'CASSETTE') category = 'CASSETTE';
                
                // Generate image URL
                const imageUrl = design.image || `/images/designs/${designId}/${designId}.webp`;
                
                // Generate random rating and review count for variety
                const rating = (4.0 + Math.random() * 1.0).toFixed(1); // 4.0 to 5.0
                const reviewCount = Math.floor(Math.random() * 50) + 5; // 5 to 55
                
                await pool.query(`
                    INSERT INTO designs (
                        design_id, name, artist, genre, category, price, 
                        rating, review_count, image_url
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    designId,
                    design.song || 'Unknown Song',
                    design.artist || 'Unknown Artist',
                    design.genre || 'Rock',
                    category,
                    design.price || 3.00,
                    parseFloat(rating),
                    reviewCount,
                    imageUrl
                ]);
                
                insertedCount++;
                if (insertedCount % 100 === 0) {
                    console.log(`✅ Inserted ${insertedCount} designs...`);
                }
                
            } catch (error) {
                console.error(`❌ Error inserting design ${design.artist} - ${design.song}:`, error.message);
            }
        }
        
        console.log(`🎉 Successfully populated designs table with ${insertedCount} designs!`);
        
        // Verify the data
        const countResult = await pool.query('SELECT COUNT(*) FROM designs');
        console.log(`📊 Total designs in database: ${countResult.rows[0].count}`);
        
        // Show some sample data
        const sampleResult = await pool.query('SELECT design_id, name, artist, image_url FROM designs LIMIT 5');
        console.log('\n📋 Sample designs:');
        sampleResult.rows.forEach(row => {
            console.log(`  ${row.design_id}: ${row.name} by ${row.artist}`);
        });
        
    } catch (error) {
        console.error('❌ Error populating designs table:', error);
    } finally {
        await pool.end();
    }
}

// Run the script
populateDesignsTable(); 