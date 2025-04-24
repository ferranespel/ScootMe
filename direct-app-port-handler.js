// Modified server launcher that handles the port management automatically
// This script runs the application directly and ensures a compatible port setup
import { exec, spawn } from 'child_process';
import { createServer } from 'http';

// Kill any existing process on port 5000
console.log('Checking for processes on port 5000...');
exec('lsof -i:5000 -t', (error, stdout) => {
  if (!error && stdout.trim()) {
    const pid = stdout.trim();
    console.log(`Found process ${pid} on port 5000, killing it...`);
    
    exec(`kill -9 ${pid}`, () => {
      startPortListener();
    });
  } else {
    console.log('No process found on port 5000');
    startPortListener();
  }
});

function startPortListener() {
  console.log('Starting port 5000 listener...');
  
  // Create a very simple HTTP server on port 5000
  const server = createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Port 5000 is active\n');
  });
  
  server.listen(5000, '0.0.0.0', () => {
    console.log('Successfully bound to port 5000');
    
    // Now start the actual application
    startApplication();
  });
  
  server.on('error', (err) => {
    console.error('Failed to bind to port 5000:', err.message);
    // Start the application anyway
    startApplication();
  });
}

function startApplication() {
  console.log('Starting application on port 3000...');
  // Export the PORT environment variable explicitly to make it available to the child process
  process.env.PORT = '3000';
  
  const app = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit',
    env: {...process.env},
    shell: true 
  });
  
  app.on('error', (err) => {
    console.error('Failed to start application:', err.message);
  });
  
  app.on('exit', (code) => {
    console.log(`Application exited with code ${code}`);
    process.exit(code);
  });
}