#!/usr/bin/env node

/**
 * Deployment preparation script for Replit
 * This script sets up the necessary files and configurations for successful deployment
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

// Function to create .replit configuration file for deployment
function createReplitConfig() {
  const replitConfig = `
run = "npm run start"
hidden = [".config", "package-lock.json"]

[env]
PORT = "3000"
NODE_ENV = "production"

[nix]
channel = "stable-22_11"

[deployment]
run = ["sh", "-c", "npm run start"]
deploymentTarget = "cloudrun"
ignorePorts = false
`;

  fs.writeFileSync(path.join(__dirname, '.replit'), replitConfig);
  log('Created .replit configuration file', colors.green);
}

// Function to create replit.nix file for deployment
function createReplitNix() {
  // Only create if doesn't exist
  if (fs.existsSync(path.join(__dirname, 'replit.nix'))) {
    log('replit.nix file already exists, skipping', colors.yellow);
    return;
  }
  
  const replitNix = `
{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
  ];
}
`;

  fs.writeFileSync(path.join(__dirname, 'replit.nix'), replitNix);
  log('Created replit.nix file', colors.green);
}

async function main() {
  try {
    logStep(1, 'Setting up deployment configuration');
    
    // Create .replit configuration
    createReplitConfig();
    
    // Create replit.nix if needed
    createReplitNix();
    
    // Create server/public directory
    logStep(2, 'Setting up necessary directories');
    ensureDirectoryExists(path.join(__dirname, 'server', 'public'));
    
    // Create a simple index.html file in server/public as a fallback
    fs.writeFileSync(
      path.join(__dirname, 'server', 'public', 'index.html'),
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ScootMe App</title>
  <script>
    // Redirect to the dev server in development mode
    if (window.location.hostname.includes('replit.dev')) {
      window.location.href = window.location.origin;
    }
  </script>
</head>
<body>
  <div id="root">
    <!-- This is a placeholder. In production, this file will be replaced by the built version -->
    <div style="font-family: system-ui, sans-serif; text-align: center; padding: 2rem;">
      <h1>ScootMe Application</h1>
      <p>If you're seeing this page, it means the production build hasn't been generated yet.</p>
    </div>
  </div>
</body>
</html>`
    );
    log('Created placeholder index.html in server/public', colors.green);
    
    log(`\n${colors.bright}${colors.green}✓ Deployment preparation completed successfully${colors.reset}`);
    log(`\nYou can now deploy your application on Replit by clicking the "Deploy" button.`);
  } catch (error) {
    log(`\n${colors.bright}${colors.red}✗ Deployment preparation failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();