require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:OCrMfnkeqCuKljjsbXJVzpVqXnEFMwAG@nozomi.proxy.rlwy.net:18246/railway'
});

async function checkNewsletterSubscribers() {
    try {
        console.log('📧 Checking newsletter subscribers...');
        
        // Get all subscribers
        const result = await pool.query(`
            SELECT 
                id,
                email,
                name,
                subscribed_at,
                status,
                welcome_email_sent,
                last_email_sent,
                ip_address
            FROM newsletter_subscribers 
            ORDER BY subscribed_at DESC
        `);
        
        console.log(`\n📊 Found ${result.rows.length} newsletter subscribers:`);
        console.log('='.repeat(80));
        
        result.rows.forEach((subscriber, index) => {
            console.log(`\n${index + 1}. ${subscriber.name} (${subscriber.email})`);
            console.log(`   ID: ${subscriber.id}`);
            console.log(`   Status: ${subscriber.status}`);
            console.log(`   Subscribed: ${subscriber.subscribed_at}`);
            console.log(`   Welcome Email Sent: ${subscriber.welcome_email_sent ? '✅ YES' : '❌ NO'}`);
            console.log(`   Last Email Sent: ${subscriber.last_email_sent || 'Never'}`);
            console.log(`   IP Address: ${subscriber.ip_address}`);
        });
        
        // Check specific subscriber
        const specificEmail = 'rogeliocorral2005@gmail.com';
        const specificResult = await pool.query(`
            SELECT * FROM newsletter_subscribers WHERE email = $1
        `, [specificEmail]);
        
        if (specificResult.rows.length > 0) {
            const subscriber = specificResult.rows[0];
            console.log(`\n🔍 Detailed check for ${specificEmail}:`);
            console.log('='.repeat(50));
            console.log(`Name: ${subscriber.name}`);
            console.log(`Email: ${subscriber.email}`);
            console.log(`Status: ${subscriber.status}`);
            console.log(`Welcome Email Sent: ${subscriber.welcome_email_sent ? '✅ YES' : '❌ NO'}`);
            console.log(`Last Email Sent: ${subscriber.last_email_sent || 'Never'}`);
            console.log(`Subscribed At: ${subscriber.subscribed_at}`);
            console.log(`IP Address: ${subscriber.ip_address}`);
            console.log(`User Agent: ${subscriber.user_agent}`);
        } else {
            console.log(`\n❌ Subscriber ${specificEmail} not found in database`);
        }
        
    } catch (error) {
        console.error('❌ Error checking newsletter subscribers:', error);
    } finally {
        await pool.end();
    }
}

// Run the check
checkNewsletterSubscribers().catch(console.error); 