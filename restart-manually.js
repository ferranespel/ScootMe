#!/usr/bin/env node
/**
 * Custom script to manually restart the server with proper port binding
 */
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔄 Manually restarting the server...');

try {
  // Kill any existing Node processes
  try {
    console.log('🧹 Cleaning up existing processes...');
    execSync('pkill -f "tsx server/index.ts" || true');
    execSync('pkill -f "node" || true');
    console.log('✅ Process cleanup done');
  } catch (error) {
    console.log('⚠️ Could not clean up processes, continuing anyway');
  }
  
  // Wait a moment for ports to free up
  console.log('⏳ Waiting for ports to free up...');
  setTimeout(() => {
    console.log('🚀 Starting server...');
    
    // Create a temporary .env file to explicitly set the port
    fs.writeFileSync('.env.temp', 'PORT=5000\n');
    
    // Start the server
    try {
      execSync('NODE_ENV=production PORT=5000 npm run dev', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          PORT: '5000',
          NODE_ENV: 'production'
        }
      });
    } catch (error) {
      console.error('❌ Failed to start the server:', error);
    }
  }, 1000);
} catch (error) {
  console.error('❌ Script failed:', error);
}