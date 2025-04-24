/**
 * Simple HTTP server that listens on port 5000 immediately
 * Used to satisfy Replit workflow port requirements
 */
const http = require('http');

console.log('Starting immediate port 5000 listener for workflow compatibility');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Port 5000 active - Replit workflow compatibility server');
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Port 5000 listener active and ready');
});