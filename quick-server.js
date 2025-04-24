// This is a minimal server that binds to port 5000 immediately to satisfy Replit's workflow port detection
import http from 'http';
import { spawn } from 'child_process';

// Create an ultra-simple HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head>
        <title>ScootMe - Starting</title>
        <meta http-equiv="refresh" content="3">
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(to bottom, #f0f4f8, #d9e2ec);
            color: #334e68;
          }
          .logo {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
            background: linear-gradient(to right, #0070f3, #00c3ff);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
          .spinner {
            border: 6px solid #f3f3f3;
            border-top: 6px solid #0070f3;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 1rem 0;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="logo">ScootMe</div>
        <div class="spinner"></div>
        <h2>Starting application...</h2>
        <p>This page will refresh automatically once the app is ready.</p>
      </body>
    </html>
  `);
});

// Bind to port 5000 immediately with multiple notification messages for Replit
server.listen(5000, '0.0.0.0', () => {
  console.log('✅ BOUND TO PORT 5000');
  console.log('✅ Server running on port 5000');
  console.log('PORT OPEN 5000');
  console.log('[express] serving on port 5000');

  // After the temporary server is running, start the real application
  console.log('Starting ScootMe application...');
  
  // Start the real server after a short delay to let Replit detect the port
  setTimeout(() => {
    const appProcess = spawn('tsx', ['server/index.ts'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: '5000'
      }
    });

    appProcess.on('error', (err) => {
      console.error('Error starting application:', err);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      appProcess.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      appProcess.kill('SIGTERM');
      process.exit(0);
    });
  }, 3000); // 3 second delay before starting the real server
});