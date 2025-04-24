#!/usr/bin/env node

/**
 * Automated deployment script for ScootMe
 * This script handles the entire deployment process automatically
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function execCommand(command) {
  try {
    log(`$ ${command}`, colors.yellow);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Command failed: ${command}`, colors.red);
    log(`${error.message}`, colors.red);
    return false;
  }
}

// Check if we're in a deployment environment
const isDeployment = process.env.REPL_SLUG && process.env.REPL_OWNER;

if (isDeployment) {
  log("Detected deployment environment. Running automated deployment process...", colors.green);
} else {
  log("Running in development environment.", colors.yellow);
}

function main() {
  try {
    logStep(1, "Setting up environment");
    process.env.NODE_ENV = 'production';
    process.env.PORT = 5000;
    
    // Write environment files for production
    fs.writeFileSync('.env', `NODE_ENV=production\nPORT=5000`);
    fs.writeFileSync('.env.production', `NODE_ENV=production\nPORT=5000`);
    log("Environment configured for production", colors.green);
    
    logStep(2, "Building client application");
    if (!execCommand('npm run build')) {
      throw new Error("Client build failed");
    }
    
    logStep(3, "Processing static files");
    const publicDir = path.join('server', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    execCommand(`rm -rf ${publicDir}/*`);
    execCommand(`cp -r dist/* ${publicDir}/`);
    
    // Fix the index.html file
    const indexPath = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      let content = fs.readFileSync(indexPath, 'utf8');
      
      // Add base href if not present
      if (!content.includes('<base href="/">')) {
        content = content.replace('<title>', '<base href="/">\n    <title>');
        fs.writeFileSync(indexPath, content);
        log("Added base href to index.html", colors.green);
      }
      
      // Add error handling for script loading
      if (!content.includes('onerror="handleScriptError()"')) {
        const errorScript = `<script>
      function handleScriptError() {
        console.error('Failed to load application script');
        document.getElementById('root').innerHTML = 
          '<div style="text-align:center;padding:2rem;font-family:system-ui,sans-serif">' +
            '<h2>Application Error</h2>' +
            '<p>Failed to load application resources. Please try refreshing the page.</p>' +
            '<p><button onclick="window.location.reload()" style="padding:0.5rem 1rem;cursor:pointer">Refresh</button></p>' +
          '</div>';
      }
      
      document.addEventListener('DOMContentLoaded', function() {
        const root = document.getElementById('root');
        if (root && root.children.length === 0) {
          root.innerHTML = '<div style="text-align:center;padding:2rem;font-family:system-ui,sans-serif">' +
            '<h2>Loading ScootMe...</h2>' +
            '<p>Please wait while the application initializes</p>' +
          '</div>';
          
          setTimeout(function() {
            if (document.body.innerHTML.includes('Loading ScootMe')) {
              handleScriptError();
            }
          }, 10000);
        }
      });
    </script>`;
        
        content = content.replace('</head>', `${errorScript}\n  </head>`);
        
        // Add onerror to script tag
        content = content.replace(
          /<script type="module" crossorigin src="\/assets\/index-[^"]+\.js"><\/script>/,
          (match) => match.replace('></script>', ' onerror="handleScriptError()"></script>')
        );
        
        fs.writeFileSync(indexPath, content);
        log("Added error handling to index.html", colors.green);
      }
    }
    
    logStep(4, "Starting production server");
    log("Deployment completed successfully! Starting server...", colors.green);
    
    // Use the CommonJS server for better compatibility
    require('./server.cjs');
    
  } catch (error) {
    log(`Deployment failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();