# Verification System Testing Guide

This document provides guidance on how to test the email and phone verification system in the Scooter Rental App.

## Verification System Overview

The verification system allows users to verify their email and phone number through verification codes. The system has these main components:

1. **Verification Request Endpoints**: API endpoints to request verification codes for email and phone
2. **Verification Status Endpoint**: API endpoint to check if email and phone are verified
3. **Verification Code Endpoints**: API endpoints to verify email and phone using codes
4. **Mock Delivery System**: Simulated email and SMS delivery (logs codes to console in development)
5. **Test Endpoints**: Special endpoints to retrieve verification codes for testing

## Test Scripts

We have created several test scripts to verify the functionality of the verification system:

### 1. `simple-verify-test.js`

This is the simplest test script that:
- Registers a test user
- Requests verification codes for email and phone
- Gets the verification codes using the `/api/verification/test/codes` endpoint
- Verifies both email and phone
- Confirms the verification status

Usage:
```
node simple-verify-test.js
```

### 2. `test-verification-updated.js`

This is a more comprehensive test script that:
- Registers a test user
- Tests email verification with more detailed logging
- Tests phone verification with more detailed logging
- Has better error handling and fallback mechanisms

Usage:
```
node test-verification-updated.js
```

## Test Endpoints

For testing purposes, we have implemented two special endpoints:

### 1. `/api/verification/test/codes`

This endpoint returns all active verification codes for the currently logged-in user. The response format is:
```json
{
  "email": "123456",  // Current email verification code (if exists)
  "phone": "654321"   // Current phone verification code (if exists)
}
```

Authentication is required to use this endpoint, and it's only available in development mode.

### 2. `/api/testing/verification-code` (Legacy)

This is an older endpoint that requires a contact parameter and returns a specific code:
```json
{
  "contact": "user@example.com",
  "code": "123456"
}
```

The first endpoint is preferred as it doesn't require knowing which codes are active.

## Test User

For testing, we use these test credentials:
- Email: `ferransson@gmail.com`
- Phone: `+354 774 12 74`

## Manual Testing

To manually test the verification system:

1. Create a user with the test email and phone
2. Request email verification from the profile page
3. Get the verification code from the console logs or use the test endpoint
4. Enter the code on the verification page
5. Check that the email shows as verified
6. Repeat steps 2-5 for phone verification

## Code Update Notes

If you make changes to the verification system, ensure all test scripts still pass:
```
node simple-verify-test.js
node test-verification-updated.js
```

## Security Notes

- The test endpoints should NEVER be enabled in production
- Real email and SMS services should be used in production
- In production, verification codes should expire after a short time
- Only authenticated users can request verification for their own contact methods