// Simple script to immediately open port 5000 for Replit
const http = require('http');

console.log("Starting immediate port 5000 listener...");

// Create a very simple server on port 5000
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Port 5000 is open\n');
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Port 5000 listener active!');
});