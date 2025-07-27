const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkDiscountUsage() {
    try {
        console.log('🔍 Checking discount usage for user...');
        
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
        
        // Check all usage records for this discount code
        const usageResult = await pool.query(`
            SELECT 
                dcu.id,
                dcu.user_id,
                dcu.email,
                dcu.ip_address,
                dcu.order_id,
                dcu.discount_amount,
                dcu.used_at,
                u.name as user_name
            FROM discount_code_usage dcu
            LEFT JOIN users u ON dcu.user_id = u.id
            WHERE dcu.code_id = $1
            ORDER BY dcu.used_at DESC
        `, [discountCode.id]);
        
        console.log(`\n📊 Total usage records for WELCOME100: ${usageResult.rows.length}`);
        
        if (usageResult.rows.length > 0) {
            console.log('\n📋 Usage Records:');
            usageResult.rows.forEach((record, index) => {
                console.log(`\n${index + 1}. Record ID: ${record.id}`);
                console.log(`   User ID: ${record.user_id || 'NULL'}`);
                console.log(`   Email: ${record.email || 'NULL'}`);
                console.log(`   IP Address: ${record.ip_address || 'NULL'}`);
                console.log(`   Order ID: ${record.order_id}`);
                console.log(`   Discount Amount: $${record.discount_amount}`);
                console.log(`   Used At: ${record.used_at}`);
                console.log(`   User Name: ${record.user_name || 'NULL'}`);
            });
            
            // Check for duplicate usage by email
            const emailUsage = {};
            usageResult.rows.forEach(record => {
                if (record.email) {
                    if (!emailUsage[record.email]) {
                        emailUsage[record.email] = [];
                    }
                    emailUsage[record.email].push(record);
                }
            });
            
            console.log('\n🔍 Duplicate Usage Analysis:');
            Object.keys(emailUsage).forEach(email => {
                const records = emailUsage[email];
                if (records.length > 1) {
                    console.log(`❌ DUPLICATE USAGE FOUND for email: ${email}`);
                    console.log(`   Number of uses: ${records.length}`);
                    records.forEach((record, index) => {
                        console.log(`   ${index + 1}. Order: ${record.order_id}, Date: ${record.used_at}`);
                    });
                } else {
                    console.log(`✅ Single usage for email: ${email}`);
                }
            });
            
            // Check for duplicate usage by user_id
            const userIdUsage = {};
            usageResult.rows.forEach(record => {
                if (record.user_id) {
                    if (!userIdUsage[record.user_id]) {
                        userIdUsage[record.user_id] = [];
                    }
                    userIdUsage[record.user_id].push(record);
                }
            });
            
            console.log('\n🔍 User ID Usage Analysis:');
            Object.keys(userIdUsage).forEach(userId => {
                const records = userIdUsage[userId];
                if (records.length > 1) {
                    console.log(`❌ DUPLICATE USAGE FOUND for user ID: ${userId}`);
                    console.log(`   Number of uses: ${records.length}`);
                    records.forEach((record, index) => {
                        console.log(`   ${index + 1}. Order: ${record.order_id}, Date: ${record.used_at}`);
                    });
                } else {
                    console.log(`✅ Single usage for user ID: ${userId}`);
                }
            });
            
        } else {
            console.log('✅ No usage records found for WELCOME100');
        }
        
    } catch (error) {
        console.error('❌ Error checking discount usage:', error);
    } finally {
        await pool.end();
    }
}

checkDiscountUsage(); 