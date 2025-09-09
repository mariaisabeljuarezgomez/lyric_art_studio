require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:OCrMfnkeqCuKljjsbXJVzpVqXnEFMwAG@nozomi.proxy.rlwy.net:18246/railway'
});

async function checkLoriCart() {
    try {
        console.log('🔍 Searching for Lori\'s cart data...');
        
        // First, let's see what tables exist
        console.log('\n📋 Checking available tables...');
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('Available tables:');
        tablesResult.rows.forEach(table => {
            console.log(`  - ${table.table_name}`);
        });
        
        // Check sessions table for Lori's session
        console.log('\n📋 Checking sessions table...');
        const sessionsResult = await pool.query(`
            SELECT 
                sid,
                sess,
                expire
            FROM session 
            WHERE sess::text ILIKE '%lori%'
            ORDER BY expire DESC
        `);
        
        console.log(`Found ${sessionsResult.rows.length} sessions with 'lori' in data:`);
        sessionsResult.rows.forEach((session, index) => {
            console.log(`\n${index + 1}. Session ID: ${session.sid}`);
            console.log(`   Expires: ${session.expire}`);
            console.log(`   Session Data: ${JSON.stringify(session.sess, null, 2)}`);
        });
        
        // Check for recent sessions (last 24 hours)
        console.log('\n📋 Checking recent sessions (last 24 hours)...');
        const recentSessionsResult = await pool.query(`
            SELECT 
                sid,
                sess,
                expire
            FROM session 
            WHERE expire > NOW() - INTERVAL '24 hours'
            ORDER BY expire DESC
            LIMIT 10
        `);
        
        console.log(`Found ${recentSessionsResult.rows.length} recent sessions:`);
        recentSessionsResult.rows.forEach((session, index) => {
            console.log(`\n${index + 1}. Recent Session ID: ${session.sid}`);
            console.log(`   Expires: ${session.expire}`);
            console.log(`   Session Data: ${JSON.stringify(session.sess, null, 2)}`);
        });
        
        // Check cart_items table structure
        console.log('\n📋 Checking cart_items table structure...');
        const cartItemsColumnsResult = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'cart_items'
            ORDER BY ordinal_position
        `);
        
        console.log('Cart_items table columns:');
        cartItemsColumnsResult.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        // Check cart_items table
        console.log('\n📋 Checking cart_items table...');
        const cartItemsResult = await pool.query(`
            SELECT * FROM cart_items 
            WHERE to_json(cart_items)::text ILIKE '%lori%'
        `);
        
        console.log(`Found ${cartItemsResult.rows.length} cart items for Lori:`);
        cartItemsResult.rows.forEach((item, index) => {
            console.log(`\n${index + 1}. Cart Item:`);
            console.log(`   ${JSON.stringify(item, null, 2)}`);
        });
        
        // Check for recent cart items (last 24 hours)
        console.log('\n📋 Checking recent cart items (last 24 hours)...');
        const recentCartItemsResult = await pool.query(`
            SELECT * FROM cart_items 
            WHERE added_at > NOW() - INTERVAL '24 hours'
            ORDER BY added_at DESC
            LIMIT 10
        `);
        
        console.log(`Found ${recentCartItemsResult.rows.length} recent cart items:`);
        recentCartItemsResult.rows.forEach((item, index) => {
            console.log(`\n${index + 1}. Recent Cart Item:`);
            console.log(`   ${JSON.stringify(item, null, 2)}`);
        });
        
        // Check pending_orders table structure
        console.log('\n📋 Checking pending_orders table structure...');
        const pendingOrdersColumnsResult = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'pending_orders'
            ORDER BY ordinal_position
        `);
        
        console.log('Pending_orders table columns:');
        pendingOrdersColumnsResult.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        // Check pending_orders table
        console.log('\n📋 Checking pending_orders table...');
        const pendingOrdersResult = await pool.query(`
            SELECT * FROM pending_orders 
            WHERE to_json(pending_orders)::text ILIKE '%lori%'
        `);
        
        console.log(`Found ${pendingOrdersResult.rows.length} pending orders for Lori:`);
        pendingOrdersResult.rows.forEach((order, index) => {
            console.log(`\n${index + 1}. Pending Order:`);
            console.log(`   ${JSON.stringify(order, null, 2)}`);
        });
        
        // Check for recent pending orders (last 24 hours)
        console.log('\n📋 Checking recent pending orders (last 24 hours)...');
        const recentPendingOrdersResult = await pool.query(`
            SELECT * FROM pending_orders 
            WHERE created_at > NOW() - INTERVAL '24 hours'
            ORDER BY created_at DESC
            LIMIT 10
        `);
        
        console.log(`Found ${recentPendingOrdersResult.rows.length} recent pending orders:`);
        recentPendingOrdersResult.rows.forEach((order, index) => {
            console.log(`\n${index + 1}. Recent Pending Order:`);
            console.log(`   ${JSON.stringify(order, null, 2)}`);
        });
        
        // Check orders table structure first
        console.log('\n📋 Checking orders table structure...');
        const ordersColumnsResult = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'orders'
            ORDER BY ordinal_position
        `);
        
        console.log('Orders table columns:');
        ordersColumnsResult.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        // Now check for Lori's orders with correct column names
        console.log('\n📋 Checking orders table for Lori...');
        const ordersResult = await pool.query(`
            SELECT * FROM orders 
            WHERE to_json(orders)::text ILIKE '%lori%'
        `);
        
        console.log(`Found ${ordersResult.rows.length} orders for Lori:`);
        ordersResult.rows.forEach((order, index) => {
            console.log(`\n${index + 1}. Order:`);
            console.log(`   ${JSON.stringify(order, null, 2)}`);
        });
        
        // Check for recent orders (last 24 hours)
        console.log('\n📋 Checking recent orders (last 24 hours)...');
        const recentOrdersResult = await pool.query(`
            SELECT * FROM orders 
            WHERE created_at > NOW() - INTERVAL '24 hours'
            ORDER BY created_at DESC
            LIMIT 10
        `);
        
        console.log(`Found ${recentOrdersResult.rows.length} recent orders:`);
        recentOrdersResult.rows.forEach((order, index) => {
            console.log(`\n${index + 1}. Recent Order:`);
            console.log(`   ${JSON.stringify(order, null, 2)}`);
        });
        
        // Check purchases table structure
        console.log('\n📋 Checking purchases table structure...');
        const purchasesColumnsResult = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'purchases'
            ORDER BY ordinal_position
        `);
        
        console.log('Purchases table columns:');
        purchasesColumnsResult.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        // Check purchases table
        console.log('\n📋 Checking purchases table...');
        const purchasesResult = await pool.query(`
            SELECT * FROM purchases 
            WHERE to_json(purchases)::text ILIKE '%lori%'
        `);
        
        console.log(`Found ${purchasesResult.rows.length} purchases for Lori:`);
        purchasesResult.rows.forEach((purchase, index) => {
            console.log(`\n${index + 1}. Purchase:`);
            console.log(`   ${JSON.stringify(purchase, null, 2)}`);
        });
        
        // Check for recent purchases (last 24 hours)
        console.log('\n📋 Checking recent purchases (last 24 hours)...');
        const recentPurchasesResult = await pool.query(`
            SELECT * FROM purchases 
            WHERE purchase_date > NOW() - INTERVAL '24 hours'
            ORDER BY purchase_date DESC
            LIMIT 10
        `);
        
        console.log(`Found ${recentPurchasesResult.rows.length} recent purchases:`);
        recentPurchasesResult.rows.forEach((purchase, index) => {
            console.log(`\n${index + 1}. Recent Purchase:`);
            console.log(`   ${JSON.stringify(purchase, null, 2)}`);
        });
        
        // Check all tables for any Lori-related data
        console.log('\n📋 Checking all tables for Lori-related data...');
        for (const table of tablesResult.rows) {
            try {
                const tableData = await pool.query(`
                    SELECT * FROM "${table.table_name}" 
                    WHERE to_json("${table.table_name}")::text ILIKE '%lori%'
                    LIMIT 3
                `);
                
                if (tableData.rows.length > 0) {
                    console.log(`\n📋 Found Lori data in ${table.table_name}:`);
                    tableData.rows.forEach((row, index) => {
                        console.log(`   ${index + 1}. ${JSON.stringify(row, null, 2)}`);
                    });
                }
            } catch (error) {
                // Skip tables that can't be queried
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking Lori\'s cart:', error);
    } finally {
        await pool.end();
    }
}

// Run the check
checkLoriCart().catch(console.error); 