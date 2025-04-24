/**
 * Comprehensive startup script for ScootMe application
 * - Shows app information
 * - Starts development server
 * - Handles clean shutdown
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Color constants for nice terminal output
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

// Box drawing characters for better UI
const box = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
};

// Formatted logging with timestamp
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

// Attempt to free a port that's in use
async function attemptToFreePort(port) {
  log(`Port ${port} is in use, attempting to free it...`, colors.yellow);
  
  try {
    // On Unix-like systems, find and kill process using the port
    const findProcess = spawn('lsof', ['-i', `:${port}`, '-t']);
    
    findProcess.stdout.on('data', (data) => {
      const pid = data.toString().trim();
      if (pid) {
        log(`Killing process ${pid} that's using port ${port}...`, colors.yellow);
        try {
          process.kill(Number(pid), 'SIGTERM');
        } catch (err) {
          log(`Failed to kill process: ${err.message}`, colors.red);
        }
      }
    });
    
    // Wait for port to be freed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if port is now free
    const stillInUse = await isPortInUse(port);
    return !stillInUse;
  } catch (err) {
    log(`Error freeing port: ${err.message}`, colors.red);
    return false;
  }
}

// Format text with a box around it
function boxedText(title, content) {
  const lines = content.split('\n');
  const width = Math.max(...lines.map(line => line.length), title.length + 4);
  
  // Title bar
  console.log(`${colors.cyan}${box.topLeft}${box.horizontal}${colors.bright} ${title} ${colors.reset}${colors.cyan}${box.horizontal.repeat(width - title.length - 3)}${box.topRight}${colors.reset}`);
  
  // Content
  lines.forEach(line => {
    const padding = ' '.repeat(width - line.length);
    console.log(`${colors.cyan}${box.vertical}${colors.reset} ${line}${padding} ${colors.cyan}${box.vertical}${colors.reset}`);
  });
  
  // Bottom border
  console.log(`${colors.cyan}${box.bottomLeft}${box.horizontal.repeat(width)}${box.bottomRight}${colors.reset}`);
}

// Show application info
function showAppInfo() {
  console.log('\n');

  // Show app access information
  boxedText('ScootMe App Access URLs', `${colors.bright}${colors.blue}Local Development:${colors.reset}
• App URL: ${colors.green}https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.repl.co${colors.reset}
• API: ${colors.green}https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.repl.co/api${colors.reset}

${colors.bright}${colors.blue}Production:${colors.reset}
• App URL: ${colors.green}https://scoot-me-ferransson.replit.app${colors.reset}
• Custom Domain: ${colors.green}https://scootme.ferransson.com${colors.reset}

${colors.bright}${colors.yellow}Test Credentials:${colors.reset}
• Email: ferransson@gmail.com
• Phone: +354 774 12 74`);

  console.log('\n');
}

// Main function to start the application
async function main() {
  try {
    // Show application info
    showAppInfo();
    
    // Check if port 5000 is already in use
    const portInUse = await isPortInUse(5000);
    if (portInUse) {
      const freed = await attemptToFreePort(5000);
      if (!freed) {
        log('Could not free port 5000. The application might not start correctly.', colors.red);
      }
    }
    
    // Start dev server
    log(`${colors.bright}Starting ScootMe development server...${colors.reset}`, colors.magenta);
    const devProcess = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
    
    // Handle process termination
    process.on('SIGINT', () => {
      log('Shutting down...', colors.yellow);
      devProcess.kill();
      process.exit(0);
    });
    
    // Handle errors
    devProcess.on('error', (err) => {
      log(`Error starting server: ${err.message}`, colors.red);
      process.exit(1);
    });
    
    // Handle unexpected exit
    devProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        log(`Server exited with code ${code}`, colors.yellow);
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