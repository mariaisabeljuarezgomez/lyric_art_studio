const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkRecentPending() {
    try {
        console.log('🔍 Checking recent pending orders and purchases...');
        
        // Check all pending orders (including processed ones)
        const pendingResult = await pool.query(`
            SELECT * FROM pending_orders 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        
        console.log(`📊 Found ${pendingResult.rows.length} pending orders (all):`);
        
        if (pendingResult.rows.length > 0) {
            pendingResult.rows.forEach((order, index) => {
                console.log(`\n${index + 1}. Order ID: ${order.order_id}`);
                console.log(`   User: ${order.user_name} (${order.user_email})`);
                console.log(`   Total: $${order.total}`);
                console.log(`   Created: ${order.created_at}`);
                console.log(`   Processed: ${order.processed}`);
                console.log(`   Items: ${JSON.stringify(order.items)}`);
            });
        }
        
        // Check recent purchases
        const purchaseResult = await pool.query(`
            SELECT * FROM purchases 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        
        console.log(`\n📊 Found ${purchaseResult.rows.length} recent purchases:`);
        
        if (purchaseResult.rows.length > 0) {
            purchaseResult.rows.forEach((purchase, index) => {
                console.log(`\n${index + 1}. Design: ${purchase.design_name} (${purchase.design_id})`);
                console.log(`   User: ${purchase.user_id}`);
                console.log(`   Amount: $${purchase.amount}`);
                console.log(`   Order ID: ${purchase.order_id}`);
                console.log(`   Payment ID: ${purchase.payment_id}`);
                console.log(`   Created: ${purchase.created_at}`);
            });
        }
        
        // Check if there are any unprocessed pending orders
        const unprocessedResult = await pool.query(`
            SELECT COUNT(*) FROM pending_orders WHERE processed = false
        `);
        
        console.log(`\n📊 Unprocessed pending orders: ${unprocessedResult.rows[0].count}`);
        
        // Process any unprocessed pending orders
        if (unprocessedResult.rows[0].count > 0) {
            console.log('\n🔄 Processing unprocessed pending orders...');
            
            const unprocessedOrders = await pool.query(`
                SELECT * FROM pending_orders WHERE processed = false
            `);
            
            for (const order of unprocessedOrders.rows) {
                console.log(`\n📦 Processing order: ${order.order_id}`);
                console.log(`   Items: ${order.items.length} items`);
                
                // Record each purchased item
                for (const item of order.items) {
                    const designId = item.itemId;
                    const designName = item.title || designId;
                    const amount = item.price || 3.00;
                    
                    // Store purchase in database
                    await pool.query(`
                        INSERT INTO purchases (user_id, design_id, design_name, payment_id, order_id, amount)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        order.user_id,
                        designId,
                        designName,
                        order.order_id, // Use order_id as payment_id for now
                        order.order_id,
                        amount
                    ]);
                    
                    console.log(`   💾 Purchase recorded: ${designId} - $${amount}`);
                }
                
                // Mark pending order as processed
                await pool.query(`
                    UPDATE pending_orders SET processed = true WHERE order_id = $1
                `, [order.order_id]);
                
                console.log(`   ✅ Order marked as processed`);
            }
            
            console.log('\n🎉 All pending orders processed!');
        }
        
    } catch (error) {
        console.error('❌ Error checking recent data:', error);
    } finally {
        await pool.end();
    }
}

// Run the script
checkRecentPending(); 