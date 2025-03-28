# Verification Testing Guide

This document explains how to test the email and phone verification system in the app.

## Overview

The app includes a verification system that allows users to verify their email addresses and phone numbers. 
During development, the system uses mock email and SMS services (no actual emails or SMS are sent).

## How Verification Works

1. When a user requests verification:
   - A 6-digit random code is generated
   - The code is stored with the user account
   - In production, the code would be sent via email or SMS
   - In development, the code is logged to the console

2. When a user verifies their contact:
   - The submitted code is compared with the stored code
   - If valid and not expired, the contact is marked as verified

## Testing the Verification System

### Option 1: Using Development Notification

When using the verification dialog in development mode, a yellow notification banner appears with instructions.

### Option 2: Check Server Logs

When verification codes are generated, they are logged to the console:

```
[MOCK] Sending verification email to user@example.com with code: 123456
EMAIL VERIFICATION CODE for user@example.com: 123456
```

or

```
[MOCK] Sending verification SMS to +1234567890 with code: 123456
SMS VERIFICATION CODE for +1234567890: 123456
```

### Option 3: Using the Test API Endpoint

A special endpoint has been created to simplify testing:

```
GET /api/verification/test/codes
```

This endpoint returns all active verification codes as JSON:

```json
{
  "message": "DEVELOPMENT ONLY: Active verification codes",
  "codes": [
    {
      "contact": "user@example.com",
      "code": "123456"
    },
    {
      "contact": "+1234567890",
      "code": "654321"
    }
  ]
}
```

You can access this endpoint using curl:

```bash
curl http://localhost:5000/api/verification/test/codes
```

**Important Note**: This endpoint is for development and testing only. In a production environment, this endpoint should be disabled or secured with appropriate authentication.

## Test Email and Phone

For consistent testing, you can use:

- Email: ferransson@gmail.com 
- Phone: +354 774 12 74

## Troubleshooting

1. **Code not working?** A new code is generated each time you request verification. Always use the most recent code.

2. **No codes showing in test endpoint?** You need to request a verification code first through the UI before any codes will be available.

3. **Verification not persisting?** The current implementation uses in-memory storage that resets when the server restarts.