const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkPendingOrders() {
    try {
        console.log('🔍 Checking pending orders...');
        
        // Get all pending orders
        const pendingOrdersResult = await pool.query(`
            SELECT 
                id,
                order_id,
                user_id,
                user_email,
                user_name,
                items,
                total,
                discount_info,
                created_at,
                processed
            FROM pending_orders
            ORDER BY created_at DESC
        `);
        
        console.log(`📊 Total pending orders: ${pendingOrdersResult.rows.length}`);
        
        if (pendingOrdersResult.rows.length > 0) {
            console.log('\n📋 Pending Orders:');
            pendingOrdersResult.rows.forEach((order, index) => {
                console.log(`\n${index + 1}. Order ID: ${order.order_id}`);
                console.log(`   User ID: ${order.user_id || 'NULL'}`);
                console.log(`   Email: ${order.user_email || 'NULL'}`);
                console.log(`   Total: $${order.total}`);
                console.log(`   Created: ${order.created_at}`);
                console.log(`   Processed: ${order.processed}`);
                
                if (order.discount_info) {
                    console.log(`   🎫 Discount Info: ${JSON.stringify(order.discount_info, null, 2)}`);
                } else {
                    console.log(`   ❌ No discount info`);
                }
                
                if (order.items) {
                    const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
                    console.log(`   📦 Items: ${items.length} items`);
                    items.forEach((item, itemIndex) => {
                        console.log(`     ${itemIndex + 1}. ${item.designName || item.title} - $${item.price}`);
                    });
                }
            });
            
            // Check for orders with discount info
            const ordersWithDiscount = pendingOrdersResult.rows.filter(order => order.discount_info);
            console.log(`\n🎫 Orders with discount info: ${ordersWithDiscount.length}`);
            
            if (ordersWithDiscount.length > 0) {
                console.log('\n🔍 Discount Analysis:');
                ordersWithDiscount.forEach((order, index) => {
                    console.log(`\n${index + 1}. Order: ${order.order_id}`);
                    console.log(`   Email: ${order.user_email}`);
                    console.log(`   Discount: ${JSON.stringify(order.discount_info)}`);
                    console.log(`   Processed: ${order.processed}`);
                });
            }
            
            // Check for duplicate orders by email
            const emailOrders = {};
            pendingOrdersResult.rows.forEach(order => {
                if (order.user_email) {
                    if (!emailOrders[order.user_email]) {
                        emailOrders[order.user_email] = [];
                    }
                    emailOrders[order.user_email].push(order);
                }
            });
            
            console.log('\n🔍 Duplicate Order Analysis:');
            Object.keys(emailOrders).forEach(email => {
                const orders = emailOrders[email];
                if (orders.length > 1) {
                    console.log(`⚠️ Multiple orders for email: ${email}`);
                    orders.forEach((order, index) => {
                        console.log(`   ${index + 1}. Order: ${order.order_id}, Total: $${order.total}, Discount: ${order.discount_info ? 'Yes' : 'No'}`);
                    });
                }
            });
            
        } else {
            console.log('✅ No pending orders found');
        }
        
    } catch (error) {
        console.error('❌ Error checking pending orders:', error);
    } finally {
        await pool.end();
    }
}

checkPendingOrders(); 