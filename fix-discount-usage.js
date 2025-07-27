const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixDiscountUsage() {
    try {
        console.log('🔧 Fixing discount usage records...');
        
        // Get the WELCOME100 discount code ID
        const discountCodeResult = await pool.query(`
            SELECT id, code, discount_value, discount_type, used_count 
            FROM discount_codes 
            WHERE code = 'WELCOME100'
        `);
        
        if (discountCodeResult.rows.length === 0) {
            console.log('❌ WELCOME100 discount code not found');
            return;
        }
        
        const discountCode = discountCodeResult.rows[0];
        console.log('🎫 WELCOME100 Discount Code Info:', {
            id: discountCode.id,
            code: discountCode.code,
            discount_value: discountCode.discount_value,
            discount_type: discountCode.discount_type,
            used_count: discountCode.used_count
        });
        
        // Find all processed orders with discount info that don't have usage records
        const pendingOrdersResult = await pool.query(`
            SELECT 
                po.order_id,
                po.user_id,
                po.user_email,
                po.discount_info,
                po.total,
                po.processed
            FROM pending_orders po
            WHERE po.discount_info IS NOT NULL 
            AND po.processed = true
            AND po.discount_info::json->>'code' = 'WELCOME100'
            ORDER BY po.created_at DESC
        `);
        
        console.log(`📊 Found ${pendingOrdersResult.rows.length} processed orders with WELCOME100 discount`);
        
        if (pendingOrdersResult.rows.length > 0) {
            console.log('\n📋 Processing orders:');
            
            for (const order of pendingOrdersResult.rows) {
                const discountInfo = order.discount_info;
                console.log(`\n🔍 Processing order: ${order.order_id}`);
                console.log(`   Email: ${order.user_email}`);
                console.log(`   Discount: ${JSON.stringify(discountInfo)}`);
                
                // Check if usage record already exists
                const existingUsageResult = await pool.query(`
                    SELECT COUNT(*) as usage_count FROM discount_code_usage 
                    WHERE code_id = $1 
                    AND (user_id = $2 OR email = $3)
                `, [discountCode.id, order.user_id, order.user_email]);
                
                const existingUsage = parseInt(existingUsageResult.rows[0].usage_count);
                
                if (existingUsage > 0) {
                    console.log(`   ⚠️ Usage record already exists for this user, skipping`);
                } else {
                    // Record the discount usage
                    await pool.query(`
                        INSERT INTO discount_code_usage (
                            code_id, user_id, email, ip_address, order_id, discount_amount
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                    `, [discountCode.id, order.user_id, order.user_email, null, order.order_id, discountInfo.discountAmount]);
                    
                    console.log(`   ✅ Discount usage recorded for order: ${order.order_id}`);
                }
            }
            
            // Update the discount code usage count
            const totalUsageResult = await pool.query(`
                SELECT COUNT(*) as total_usage FROM discount_code_usage 
                WHERE code_id = $1
            `, [discountCode.id]);
            
            const totalUsage = parseInt(totalUsageResult.rows[0].total_usage);
            
            await pool.query(`
                UPDATE discount_codes 
                SET used_count = $1 
                WHERE id = $2
            `, [totalUsage, discountCode.id]);
            
            console.log(`\n✅ Updated discount code usage count to: ${totalUsage}`);
            
        } else {
            console.log('✅ No processed orders with WELCOME100 discount found');
        }
        
        // Show final usage records
        const finalUsageResult = await pool.query(`
            SELECT 
                dcu.id,
                dcu.user_id,
                dcu.email,
                dcu.order_id,
                dcu.discount_amount,
                dcu.used_at,
                u.name as user_name
            FROM discount_code_usage dcu
            LEFT JOIN users u ON dcu.user_id = u.id
            WHERE dcu.code_id = $1
            ORDER BY dcu.used_at DESC
        `, [discountCode.id]);
        
        console.log(`\n📊 Final usage records for WELCOME100: ${finalUsageResult.rows.length}`);
        
        if (finalUsageResult.rows.length > 0) {
            console.log('\n📋 Usage Records:');
            finalUsageResult.rows.forEach((record, index) => {
                console.log(`\n${index + 1}. Record ID: ${record.id}`);
                console.log(`   User ID: ${record.user_id || 'NULL'}`);
                console.log(`   Email: ${record.email || 'NULL'}`);
                console.log(`   Order ID: ${record.order_id}`);
                console.log(`   Discount Amount: $${record.discount_amount}`);
                console.log(`   Used At: ${record.used_at}`);
                console.log(`   User Name: ${record.user_name || 'NULL'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error fixing discount usage:', error);
    } finally {
        await pool.end();
    }
}

fixDiscountUsage(); 