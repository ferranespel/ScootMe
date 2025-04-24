/**
 * Simple script to open the running application in a browser tab
 * Use this if the Run button in Replit UI is not working correctly
 */
const { exec } = require('child_process');

// Try to determine the Replit URL
let appUrl = '';
try {
  const slug = process.env.REPL_SLUG || '';
  const owner = process.env.REPL_OWNER || '';
  if (slug && owner) {
    appUrl = `https://${slug}.${owner}.repl.co`;
  } else {
    // Fallback to localhost if environment variables aren't available
    appUrl = 'http://localhost:5000';
  }
} catch (error) {
  appUrl = 'http://localhost:5000';
}

console.log(`
---------------------------------------------
Your ScootMe application is already running!

You can access it at:
${appUrl}

For development testing, you can use these URLs:
- Auth Page: ${appUrl}/auth
- Auth Test: ${appUrl}/auth-test
- Home Page: ${appUrl}/

The app might take a moment to fully load.
---------------------------------------------
`);

// In some environments, this will automatically open the URL in a browser tab
try {
  const command = process.platform === 'win32' 
    ? `start ${appUrl}` 
    : process.platform === 'darwin' 
      ? `open ${appUrl}` 
      : `xdg-open ${appUrl}`;
  
  exec(command, (error) => {
    if (error) {
      console.log("Could not auto-open a browser tab.");
    }
  });
} catch (err) {
  console.log("Could not auto-open a browser tab.");
}