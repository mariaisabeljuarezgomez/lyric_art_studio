// MINIMAL SERVER FOR DEBUGGING RAILWAY DEPLOYMENT
console.log('🚀 MINIMAL SERVER: Starting...');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log(`🚀 MINIMAL SERVER: PORT = ${PORT}`);
console.log(`🚀 MINIMAL SERVER: NODE_ENV = ${process.env.NODE_ENV}`);

// ONLY health check - nothing else
app.get('/api/health', (req, res) => {
    console.log('🏥 MINIMAL SERVER: Health check requested');
    res.status(200).json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT,
        message: 'Minimal server is running'
    });
});

// Basic route
app.get('/', (req, res) => {
    console.log('🏠 MINIMAL SERVER: Root route requested');
    res.json({ message: 'Minimal server homepage' });
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('🚨 MINIMAL SERVER: UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 MINIMAL SERVER: UNHANDLED REJECTION:', reason);
});

// Start server
console.log('🚀 MINIMAL SERVER: Starting server on port', PORT);
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ MINIMAL SERVER: Successfully listening on port ${PORT}`);
    console.log(`✅ MINIMAL SERVER: Health check at http://localhost:${PORT}/api/health`);
});

server.on('error', (err) => {
    console.error('❌ MINIMAL SERVER: Server error:', err);
});

server.on('listening', () => {
    console.log(`✅ MINIMAL SERVER: Server bound to port ${PORT}`);
});

console.log('🚀 MINIMAL SERVER: Setup complete, waiting for connections...'); 