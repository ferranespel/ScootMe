// Script to check and free up port 5000 before starting the main application
import { exec } from 'child_process';

// Check if port 5000 is in use
console.log('Checking if port 5000 is in use...');
exec('lsof -i:5000 -t', (error, stdout, stderr) => {
  if (!error) {
    // Port 5000 is in use, attempt to kill the process
    const pid = stdout.trim();
    console.log(`Port 5000 is in use by process ${pid}, attempting to kill it...`);
    
    exec(`kill ${pid}`, (killError) => {
      if (killError) {
        console.error(`Failed to kill process ${pid}:`, killError);
      } else {
        console.log(`Successfully killed process ${pid}, port 5000 should now be free`);
      }
      
      // Now, we can start our application on port 3000
      startApp();
    });
  } else {
    // Port 5000 is not in use
    console.log('Port 5000 is not in use, starting application...');
    startApp();
  }
});

function startApp() {
  console.log('Starting application on port 3000...');
  // Execute the npm run dev command
  const child = exec('npm run dev');
  
  // Forward stdout and stderr to the console
  child.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
  
  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  
  child.on('error', (error) => {
    console.error('Failed to start application:', error);
  });
  
  child.on('exit', (code) => {
    console.log(`Application exited with code ${code}`);
  });
}