const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkPendingOrders() {
    try {
        console.log('🔍 Checking pending orders...');
        
        // Check pending orders
        const pendingResult = await pool.query(`
            SELECT * FROM pending_orders 
            WHERE processed = false 
            ORDER BY created_at DESC
        `);
        
        console.log(`📊 Found ${pendingResult.rows.length} pending orders:`);
        
        if (pendingResult.rows.length > 0) {
            pendingResult.rows.forEach((order, index) => {
                console.log(`\n${index + 1}. Order ID: ${order.order_id}`);
                console.log(`   User: ${order.user_name} (${order.user_email})`);
                console.log(`   Total: $${order.total}`);
                console.log(`   Created: ${order.created_at}`);
                console.log(`   Items: ${JSON.stringify(order.items)}`);
            });
            
            // Process the pending orders
            console.log('\n🔄 Processing pending orders...');
            for (const order of pendingResult.rows) {
                try {
                    // Insert into purchases table
                    for (const item of order.items) {
                        await pool.query(`
                            INSERT INTO purchases (
                                user_id, design_id, design_name, payment_id, 
                                order_id, amount, purchase_date
                            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
                        `, [
                            order.user_id,
                            item.itemId,
                            item.itemId, // Using itemId as design_name for now
                            order.order_id, // Using order_id as payment_id
                            order.order_id,
                            item.price
                        ]);
                    }
                    
                    // Mark as processed
                    await pool.query(`
                        UPDATE pending_orders 
                        SET processed = true 
                        WHERE order_id = $1
                    `, [order.order_id]);
                    
                    console.log(`✅ Processed order: ${order.order_id}`);
                    
                } catch (error) {
                    console.error(`❌ Error processing order ${order.order_id}:`, error.message);
                }
            }
        } else {
            console.log('✅ No pending orders found');
        }
        
        // Check purchases table
        const purchasesResult = await pool.query(`
            SELECT * FROM purchases 
            ORDER BY purchase_date DESC 
            LIMIT 10
        `);
        
        console.log(`\n📊 Recent purchases (${purchasesResult.rows.length}):`);
        purchasesResult.rows.forEach((purchase, index) => {
            console.log(`${index + 1}. ${purchase.design_name} - $${purchase.amount} - ${purchase.purchase_date}`);
        });
        
    } catch (error) {
        console.error('❌ Error checking pending orders:', error);
    } finally {
        await pool.end();
    }
}

// Run the script
checkPendingOrders(); 