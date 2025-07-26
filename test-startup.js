// Simple startup test for debugging
console.log('🧪 Testing server startup...');

// Set environment variables for testing
process.env.PORT = process.env.PORT || 8080;
process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/test';

console.log('🧪 Environment variables set');
console.log(`PORT: ${process.env.PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'MISSING'}`);

try {
    console.log('🧪 Requiring server file...');
    require('./server-railway-production.js');
    console.log('✅ Server file loaded successfully');
} catch (error) {
    console.error('❌ Server startup failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
} 