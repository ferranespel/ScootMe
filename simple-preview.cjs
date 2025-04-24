#!/usr/bin/env node

/**
 * Simple Preview server for ScootMe application
 * This server creates a redirect page that points to the main application
 */

const http = require('http');

// Use port 8080 for this preview server
const PORT = 8080;

// Create a simple HTML page that automatically redirects to the actual application
function createRedirectHtml() {
  // Attempt to determine the Replit URL
  let appUrl = '';
  try {
    const slug = process.env.REPL_SLUG || '';
    const owner = process.env.REPL_OWNER || '';
    if (slug && owner) {
      appUrl = `https://${slug}.${owner}.repl.co`;
    } else {
      // Fallback to localhost if environment variables aren't available
      appUrl = 'http://localhost:5000';
    }
  } catch (error) {
    appUrl = 'http://localhost:5000';
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ScootMe App Preview</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      text-align: center;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #6366f1;
      margin-bottom: 20px;
    }
    .logo {
      width: 80px;
      height: 80px;
      background-color: #6366f1;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    .logo svg {
      width: 40px;
      height: 40px;
      fill: none;
      stroke: white;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .button {
      display: inline-block;
      background-color: #6366f1;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      margin: 10px 5px;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #4f46e5;
    }
    .links {
      margin-top: 30px;
    }
    .status {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      background-color: #dcfce7;
      color: #166534;
      font-weight: bold;
      margin: 20px 0;
    }
    .redirect-message {
      color: #6b7280;
      font-style: italic;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <svg viewBox="0 0 24 24">
        <path d="M3.05493 11H10L12 14H19.9451M6.5 18C6.5 19.1046 5.60457 20 4.5 20C3.39543 20 2.5 19.1046 2.5 18C2.5 16.8954 3.39543 16 4.5 16C5.60457 16 6.5 16.8954 6.5 18ZM20.5 18C20.5 19.1046 19.6046 20 18.5 20C17.3954 20 16.5 19.1046 16.5 18C16.5 16.8954 17.3954 16 18.5 16C19.6046 16 20.5 16.8954 20.5 18ZM14.5 6L16.5 9H21.5L19.5 6H14.5Z"></path>
      </svg>
    </div>
    <h1>ScootMe Application</h1>
    <p>Your ScootMe application is running successfully</p>
    <div class="status">✅ Ready to Use</div>
    
    <div class="links">
      <a href="${appUrl}" class="button" target="_blank">Open Full App</a>
      <a href="${appUrl}/auth" class="button" target="_blank">Auth Page</a>
      <a href="${appUrl}/auth-test" class="button" target="_blank">Auth Test</a>
    </div>
    
    <p class="redirect-message">
      Click any of the buttons above to access the ScootMe application
    </p>
  </div>
</body>
</html>
  `;
}

// Create the server
try {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(createRedirectHtml());
  });

  // Start the server
  server.listen(PORT, () => {
    console.log(`
--------------------------------------------------
ScootMe Preview Server started on port ${PORT}
--------------------------------------------------
This is a preview server that will help you access 
your main application on port 5000

Click any of the links in the preview to access the app
--------------------------------------------------
    `);
  });

  // Handle server errors
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Using a random port instead.`);
      server.listen(0); // Use any available port
    } else {
      console.error('Server error:', err);
    }
  });
} catch (error) {
  console.error('Failed to start preview server:', error);
}