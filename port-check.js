// Check what ports are currently in use
import { exec } from 'child_process';

exec('netstat -tlnp 2>/dev/null | grep LISTEN', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running netstat: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr from netstat: ${stderr}`);
    return;
  }
  
  console.log('Currently open ports:');
  console.log(stdout);
});

// Check for the specific ports we're interested in
const portsToCheck = [3000, 5000];

portsToCheck.forEach(port => {
  exec(`lsof -i:${port} 2>/dev/null`, (error, stdout, stderr) => {
    if (error) {
      // Port is not in use (lsof returns non-zero when no processes found)
      console.log(`Port ${port} is available`);
      return;
    }
    console.log(`Port ${port} is in use by:`);
    console.log(stdout);
  });
});