# ScootMe Deployment Guide

This guide provides instructions for deploying the ScootMe application on Replit.

## Deployment Options

There are several ways to deploy the application, from professional automatic deployment to manual options if needed.

### Option 1: Professional One-Click Deployment (Recommended)

The application now supports fully automated deployment:

1. Simply click the "Deploy" button in the Replit interface.

2. Our professional deployment system (`server.js`) will automatically:
   - Build the client application
   - Copy the built files to the correct location
   - Add necessary fixes for production
   - Start the server with proper error handling

This is the recommended approach as it requires no manual steps and handles all deployment tasks automatically.

### Option 2: Professional Alternative Deployment

If you prefer more control over the deployment process:

1. Run the professional deployment script:
   ```
   node auto-deploy.js
   ```

2. This script will:
   - Set up the proper environment
   - Build the client application
   - Copy the built files to the correct location
   - Add necessary fixes for production
   - Start the server using `server.cjs`

### Option 3: Legacy Deployment Method

If you need to use the previous deployment method:

1. Run the following command to prepare the application for deployment:
   ```
   node fix-production-before-deploy.js
   ```

2. Click the "Deploy" button in the Replit interface.

## Troubleshooting

### Common Issues

1. **"Missing Node.js installation" error**:
   - We've already installed Node.js 18.x as a system dependency
   - The `server.cjs` file uses CommonJS syntax which is compatible with most Node.js versions

2. **"Loading application..." screen is stuck**:
   - This is fixed by adding proper error handling and a base href tag in index.html
   - The `fix-production-before-deploy.js` script handles this automatically

3. **Failing API calls after deployment**:
   - The simplified `server.cjs` provides basic authentication endpoints for testing
   - For full functionality, make sure all environment variables are set properly

### Environment Variables

Make sure these environment variables are set in your Replit environment:

- `PORT=5000` (for server port)
- `NODE_ENV=production` (for production mode)
- `SESSION_SECRET` (for session encryption)

## Custom Domains

If you're using a custom domain like `scootme.ferransson.com`:

1. Make sure to add it to the authorized domains in Firebase Console
2. Add it to the Google OAuth authorized redirect URIs

## Support

If you encounter issues during deployment, please refer to the Replit documentation or contact support.