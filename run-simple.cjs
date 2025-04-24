/**
 * Ultra-simple server starter that focuses on reliability
 */
const { spawn } = require('child_process');
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

// Log with timestamp and color
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

// Start dev server directly
log(`${colors.bright}Starting development server...${colors.reset}`, colors.magenta);
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