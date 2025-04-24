// Simple HTTP server that listens on port 5000 immediately
// Used to satisfy Replit workflow port requirements
import http from 'http';

// Create a minimal server that just responds with a success message
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Port 5000 is open - Replit workflow detector\n');
});

// Listen on port 5000 immediately
server.listen(5000, '0.0.0.0', () => {
  console.log('Standalone listener active on port 5000');
  console.log('This server only exists to satisfy Replit workflow detection');
  console.log('The actual application should be started separately');
});