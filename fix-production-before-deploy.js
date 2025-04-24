#!/usr/bin/env node

/**
 * Pre-deployment production fix script
 * Run this script right before deploying to production
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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
    log(`\n${colors.dim}$ ${command}${colors.reset}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`\n${colors.red}Command failed: ${command}${colors.reset}`);
    log(`${colors.red}${error.message}${colors.reset}`);
    return false;
  }
}

// Fix the .env file to use correct port and environment
function fixEnvFile() {
  const envPath = path.join(__dirname, '.env');
  const envContent = `NODE_ENV=production
PORT=5000`;
  
  fs.writeFileSync(envPath, envContent);
  log('Updated .env file for production', colors.green);
  
  // Also update .env.production
  const envProdPath = path.join(__dirname, '.env.production');
  fs.writeFileSync(envProdPath, envContent);
  log('Updated .env.production file', colors.green);
}

// Update .replit file to ensure correct configuration
function fixReplitConfig() {
  const replitConfig = `
run = "npm run start"
hidden = [".config", "package-lock.json"]

[env]
PORT = "5000"
NODE_ENV = "production"

[nix]
channel = "stable-22_11"

[deployment]
run = ["sh", "-c", "npm run start"]
deploymentTarget = "cloudrun"
ignorePorts = false
`;

  fs.writeFileSync(path.join(__dirname, '.replit'), replitConfig);
  log('Updated .replit configuration file', colors.green);
}

// Fix the index.html file to ensure it loads correctly in production
function fixIndexHtml(indexPath) {
  if (!fs.existsSync(indexPath)) {
    log(`Index file not found at ${indexPath}`, colors.red);
    return false;
  }

  try {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Fix 1: Make sure base href is set correctly
    if (!content.includes('<base href="/">')) {
      content = content.replace('<title>', '<base href="/" />\n    <title>');
      log('Added base href to index.html', colors.yellow);
    }
    
    // Fix 2: Add error handling for main script loading
    if (!content.includes('onerror="handleScriptError()"')) {
      // Add error handling function
      const scriptTag = '<script>\n      // Script error handler to show user-friendly message\n      function handleScriptError() {\n        console.error(\'Failed to load application script\');\n        document.getElementById(\'root\').innerHTML = \n          \'<div style="text-align:center;padding:2rem;font-family:system-ui,sans-serif">\' +\n            \'<h2>Application Error</h2>\' +\n            \'<p>Failed to load application resources. Please try refreshing the page.</p>\' +\n            \'<p><button onclick="window.location.reload()" style="padding:0.5rem 1rem;cursor:pointer">Refresh</button></p>\' +\n          \'</div>\';\n      }\n      \n      // Show loading indication\n      document.addEventListener(\'DOMContentLoaded\', function() {\n        const root = document.getElementById(\'root\');\n        // Only add loading message if root is empty\n        if (root && root.children.length === 0) {\n          root.innerHTML = \'<div style="text-align:center;padding:2rem;font-family:system-ui,sans-serif">\' +\n            \'<h2>Loading ScootMe...</h2>\' +\n            \'<p>Please wait while the application initializes</p>\' +\n          \'</div>\';\n          \n          // Set a timeout to show error message if application doesn\'t load in 10 seconds\n          setTimeout(function() {\n            if (document.body.innerHTML.includes(\'Loading ScootMe\')) {\n              handleScriptError();\n            }\n          }, 10000);\n        }\n      });\n    </script>';
      
      content = content.replace('</head>', `    ${scriptTag}\n  </head>`);
      
      // Add onerror to script tag
      content = content.replace(
        /<script type="module" crossorigin src="\/assets\/index-[^"]+\.js"><\/script>/,
        (match) => {
          return match.replace('></script>', ' onerror="handleScriptError()"></script>');
        }
      );
      
      log('Added error handling to index.html', colors.yellow);
    }
    
    // Write the modified content back
    fs.writeFileSync(indexPath, content);
    log('Successfully updated index.html', colors.green);
    return true;
  } catch (error) {
    log(`Error fixing index.html: ${error.message}`, colors.red);
    return false;
  }
}

async function main() {
  try {
    logStep(1, 'Starting pre-deployment fix process');
    
    // Ensure environment is set to production
    process.env.NODE_ENV = 'production';
    
    // Create backup of server/public directory
    logStep(2, 'Creating backup of static files');
    const publicDir = path.join(__dirname, 'server', 'public');
    const backupDir = path.join(__dirname, 'server', 'public.backup');
    
    if (fs.existsSync(publicDir)) {
      if (fs.existsSync(backupDir)) {
        execCommand(`rm -rf ${backupDir}`);
      }
      execCommand(`cp -r ${publicDir} ${backupDir}`);
      log('Created backup of public directory', colors.green);
    }
    
    // Fix environment configuration
    logStep(3, 'Updating environment configuration');
    fixEnvFile();
    fixReplitConfig();
    
    // Build client for production
    logStep(4, 'Building client for production');
    if (!execCommand('npm run build')) {
      throw new Error('Client build failed');
    }
    
    // Copy built files to server/public
    logStep(5, 'Copying built files to server/public');
    if (fs.existsSync(path.join(__dirname, 'dist'))) {
      execCommand(`rm -rf ${publicDir}`);
      execCommand(`mkdir -p ${publicDir}`);
      execCommand(`cp -r ${path.join(__dirname, 'dist')}/* ${publicDir}/`);
      log('Copied build files to server/public', colors.green);
    } else {
      throw new Error('No build files found to copy');
    }
    
    // Fix the index.html file for production
    logStep(6, 'Fixing index.html for production');
    fixIndexHtml(path.join(publicDir, 'index.html'));
    
    log(`\n${colors.bright}${colors.green}✓ Pre-deployment fix completed successfully${colors.reset}`);
    log(`\nYou can now deploy your application on Replit by clicking the "Deploy" button.`);
  } catch (error) {
    log(`\n${colors.bright}${colors.red}✗ Pre-deployment fix failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();