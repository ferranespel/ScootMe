// Simple production server for ScootMe application
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');

const app = express();
const PORT = process.env.PORT || 5000;

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the public directory
const publicPath = path.join(__dirname, 'server', 'public');
if (!fs.existsSync(publicPath)) {
  console.error(`ERROR: Public directory not found at ${publicPath}`);
  process.exit(1);
}

app.use(express.static(publicPath));

// Create HTTP server
const server = createServer(app);

// Import and register API routes
try {
  // Import the routes dynamically
  const { registerRoutes } = require('./server/routes');
  
  // Register the routes with the app and server
  registerRoutes(app, server)
    .then(() => {
      console.log('API routes registered successfully');
    })
    .catch(err => {
      console.error('Failed to register API routes:', err);
    });
} catch (error) {
  console.error('Error loading routes:', error);
}

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on port ${PORT}`);
});