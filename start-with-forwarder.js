// Start application and port forwarder in parallel
import { exec, spawn } from 'child_process';

console.log('Checking if port 5000 is in use...');
exec('lsof -i:5000 -t', (error, stdout) => {
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
      
      startApplication();
    });
  } else {
    // Port 5000 is not in use
    console.log('Port 5000 is not in use, starting application...');
    startApplication();
  }
});

function startApplication() {
  // Start the main application
  console.log('Starting main application on port 3000...');
  const app = spawn('npm', ['run', 'dev'], { 
    stdio: ['ignore', process.stdout, process.stderr],
    shell: true 
  });
  
  app.on('error', (error) => {
    console.error('Failed to start application:', error);
  });
  
  // Wait a second for the app to start initializing
  setTimeout(() => {
    // Start the port forwarder
    console.log('Starting port forwarder (5000 -> 3000)...');
    const forwarder = spawn('node', ['port-forwarder.js'], {
      stdio: ['ignore', process.stdout, process.stderr],
      shell: true
    });
    
    forwarder.on('error', (error) => {
      console.error('Failed to start port forwarder:', error);
    });
  }, 1000);
}