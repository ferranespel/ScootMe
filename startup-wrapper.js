/**
 * Startup script for Replit compatibility
 * Using a simpler approach that ensures our server binds to port 5000
 * and is detected by Replit's port checker
 */

// Simply start the server directly with modified environment settings
process.env.PORT = '5000';
require('child_process').execSync('npm run dev', { 
  stdio: 'inherit',
  env: {...process.env, PORT: '5000'}
});