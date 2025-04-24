/**
 * Simple script to open the running application in a browser tab
 * Use this if the Run button in Replit UI is not working correctly
 */

// Host and port where your application is already running
const appUrl = "https://" + process.env.REPL_SLUG + "." + process.env.REPL_OWNER + ".repl.co";

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
  const { exec } = require('child_process');
  const command = process.platform === 'win32' 
    ? `start ${appUrl}` 
    : process.platform === 'darwin' 
      ? `open ${appUrl}` 
      : `xdg-open ${appUrl}`;
  
  exec(command);
} catch (err) {
  console.log("Could not auto-open a browser tab.");
}