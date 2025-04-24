#!/usr/bin/env node

/**
 * Deployment fix script for Replit
 * This script ensures the correct static files are used for deployment
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

async function main() {
  try {
    logStep(1, 'Starting deployment fix process');
    
    // Ensure environment variables for production
    process.env.NODE_ENV = 'production';
    
    // Ensure server/public directory exists
    ensureDirectoryExists(path.join(__dirname, 'server', 'public'));
    
    // Update .replit file to use port 5000 instead of 3000
    logStep(2, 'Updating .replit configuration');
    const replitPath = path.join(__dirname, '.replit');
    if (fs.existsSync(replitPath)) {
      let replitContent = fs.readFileSync(replitPath, 'utf8');
      replitContent = replitContent.replace(/PORT = "3000"/g, 'PORT = "5000"');
      
      fs.writeFileSync(replitPath, replitContent);
      log('Updated .replit file to use port 5000', colors.green);
    }
    
    // Build client for production
    logStep(3, 'Building client-side code');
    if (!execCommand('npm run build')) {
      throw new Error('Client build failed');
    }
    
    // Copy built files to server/public
    logStep(4, 'Copying static files to server/public');
    if (fs.existsSync(path.join(__dirname, 'dist', 'public'))) {
      // Copy from dist/public to server/public
      execCommand('cp -r dist/public/* server/public/');
      log('Copied build files from dist/public to server/public', colors.green);
    } else if (fs.existsSync(path.join(__dirname, 'dist'))) {
      // Copy from dist to server/public
      execCommand('cp -r dist/* server/public/');
      log('Copied build files from dist to server/public', colors.green);
    } else {
      throw new Error('No build files found to copy');
    }
    
    // Ensure we're not using placeholder files
    logStep(5, 'Checking for placeholder files');
    const publicIndexPath = path.join(__dirname, 'server', 'public', 'index.html');
    if (fs.existsSync(publicIndexPath)) {
      const indexContent = fs.readFileSync(publicIndexPath, 'utf8');
      
      if (indexContent.includes('production build hasn\'t been generated yet')) {
        log('Detected placeholder index.html, replacing with built version', colors.yellow);
        
        // Check if there's a nested public directory with the real index.html
        const nestedPublicIndexPath = path.join(__dirname, 'server', 'public', 'public', 'index.html');
        if (fs.existsSync(nestedPublicIndexPath)) {
          // Copy the nested index.html to the parent directory
          execCommand(`cp ${nestedPublicIndexPath} ${publicIndexPath}`);
          
          // Copy any assets/resources from nested directory to parent
          const nestedAssetsPath = path.join(__dirname, 'server', 'public', 'public', 'assets');
          if (fs.existsSync(nestedAssetsPath)) {
            execCommand(`cp -r ${nestedAssetsPath} ${path.join(__dirname, 'server', 'public')}`);
          }
          
          // Clean up the nested directory
          execCommand(`rm -rf ${path.join(__dirname, 'server', 'public', 'public')}`);
          
          log('Successfully replaced placeholder with built version', colors.green);
        } else {
          throw new Error('Could not find built index.html to replace placeholder');
        }
      }
    }
    
    log(`\n${colors.bright}${colors.green}✓ Deployment fix completed successfully${colors.reset}`);
    log(`\nYou can now deploy your application on Replit by clicking the "Deploy" button.`);
  } catch (error) {
    log(`\n${colors.bright}${colors.red}✗ Deployment fix failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();