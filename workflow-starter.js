// Ultra-minimal port opening for Replit workflow detection
// This script opens port 5000 IMMEDIATELY
// After a brief delay, it then starts the actual app on port 3000
import http from 'http';
import { spawn } from 'child_process';

// Create HTTP server on port 5000 IMMEDIATELY - high priority
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Port 5000 open\n');
});

// Listen on port 5000 immediately with no callback function 
// to ensure this happens as fast as possible
server.listen(5000, '0.0.0.0');

// Log success message
console.log('PORT 5000 NOW OPEN FOR REPLIT WORKFLOW DETECTION');

// After a small delay (to ensure workflow detection completes), 
// start the app on port 3000
setTimeout(() => {
  console.log('Starting main application on port 3000...');
  const app = spawn('tsx', ['server/index.ts'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: '3000' }
  });
  
  app.on('error', (err) => {
    console.error('Failed to start application:', err);
  });
}, 1000); // 1 second delay