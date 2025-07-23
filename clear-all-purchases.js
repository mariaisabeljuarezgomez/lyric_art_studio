const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function clearAllPurchases() {
    try {
        console.log('🧹 Clearing ALL purchases from database...');
        
        // Delete all purchases
        const deleteResult = await pool.query('DELETE FROM purchases');
        console.log(`✅ Deleted ${deleteResult.rowCount} purchases from database`);
        
        // Also clear any pending orders
        const clearPendingResult = await pool.query('DELETE FROM pending_orders');
        console.log(`✅ Deleted ${clearPendingResult.rowCount} pending orders from database`);
        
        // Verify the database is clean
        const purchaseCount = await pool.query('SELECT COUNT(*) FROM purchases');
        const pendingCount = await pool.query('SELECT COUNT(*) FROM pending_orders');
        
        console.log(`📊 Database status:`);
        console.log(`   - Purchases: ${purchaseCount.rows[0].count}`);
        console.log(`   - Pending orders: ${pendingCount.rows[0].count}`);
        
        console.log('🎉 Database is now clean! You can start fresh with new purchases.');
        
    } catch (error) {
        console.error('❌ Error clearing purchases:', error);
    } finally {
        await pool.end();
    }
}

// Run the script
clearAllPurchases(); 