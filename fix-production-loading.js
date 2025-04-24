#!/usr/bin/env node

/**
 * Fix for production loading screen issue
 * This script ensures the correct static files are being served and correctly formatted
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

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, colors.green);
  }
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
      content = content.replace('</head>', '  <base href="/">\n  </head>');
      log('Added base href to index.html', colors.yellow);
    }
    
    // Fix 2: Add error handling for main script loading
    if (!content.includes('onerror="handleScriptError()"')) {
      // Add error handling for the main script
      content = content.replace(
        /<script type="module" crossorigin src="\/assets\/index-[^"]+\.js"><\/script>/,
        (match) => {
          return match.replace('></script>', ' onerror="handleScriptError()"></script>');
        }
      );
      
      // Add the error handler function
      content = content.replace('</head>', `  <script>
    function handleScriptError() {
      console.error('Failed to load application script');
      document.getElementById('root').innerHTML = 
        '<div style="text-align:center;padding:2rem;font-family:system-ui,sans-serif">' +
          '<h2>Application Error</h2>' +
          '<p>Failed to load application resources. Please try refreshing the page.</p>' +
          '<p><button onclick="window.location.reload()" style="padding:0.5rem 1rem;cursor:pointer">Refresh</button></p>' +
        '</div>';
    }
    
    // Show loading indication
    document.addEventListener('DOMContentLoaded', function() {
      const root = document.getElementById('root');
      // Only add loading message if root is empty
      if (root && root.children.length === 0) {
        root.innerHTML = '<div style="text-align:center;padding:2rem;font-family:system-ui,sans-serif">' +
          '<h2>Loading ScootMe...</h2>' +
          '<p>Please wait while the application initializes</p>' +
        '</div>';
        
        // Set a timeout to show error message if application doesn't load in 10 seconds
        setTimeout(function() {
          if (document.body.innerHTML.includes('Loading ScootMe')) {
            handleScriptError();
          }
        }, 10000);
      }
    });
  </script>
  </head>`);
      
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
    logStep(1, 'Starting production loading fix process');
    
    // Ensure environment is set to production
    process.env.NODE_ENV = 'production';
    
    // Clean the server/public directory
    logStep(2, 'Cleaning static files directory');
    const publicDir = path.join(__dirname, 'server', 'public');
    if (fs.existsSync(publicDir)) {
      // Keep a backup of the directory
      const backupDir = path.join(__dirname, 'server', 'public.backup');
      if (fs.existsSync(backupDir)) {
        execCommand(`rm -rf ${backupDir}`);
      }
      execCommand(`mv ${publicDir} ${backupDir}`);
      log('Backed up existing public directory', colors.yellow);
    }
    
    // Create a fresh server/public directory
    ensureDirectoryExists(publicDir);
    
    // Force build the client
    logStep(3, 'Building client-side code');
    if (!execCommand('npm run build')) {
      throw new Error('Client build failed');
    }
    
    // Copy the built files to server/public
    logStep(4, 'Copying static files to server/public');
    const distDir = path.join(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      execCommand(`cp -r ${distDir}/* ${publicDir}/`);
      log('Copied build files to server/public', colors.green);
    } else {
      throw new Error('No build files found to copy');
    }
    
    // Fix the index.html file
    logStep(5, 'Fixing index.html for production');
    const indexPath = path.join(publicDir, 'index.html');
    fixIndexHtml(indexPath);
    
    // Update .env to ensure production mode
    logStep(6, 'Updating environment configuration');
    const envPath = path.join(__dirname, '.env');
    const envContent = `NODE_ENV=production
PORT=5000`;
    fs.writeFileSync(envPath, envContent);
    log('Updated .env file for production', colors.green);
    
    // Update .env.production file
    const envProdPath = path.join(__dirname, '.env.production');
    fs.writeFileSync(envProdPath, envContent);
    log('Updated .env.production file', colors.green);
    
    log(`\n${colors.bright}${colors.green}✓ Production loading fix completed successfully${colors.reset}`);
    log(`\nRun 'node fix-production-loading.js' before deploying to ensure the application loads correctly in production.`);
  } catch (error) {
    log(`\n${colors.bright}${colors.red}✗ Production loading fix failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();