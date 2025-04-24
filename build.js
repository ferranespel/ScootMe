#!/usr/bin/env node

/**
 * Production build script for Replit deployment
 * This script handles both client and server builds and ensures proper file placement
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

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    log(`Source directory doesn't exist: ${source}`, colors.red);
    return false;
  }

  ensureDirectoryExists(destination);
  
  const files = fs.readdirSync(source);
  for (const file of files) {
    const sourceFile = path.join(source, file);
    const destFile = path.join(destination, file);
    
    const stats = fs.statSync(sourceFile);
    if (stats.isDirectory()) {
      copyDirectory(sourceFile, destFile);
    } else {
      fs.copyFileSync(sourceFile, destFile);
    }
  }
  
  log(`Copied directory: ${source} → ${destination}`, colors.green);
  return true;
}

async function main() {
  try {
    logStep(1, 'Setting up build environment');
    
    // Create necessary directories
    ensureDirectoryExists(path.join(__dirname, 'dist'));
    ensureDirectoryExists(path.join(__dirname, 'dist', 'public'));
    
    // Client build
    logStep(2, 'Building client-side assets');
    if (!execCommand('vite build --outDir dist/public')) {
      throw new Error('Client build failed');
    }
    
    // Copy public directory to server/public
    logStep(3, 'Setting up server directory structure');
    ensureDirectoryExists(path.join(__dirname, 'server', 'public'));
    
    // Copy client build to server/public
    if (!copyDirectory(
      path.join(__dirname, 'dist', 'public'),
      path.join(__dirname, 'server', 'public')
    )) {
      throw new Error('Failed to copy client build to server/public');
    }
    
    // Build server
    logStep(4, 'Building server-side code');
    if (!execCommand('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist')) {
      throw new Error('Server build failed');
    }
    
    // Copy environment variables
    logStep(5, 'Setting up environment variables');
    if (fs.existsSync(path.join(__dirname, '.env'))) {
      fs.copyFileSync(
        path.join(__dirname, '.env'),
        path.join(__dirname, 'dist', '.env')
      );
      log('Copied .env file to dist directory', colors.green);
    }
    
    log(`\n${colors.bright}${colors.green}✓ Build completed successfully${colors.reset}`);
    log(`\nTo start the production server, run: ${colors.bright}node dist/index.js${colors.reset}`);
  } catch (error) {
    log(`\n${colors.bright}${colors.red}✗ Build failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();