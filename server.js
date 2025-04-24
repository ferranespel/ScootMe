#!/usr/bin/env node

/**
 * Professional production server for the ScootMe application
 * This server automatically handles deployment preparation and runs the application
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function execCommand(command, silent = false) {
  try {
    if (!silent) log(`$ ${command}`, colors.yellow);
    return execSync(command, { stdio: silent ? 'ignore' : 'inherit' });
  } catch (error) {
    if (!silent) {
      log(`Command failed: ${command}`, colors.red);
      log(`${error.message}`, colors.red);
    }
    return null;
  }
}

// Check if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production' || 
                    process.env.REPL_SLUG && process.env.REPL_OWNER;

// Function to prepare deployment
async function prepareDeployment() {
  try {
    log("\n📦 ScootMe Professional Deployment", colors.bright + colors.cyan);
    
    // Set environment variables
    process.env.NODE_ENV = 'production';
    process.env.PORT = process.env.PORT || 5000;
    
    log("\n🔧 Checking application files...", colors.yellow);

    // Check if we need to build the client
    const distDir = path.join(__dirname, 'dist');
    const publicDir = path.join(__dirname, 'server', 'public');
    
    // Create public directory if it doesn't exist
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Check if build exists and is up to date
    const needsBuild = !fs.existsSync(distDir) || 
                      !fs.existsSync(path.join(publicDir, 'index.html')) ||
                      !fs.existsSync(path.join(publicDir, 'assets'));
    
    if (needsBuild) {
      log("🛠️ Building client application...", colors.cyan);
      const buildResult = execCommand('npm run build');
      if (!buildResult) {
        throw new Error("Failed to build client application");
      }
      
      log("📂 Copying build files to server/public...", colors.cyan);
      execCommand(`rm -rf ${publicDir}/*`);
      execCommand(`cp -r ${distDir}/* ${publicDir}/`);
    } else {
      log("✅ Client application is already built", colors.green);
    }
    
    // Fix the index.html file
    const indexPath = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      let content = fs.readFileSync(indexPath, 'utf8');
      let modified = false;
      
      // Add base href if not present
      if (!content.includes('<base href="/">')) {
        content = content.replace('<title>', '<base href="/">\n    <title>');
        modified = true;
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
        
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(indexPath, content);
        log("✅ Updated index.html with necessary fixes", colors.green);
      }
    }
    
    log("\n🚀 Starting ScootMe server...", colors.green);
    
  } catch (error) {
    log(`❌ Deployment preparation failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Only prepare deployment in production mode
if (isProduction) {
  prepareDeployment().then(() => {
    // Start the server
    require('./server.cjs');
  });
} else {
  log("🧪 Running in development mode, skipping deployment steps.", colors.yellow);
  // Start the server directly
  require('./server.cjs');
}