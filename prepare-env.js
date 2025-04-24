#!/usr/bin/env node

/**
 * Environment variable preparation script
 * This ensures that environment variables are set up correctly for both development and production
 */

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

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const line_trimmed = line.trim();
    if (!line_trimmed || line_trimmed.startsWith('#')) {
      return;
    }
    
    const match = line_trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
  });
  
  return env;
}

function writeEnvFile(filePath, env) {
  const content = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(filePath, content + '\n');
}

function main() {
  try {
    log(`${colors.bright}${colors.cyan}Checking environment variables${colors.reset}`);
    
    // Read existing .env file
    const envPath = path.join(__dirname, '.env');
    const env = readEnvFile(envPath);
    
    // Check for required variables
    const requiredVars = [
      'PORT',
      'GOOGLE_CLIENT_ID', 
      'GOOGLE_CLIENT_SECRET',
      'FIREBASE_API_KEY',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_APP_ID',
      'FIREBASE_AUTH_DOMAIN',
      'SESSION_SECRET'
    ];
    
    const missingVars = requiredVars.filter(varName => !env[varName] && !process.env[varName]);
    
    if (missingVars.length > 0) {
      log(`${colors.yellow}Missing required environment variables:${colors.reset}`);
      missingVars.forEach(varName => {
        log(`  - ${varName}`, colors.yellow);
      });
      
      log(`\n${colors.yellow}These variables should be set in your .env file or in the Replit Secrets.${colors.reset}`);
    } else {
      log(`${colors.green}All required environment variables are set.${colors.reset}`);
    }
    
    // Create .env.production
    const productionEnvPath = path.join(__dirname, '.env.production');
    const productionEnv = { ...env };
    
    // Ensure PORT and NODE_ENV are set
    productionEnv.PORT = productionEnv.PORT || '3000';
    productionEnv.NODE_ENV = 'production';
    
    // Add client-side variables with VITE_ prefix
    if (env.FIREBASE_API_KEY) productionEnv.VITE_FIREBASE_API_KEY = env.FIREBASE_API_KEY;
    if (env.FIREBASE_PROJECT_ID) productionEnv.VITE_FIREBASE_PROJECT_ID = env.FIREBASE_PROJECT_ID;
    if (env.FIREBASE_APP_ID) productionEnv.VITE_FIREBASE_APP_ID = env.FIREBASE_APP_ID;
    if (env.FIREBASE_AUTH_DOMAIN) productionEnv.VITE_FIREBASE_AUTH_DOMAIN = env.FIREBASE_AUTH_DOMAIN;
    if (env.GOOGLE_MAPS_API_KEY) productionEnv.VITE_GOOGLE_MAPS_API_KEY = env.GOOGLE_MAPS_API_KEY;
    
    writeEnvFile(productionEnvPath, productionEnv);
    log(`${colors.green}Created production environment file: ${productionEnvPath}${colors.reset}`);
    
    return true;
  } catch (error) {
    log(`${colors.red}Error processing environment variables: ${error.message}${colors.reset}`);
    return false;
  }
}

main();