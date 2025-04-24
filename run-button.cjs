// The most basic possible server to redirect to our main app
const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

// Start our main application if it's not already running
exec('pgrep -f "tsx server/index.ts" || npm run dev &', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error starting main server: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Error output: ${stderr}`);
    return;
  }
  
  console.log('Main server started or was already running');
});

// Create a simple HTML file for redirection
const html = `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=http://localhost:5000">
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to application...</p>
</body>
</html>
`;

// Create a server on port 8080 to serve the redirect
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

// Start the server
server.listen(8080, () => {
  console.log('Redirect server running on port 8080');
});