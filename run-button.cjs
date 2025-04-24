/**
 * Improved Run button handler for ScootMe application
 */
const http = require('http');
const { spawn, exec } = require('child_process');
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m'
};

// Log with timestamp and color
function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

// Check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

// Show app access information
function showAppInfo() {
  console.log('\n');
  console.log(`${colors.cyan}╭───────────────────────────────────────────────────╮${colors.reset}`);
  console.log(`${colors.cyan}│${colors.reset} ${colors.bright}ScootMe Application${colors.reset}                             ${colors.cyan}│${colors.reset}`);
  console.log(`${colors.cyan}│${colors.reset} ${colors.yellow}Starting up...${colors.reset}                                 ${colors.cyan}│${colors.reset}`);
  console.log(`${colors.cyan}│${colors.reset} Main port: ${colors.bright}5000${colors.reset}                                 ${colors.cyan}│${colors.reset}`);
  console.log(`${colors.cyan}╰───────────────────────────────────────────────────╯${colors.reset}`);
  console.log('\n');
}

// Attempt to free a port that's in use
async function attemptToFreePort(port) {
  log(`Port ${port} is in use, attempting to free it...`, colors.yellow);
  
  return new Promise((resolve) => {
    exec(`lsof -i :${port} -t`, (error, stdout) => {
      if (error) {
        log(`Error finding process on port ${port}: ${error.message}`, colors.red);
        resolve(false);
        return;
      }
      
      const pid = stdout.trim();
      if (pid) {
        log(`Killing process ${pid} that's using port ${port}...`, colors.yellow);
        exec(`kill -9 ${pid}`, (killError) => {
          if (killError) {
            log(`Failed to kill process: ${killError.message}`, colors.red);
            resolve(false);
            return;
          }
          
          log(`Successfully freed port ${port}`, colors.green);
          resolve(true);
        });
      } else {
        log(`No process found using port ${port}`, colors.yellow);
        resolve(true);
      }
    });
  });
}

// Create a simple HTML file for redirection
const html = `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=http://localhost:5000">
  <title>Redirecting to ScootMe...</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
      color: #333;
    }
    .container {
      text-align: center;
      padding: 2rem;
      border-radius: 8px;
      background-color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 500px;
    }
    h1 {
      margin-top: 0;
      color: #0070f3;
    }
    .loader {
      display: inline-block;
      width: 50px;
      height: 50px;
      border: 5px solid rgba(0, 112, 243, 0.2);
      border-radius: 50%;
      border-top-color: #0070f3;
      margin: 1rem 0;
      animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .info {
      font-size: 0.9rem;
      color: #666;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>ScootMe</h1>
    <div class="loader"></div>
    <p>Redirecting to application...</p>
    <p class="info">If you're not redirected automatically, <a href="http://localhost:5000">click here</a>.</p>
  </div>
</body>
</html>
`;

// Start a redirecting server
function startRedirectServer() {
  // Create a server on port 8080 to serve the redirect
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });

  server.listen(8080, () => {
    log('Redirect server running on port 8080', colors.green);
  });
  
  return server;
}

// Main function
async function main() {
  try {
    // Show initialization banner
    showAppInfo();
    
    // Start redirect server
    const redirectServer = startRedirectServer();
    
    // Check if port 5000 is in use
    const port5000InUse = await isPortInUse(5000);
    if (port5000InUse) {
      await attemptToFreePort(5000);
      // Wait a bit for the port to be freed
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Start the main server using npm run dev
    log('Starting main application server...', colors.magenta);
    const appProcess = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
    
    // Handle process termination
    process.on('SIGINT', () => {
      log('Shutting down...', colors.yellow);
      redirectServer.close();
      appProcess.kill();
      process.exit(0);
    });
    
    // Handle app process errors
    appProcess.on('error', (err) => {
      log(`Error starting application: ${err.message}`, colors.red);
      redirectServer.close();
      process.exit(1);
    });
    
    // Handle unexpected exit
    appProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        log(`Application exited with code ${code}`, colors.yellow);
        redirectServer.close();
        process.exit(code);
      }
    });
  } catch (err) {
    log(`Error: ${err.message}`, colors.red);
    process.exit(1);
  }
}

// Run the main function
main();