#!/bin/bash

# First start the port opener (must be in background)
node port-opener.js &

# Set environment variables before starting the server
export PORT=3000
export NODE_ENV=production

# Now start the actual application
npm run dev