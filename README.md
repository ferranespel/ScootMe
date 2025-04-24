# ScootMe - Urban Mobility Platform

A cutting-edge urban mobility platform delivering intelligent scooter rental experiences across multiple cities, focusing on user engagement and sustainable transportation.

## Quick Start

To start the application, run one of these commands in your terminal:

```bash
# Option 1: Start with standard development server
npm run dev

# Option 2: Start with enhanced logging and auto port management
node start-app.cjs
```

## Available URLs

- **Local Development**: [https://workspace--ferransson.repl.co](https://workspace--ferransson.repl.co)
- **Production**: [https://scoot-me-ferransson.replit.app](https://scoot-me-ferransson.replit.app)
- **Custom Domain**: [https://scootme.ferransson.com](https://scootme.ferransson.com)

## Test Credentials

- **Email**: ferransson@gmail.com
- **Phone**: +354 774 12 74

## Technology Stack

- **Frontend**: React with TypeScript, Shadcn UI
- **Backend**: Express.js
- **Database**: In-memory storage (MemStorage)
- **Authentication**:
  - Email/Password
  - Phone (via Twilio SMS)
  - Google OAuth

## Project Structure

- `client/` - Frontend React application
- `server/` - Backend Express.js server
- `shared/` - Shared TypeScript types and utilities

## Authentication Flow

Multiple authentication methods are supported:

1. **Email/Password**: Traditional username/password authentication
2. **Phone Authentication**: SMS verification via Twilio
3. **Google OAuth**: Single Sign-On with Google account

## Scooter Fleet

- 275 total scooters available
- 250 general scooters
- 25 Kársnes-specific scooters (with K-prefixed IDs)

## Geographic Focus

The application focuses on the Greater Reykjavik area in Iceland, with special emphasis on:

- Kópavogur
- Árbær
- Grafavogur
- Laugadalur
- Kársnes (special emphasis)

## Internationalization

The application supports the following languages:

- English
- Spanish
- Icelandic