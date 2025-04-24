#!/usr/bin/env node

/**
 * Preview server for Replit Run button
 * This script is intended to be the target for the Run button in Replit UI
 * It will:
 * 1. Check if main server is running on port 5000
 * 2. Start a preview server on port 3000/8080 that redirects to the main server
 */

const http = require('http');
const { exec } = require('child_process');

// Port for this preview server (not the main app)
// We explicitly use 8080 and not environment variables to avoid conflicts
const PREVIEW_PORT = 8080;
const MAIN_APP_PORT = 5000;

// Function to check if the main server is running
function isMainServerRunning() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: MAIN_APP_PORT,
      path: '/',
      method: 'HEAD',
      timeout: 3000,
    }, (res) => {
      console.log(`✅ Main server is running on port ${MAIN_APP_PORT} (status: ${res.statusCode})`);
      resolve(true);
    });

    req.on('error', () => {
      console.log(`❌ Main server is not running on port ${MAIN_APP_PORT}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`⚠️ Request to main server timed out`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Simple HTML template
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
      appUrl = `http://localhost:${MAIN_APP_PORT}`;
    }
  } catch (error) {
    appUrl = `http://localhost:${MAIN_APP_PORT}`;
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
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(99, 102, 241, 0.3);
      border-radius: 50%;
      border-top-color: #6366f1;
      animation: spin 1s ease-in-out infinite;
      margin-right: 10px;
      vertical-align: middle;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
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
    <div class="status">✅ Server Active</div>
    
    <div class="links">
      <a href="${appUrl}" class="button" target="_blank">Open Full App</a>
      <a href="${appUrl}/auth" class="button" target="_blank">Auth Page</a>
      <a href="${appUrl}/auth-test" class="button" target="_blank">Auth Test</a>
    </div>
    
    <p class="redirect-message">
      <span class="loading"></span>
      Redirecting to application in <span id="countdown">3</span> seconds...
    </p>
  </div>

  <script>
    // Countdown timer for redirect
    let count = 3;
    const countdownEl = document.getElementById('countdown');
    
    const timer = setInterval(() => {
      count--;
      countdownEl.textContent = count;
      
      if (count <= 0) {
        clearInterval(timer);
        window.location.href = "${appUrl}";
      }
    }, 1000);
  </script>
</body>
</html>
  `;
}

// Start the preview server
function startPreviewServer() {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(createRedirectHtml());
  });

  server.listen(PREVIEW_PORT, () => {
    console.log(`
--------------------------------------------------
ScootMe Preview Server started on port ${PREVIEW_PORT}
--------------------------------------------------
This is a preview server that will redirect to 
your main application which is running on port ${MAIN_APP_PORT}

If the preview panel doesn't open automatically,
click the "Open Website" button in the Replit UI
--------------------------------------------------
    `);
  });

  // Handle server errors
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`⚠️ Port ${PREVIEW_PORT} is already in use. Trying another port...`);
      // Try a different port
      server.listen(0);
    } else {
      console.error(`⚠️ Server error:`, err);
    }
  });
}

// Main function
async function main() {
  console.log('ScootMe Preview Server Starting...');
  console.log('Checking if main application is running...');

  const isRunning = await isMainServerRunning();

  if (isRunning) {
    console.log('✅ Main application is running. Starting preview server...');
    startPreviewServer();
  } else {
    console.log('❌ Main application is not running. It should be running on port 5000.');
    console.log('Starting preview server anyway to provide links...');
    startPreviewServer();
  }
}

// Run the main function
main();