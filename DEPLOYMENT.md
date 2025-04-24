# ScootMe Deployment Guide

This guide provides instructions for deploying the ScootMe application on Replit.

## Deployment Options

There are several ways to deploy the application. Choose the option that works best for you.

### Option 1: Use the Deploy Button in Replit (Recommended)

Before deploying:

1. Run the following command to prepare the application for deployment:
   ```
   node fix-production-before-deploy.js
   ```

2. Click the "Deploy" button in the Replit interface.

3. If deployment fails with Node.js errors, try Option 2 or Option 3 below.

### Option 2: Use the Custom Deployment Script

1. Run the custom deployment script:
   ```
   ./deploy-production.sh
   ```

2. This script will:
   - Build the client application
   - Copy the built files to the correct location
   - Add necessary fixes for production
   - Start the server using `server.cjs` (a CommonJS compatible server)

### Option 3: Manual Deployment

If both automatic options fail, follow these manual steps:

1. Build the client application:
   ```
   npm run build
   ```

2. Copy built files to the server/public directory:
   ```
   mkdir -p server/public
   cp -r dist/* server/public/
   ```

3. Edit the index.html file to add a base href:
   ```
   sed -i 's/<title>/<base href="\/"><title>/' server/public/index.html
   ```

4. Start the server:
   ```
   node server.cjs
   ```

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