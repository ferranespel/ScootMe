# ScootMe - Urban Mobility Platform

A cutting-edge urban mobility platform delivering intelligent scooter rental experiences across multiple cities, focusing on user engagement and sustainable transportation.

## Running the Application

### Using the Run Button in Replit

When you click the **Run** button in Replit, a preview server will start on port 8080. This preview server provides links to access the main application running on port 5000.

The preview page includes direct links to:
- Main Application
- Authentication Page
- Authentication Test Page

### Accessing the Application Directly

The main application runs on port 5000. You can access it directly at:
- https://[repl-name].[username].repl.co
- http://localhost:5000 (when running locally)

## Key Features

- **User Authentication**: Multiple authentication methods including email/password, Google OAuth, and phone verification via SMS
- **Scooter Rental**: Intuitive interface for finding, unlocking, and returning scooters
- **Real-time Tracking**: Live tracking of scooters with GPS integration
- **Payment Processing**: Secure payment processing with Stripe
- **Administrative Controls**: Backend management system for fleet operators

## Geographic Focus

The service primarily operates in Greater Reykjavik, Iceland, with special emphasis on neighborhoods:
- Kópavogur
- Árbær
- Grafavogur
- Laugadalur
- Kársnes (special fleet)

## Technical Stack

### Frontend
- React with TypeScript
- TailwindCSS with ShadCN components
- Wouter for routing
- TanStack Query for data fetching
- i18next for internationalization

### Backend
- Express.js server with TypeScript
- WebSocket for real-time communication
- PostgreSQL database with Drizzle ORM
- Firebase authentication
- Twilio for SMS verification

### Deployment
- Replit hosting
- Custom domain configuration

## Development

The project structure follows a client-server architecture:
- `/client`: Frontend React application
- `/server`: Backend Express.js API
- `/shared`: Shared types and schemas

## Authentication Methods

The system supports multiple authentication methods:
- Email/Password (with verification)
- Google OAuth (direct integration using Passport.js)
- Phone number verification (using Twilio SMS)

## Deployment

The application is deployed and accessible at:
- scoot-me-ferransson.replit.app
- scootme.ferransson.com

## Testing Credentials

For testing authentication:
- Email: ferransson@gmail.com
- Phone: +354 774 12 74