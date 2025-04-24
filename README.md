# ScootMe - Urban Mobility Platform

A cutting-edge urban mobility platform delivering intelligent scooter rental experiences across multiple cities, focusing on user engagement and sustainable transportation.

## Current Status

The application is currently running on port 5000 and functioning properly. The Replit UI Run button may not be working, but the application is accessible via the URL.

## Accessing the Application

You can access the application at:
- Main URL: https://workspace.ferransson.repl.co
- Auth Page: https://workspace.ferransson.repl.co/auth
- Auth Test: https://workspace.ferransson.repl.co/auth-test

## Checking Server Status

To verify that the server is running properly, you can run:
```
node check-server.cjs
```

## Opening the Application

To get the application URLs and attempt to open it in a browser tab:
```
node open-app.cjs
```

## Authentication Methods

The application supports multiple authentication methods:
- Phone authentication via Twilio SMS with "ScootMe" sender ID
- Google authentication via direct OAuth integration
- Firebase authentication with localStorage persistence

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Express.js, Node.js
- **Database:** In-memory storage (resets on server restart)
- **Authentication:** Passport.js, Firebase, Twilio
- **Maps:** Google Maps API
- **Real-time Communication:** WebSockets
- **Payment Processing:** Stripe

## Geographic Focus

The application focuses on the Greater Reykjavik area in Iceland, with special emphasis on the Kársnes area.

## Fleet Information

The platform manages 275 scooters:
- 250 general scooters
- 25 Kársnes-specific scooters with K-prefixed IDs

## Internationalization

The application supports multiple languages:
- English
- Spanish
- Icelandic

## Deployment

The application can be deployed to:
- Replit domains (currently at scoot-me-ferransson.replit.app)
- Custom domains (currently at scootme.ferransson.com)

## Running Locally

If the Replit workflow is not working, you can manually start the server:
```
./start-server.sh
```