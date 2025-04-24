// A specialized script for Replit workflow compatibility
// This script opens port 5000 immediately to satisfy Replit's workflow detection
// and then starts a proxy to our main app running on port 3000
import { createServer } from 'http';
import { spawn } from 'child_process';
import http from 'http';

// Create a minimal HTTP server that will listen on port 5000 immediately
const proxyServer = createServer((req, res) => {
  // Log the incoming request
  console.log(`[Proxy] Forwarding: ${req.method} ${req.url}`);
  
  // Forward the request to our actual server on port 3000
  const proxyReq = http.request({
    host: 'localhost',
    port: 3000,
    path: req.url,
    method: req.method,
    headers: req.headers
  }, (proxyRes) => {
    // Copy the response status and headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    
    // Pipe the response data
    proxyRes.pipe(res, { end: true });
  });
  
  // Handle errors in the proxy request
  proxyReq.on('error', (err) => {
    console.error('[Proxy] Error forwarding request:', err.message);
    
    // If we get a connection refused, the main app may not be ready yet
    if (err.code === 'ECONNREFUSED') {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Application is starting, please try again in a moment...');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });
  
  // If the original request has a body, pipe it to the proxy request
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    req.pipe(proxyReq, { end: true });
  } else {
    proxyReq.end();
  }
});

// Start listening on port 5000 immediately - this is critical for Replit to detect our app
proxyServer.listen(5000, '0.0.0.0', () => {
  console.log('[Replit Bridge] PORT 5000 IS NOW OPEN - Replit workflow detection satisfied');
  
  // Now, we can start our actual application on port 3000
  console.log('[Replit Bridge] Starting main application on port 3000...');
  
  // Set the environment variable to ensure our app uses port 3000
  const env = { ...process.env, PORT: '3000' };
  
  // Start the main application
  const app = spawn('tsx', ['server/index.ts'], {
    stdio: 'inherit',
    env,
    shell: true
  });
  
  app.on('error', (err) => {
    console.error('[Replit Bridge] Failed to start application:', err.message);
    process.exit(1);
  });
  
  app.on('exit', (code) => {
    console.log(`[Replit Bridge] Application exited with code ${code}`);
    process.exit(code);
  });
});