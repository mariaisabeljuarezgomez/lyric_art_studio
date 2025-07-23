#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Lyric Art Studio Server...');
console.log('📁 Using server-railway-production.js (PostgreSQL sessions)');
console.log('🔒 Sessions will be stored in PostgreSQL database');
console.log('');

// Start the correct server file
const serverProcess = spawn('node', ['server-railway-production.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

serverProcess.on('exit', (code) => {
    console.log(`\n🛑 Server exited with code ${code}`);
    process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGTERM');
}); 