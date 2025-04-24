/**
 * Smart runner for ScootMe application
 * Detects environment and runs either production or development mode
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m'
};

// Log with timestamp and color
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

// Is this a production environment?
function isProduction() {
  return process.env.NODE_ENV === 'production';
}

// Show app access information
function showAppInfo() {
  console.log('\n');
  console.log(`${colors.cyan}╭───────────────────────────────────────────────────╮${colors.reset}`);
  console.log(`${colors.cyan}│${colors.reset} ${colors.bright}ScootMe Application${colors.reset}                             ${colors.cyan}│${colors.reset}`);
  console.log(`${colors.cyan}│${colors.reset} Mode: ${isProduction() ? colors.green + 'Production' : colors.yellow + 'Development'}${colors.reset}                               ${colors.cyan}│${colors.reset}`);
  console.log(`${colors.cyan}│${colors.reset} Port: ${colors.bright}5000${colors.reset}                                      ${colors.cyan}│${colors.reset}`);
  console.log(`${colors.cyan}│${colors.reset} URL:  ${colors.green}https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.repl.co${colors.reset} ${colors.cyan}│${colors.reset}`);
  console.log(`${colors.cyan}╰───────────────────────────────────────────────────╯${colors.reset}`);
  console.log('\n');
}

// Main function
async function main() {
  // Show app info
  showAppInfo();
  
  let childProcess;
  
  if (isProduction()) {
    // Check if the production build exists
    if (fs.existsSync(path.join(__dirname, 'dist', 'index.js'))) {
      log('Starting application in production mode...', colors.green);
      childProcess = spawn('node', ['dist/index.js'], { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });
    } else {
      log('Production build not found. Running in development mode...', colors.yellow);
      childProcess = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
    }
  } else {
    // Development mode
    log('Starting application in development mode...', colors.yellow);
    childProcess = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
  }
  
  // Handle process termination
  process.on('SIGINT', () => {
    log('Shutting down...', colors.yellow);
    childProcess.kill();
    process.exit(0);
  });
  
  // Handle errors
  childProcess.on('error', (err) => {
    log(`Error starting server: ${err.message}`, colors.red);
    process.exit(1);
  });
  
  // Handle unexpected exit
  childProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log(`Server exited with code ${code}`, colors.yellow);
      process.exit(code);
    }
  });
}

// Run the main function
main();