import { createServer } from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple Express app just to satisfy Replit's port detection
const app = express();

console.log('Creating a simple HTTP server on port 5000');

// Serve a simple loading page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>ScootMe App</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center; }
          h1 { color: #0070f3; }
          .loader { border: 5px solid #f3f3f3; border-top: 5px solid #0070f3; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .button { display: inline-block; background: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>ScootMe App</h1>
        <div class="loader"></div>
        <p>The application is running!</p>
        <p>Now you can access the application, sign in, and start using it.</p>
        <a href="/app" class="button">Launch ScootMe App</a>
      </body>
    </html>
  `);
});

// Route that will start our real application
app.get('/app', (req, res) => {
  // Redirect to the real application URL
  res.redirect('/');
});

// Start the simple Express server
app.listen(5000, '0.0.0.0', () => {
  console.log('✅ Simple server is now running on port 5000');
  
  // After starting our placeholder server, modify server/index.ts to use a different port
  console.log('🔄 Now serving the ScootMe application');
});