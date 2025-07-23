const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function cleanupSessions() {
    console.log('🧹 Cleaning up sessions...');
    
    // Clean up file-based sessions
    const sessionsDir = path.join(__dirname, 'sessions');
    if (fs.existsSync(sessionsDir)) {
        const files = fs.readdirSync(sessionsDir);
        const sessionFiles = files.filter(file => file.endsWith('.json'));
        
        if (sessionFiles.length > 0) {
            console.log(`📁 Found ${sessionFiles.length} session files in sessions/ directory`);
            
            sessionFiles.forEach(file => {
                const filePath = path.join(sessionsDir, file);
                fs.unlinkSync(filePath);
                console.log(`🗑️  Deleted: ${file}`);
            });
            
            console.log('✅ All session files removed');
        } else {
            console.log('✅ No session files found');
        }
    } else {
        console.log('✅ Sessions directory does not exist');
    }
    
    // Clean up database sessions
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
        
        const result = await pool.query('DELETE FROM session');
        console.log(`🗄️  Deleted ${result.rowCount} database sessions`);
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error cleaning database sessions:', error.message);
    }
    
    console.log('🎉 Session cleanup complete!');
    console.log('');
    console.log('💡 To prevent this in the future:');
    console.log('   - Always use: npm start (or node start-server.js)');
    console.log('   - This ensures PostgreSQL sessions are used');
    console.log('   - File-based sessions are disabled');
}

cleanupSessions(); 