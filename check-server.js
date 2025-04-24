/**
 * Utility script to check if the server is running properly
 * This will help diagnose workflow issues in Replit
 */
const http = require('http');

// First check if the local server is running
function checkLocalServer() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/',
      method: 'HEAD',
      timeout: 3000,
    }, (res) => {
      console.log(`✅ Local server is running on port 5000 (status: ${res.statusCode})`);
      resolve(true);
    });

    req.on('error', () => {
      console.log('❌ Local server is not running on port 5000');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('⚠️ Request to local server timed out');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Then check if the API endpoints are responding
function checkApiEndpoints() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/user',
      method: 'HEAD',
      timeout: 3000,
    }, (res) => {
      if (res.statusCode === 401) {
        console.log('✅ API endpoint /api/user is working correctly (returns 401 when not logged in)');
        resolve(true);
      } else {
        console.log(`⚠️ API endpoint /api/user returned unexpected status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', () => {
      console.log('❌ API endpoint check failed');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('⚠️ Request to API endpoint timed out');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Check running processes on port 5000
function checkProcesses() {
  const { execSync } = require('child_process');
  try {
    const output = execSync('lsof -i :5000 -t').toString().trim();
    const pids = output.split('\n');
    
    console.log(`✅ Found ${pids.length} process(es) running on port 5000`);
    
    for (const pid of pids) {
      try {
        const processInfo = execSync(`ps -p ${pid} -o command=`).toString().trim();
        console.log(`   Process ${pid}: ${processInfo}`);
      } catch (error) {
        console.log(`   Process ${pid}: Unable to get details`);
      }
    }
    
    return pids.length > 0;
  } catch (error) {
    console.log('❌ No processes found running on port 5000');
    return false;
  }
}

// Run all checks
async function runChecks() {
  console.log('\n------ ScootMe Server Status Check ------\n');
  
  console.log('Checking for processes on port 5000:');
  const processes = checkProcesses();
  
  console.log('\nChecking if server is responding:');
  const serverRunning = await checkLocalServer();
  
  if (serverRunning) {
    console.log('\nChecking API endpoints:');
    await checkApiEndpoints();
  }
  
  console.log('\n------ Summary ------');
  
  if (serverRunning) {
    console.log('✅ The ScootMe server is running properly.');
    console.log('   You can access the application at:');
    console.log(`   https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
  } else {
    console.log('❌ The ScootMe server is not running properly.');
    
    if (processes) {
      console.log('   There are processes using port 5000, but the server is not responding.');
      console.log('   This might indicate a crashed application.');
    } else {
      console.log('   No processes are running on port 5000.');
      console.log('   Try starting the server with: node start.js');
    }
  }
  
  console.log('\n----------------------------------------');
}

runChecks();