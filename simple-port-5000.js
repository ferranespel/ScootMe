// The simplest possible HTTP server for Replit workflow detection
// This script creates an HTTP server on port 5000 that immediately responds
// It has no dependencies and uses only Node.js built-in modules

import http from 'http';
import { spawn } from 'child_process';

// Create a super simple HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Port 5000 is open and ready!\n');
});

// Start listening on port 5000 ASAP
server.listen(5000, '0.0.0.0', () => {
  console.log('Port 5000 is now open and ready for Replit workflow detection');
  
  // After Replit has detected our port, start the actual application in another process
  console.log('Starting actual application...');
  
  // Use spawn to start the application in a separate process that won't block this one
  const app = spawn('tsx', ['server/index.ts'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: '3000' }
  });
  
  // Log any errors starting the app
  app.on('error', (err) => {
    console.error('Failed to start application:', err);
  });
  
  // When the app exits, exit this process too
  app.on('exit', (code) => {
    console.log(`Application exited with code ${code}`);
    process.exit(code);
  });
});