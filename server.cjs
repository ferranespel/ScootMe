// CommonJS production server for ScootMe application
const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const app = express();
const PORT = process.env.PORT || 5000;

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'ScootMe-session-secret',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000 // Prune expired entries every 24h
  }),
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware);

// Serve static files from the public directory
const publicPath = path.join(__dirname, 'server', 'public');
if (!fs.existsSync(publicPath)) {
  console.error(`ERROR: Public directory not found at ${publicPath}`);
  console.error('Current directory:', __dirname);
  console.error('Files in current directory:', fs.readdirSync(__dirname));
  if (fs.existsSync(path.join(__dirname, 'server'))) {
    console.error('Files in server directory:', fs.readdirSync(path.join(__dirname, 'server')));
  }
  process.exit(1);
}

app.use(express.static(publicPath));

// Create HTTP server
const server = http.createServer(app);

// Simple API routes for authentication
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple mock authentication
  if (username && password) {
    req.session.user = { id: 1, username, fullName: 'Test User', email: 'test@example.com' };
    return res.status(200).json(req.session.user);
  }
  
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.status(200).json({ success: true });
});

app.get('/api/user', (req, res) => {
  if (req.session.user) {
    return res.status(200).json(req.session.user);
  }
  res.status(401).json({ error: 'Not authenticated' });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on port ${PORT}`);
});