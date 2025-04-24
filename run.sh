#!/bin/bash

# Kill any existing server processes
pkill -f "node" || true
pkill -f "npm" || true

# Start our server in the background
echo "Starting ScootMe server..."
npm run dev &

# Wait a moment for the server to start
sleep 3

# Open the web view to port 5000
echo "Opening web preview to http://localhost:5000"
python3 -m http.server 8080 &

echo "✅ Server started successfully! Your app should be visible in the webview."
echo "If you don't see it, click the 'Open in a new tab' button in the webview."