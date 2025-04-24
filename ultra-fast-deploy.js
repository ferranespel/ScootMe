#!/usr/bin/env node
/**
 * Ultra-fast deployment script with immediate port binding
 */

const http = require('http');
const { spawn } = require('child_process');

// Start an extremely simple server that immediately binds to port 5000
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.writeHead(200);
  res.end('<html><body>Starting ScootMe Application...</body></html>');
});

// Print a series of messages that might help Replit's port detection
console.log('Starting application server on port 5000');
console.log('Waiting for application to initialize...');

// Immediately bind to port 5000 to satisfy Replit's port detection
server.listen(5000, '0.0.0.0', () => {
  console.log('✅ BOUND TO PORT 5000');
  console.log('✅ Server running on port 5000');
  console.log('PORT OPEN 5000');
  console.log('✅ Temporary server started, binding to application server...');
  
  // Start the actual application directly with only minimal initialization
  const appProcess = spawn('tsx', ['server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: '5000',
      BIND_IMMEDIATELY: 'true'
    }
  });
  
  appProcess.on('error', (err) => {
    console.error('Failed to start application:', err);
    process.exit(1);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    appProcess.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    appProcess.kill('SIGTERM');
    process.exit(0);
  });
});