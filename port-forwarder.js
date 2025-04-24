// A simple port forwarder that listens on port 5000 and forwards to port 3000
import { createServer as createHttpServer } from 'http';
import { request as httpRequest } from 'http';

console.log('Starting port forwarder: 5000 -> 3000');

const server = createHttpServer((req, res) => {
  console.log(`Forwarding request: ${req.method} ${req.url}`);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  
  const proxyReq = httpRequest(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  
  req.pipe(proxyReq, { end: true });
  
  proxyReq.on('error', (err) => {
    console.error('Error forwarding request:', err);
    res.writeHead(502);
    res.end('Bad Gateway');
  });
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Port forwarder active and ready: 5000 -> 3000');
});