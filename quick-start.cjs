#!/usr/bin/env node

/**
 * Ultra-simple app starter with zero complexity
 */
const { exec } = require('child_process');

console.log('\n\n🛴 Starting ScootMe application...\n');

// Start the application server with npm run dev
exec('npm run dev', { stdio: 'inherit' }, (error) => {
  if (error) {
    console.error(`\n❌ Error starting server: ${error.message}`);
  }
});