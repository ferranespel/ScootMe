#!/bin/bash

# Start the port 5000 listener first (in background)
node port-listener.cjs &

# Then start the main app on port 3000
npm run dev