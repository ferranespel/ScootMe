/**
 * Custom startup script that starts a server on port 5000 immediately
 * while also starting the main application.
 */
const { exec } = require('child_process');
const http = require('http');

// Create a server on port 5000 immediately, then start the main app
console.log('Starting port 5000 server immediately');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server starting...');
});

server.listen(5000, () => {
  console.log('Server running on port 5000');
  
  // Now start the main application on port 3000
  const mainProcess = exec('npm run dev');
  
  mainProcess.stdout.on('data', (data) => {
    console.log(data);
  });

  mainProcess.stderr.on('data', (data) => {
    console.error(data);
  });

  // After the main app is running, update the port 5000 server to proxy
  setTimeout(() => {
    console.log('Updating proxy server to forward requests to port 3000');
    
    // Replace the request handler to proxy to port 3000
    server.removeAllListeners('request');
    server.on('request', (req, res) => {
      try {
        const options = {
          hostname: 'localhost',
          port: 3000,
          path: req.url,
          method: req.method,
          headers: req.headers
        };

        const proxyReq = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => {
          console.error('Proxy request error:', e);
          res.writeHead(502);
          res.end('Proxy Error');
        });

        req.pipe(proxyReq);
      } catch (e) {
        console.error('Exception in proxy:', e);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });
  }, 5000);
});