import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { storage } from './storage';

// Google OAuth uses a fixed redirect URI approach 
// Since Google requires pre-registered redirect URIs, we use a fixed one.
// Then, we pass the original host as state parameter and use a proxy redirect approach

// IMPORTANT: The following URL must be registered in the Google Cloud Console
const FIXED_GOOGLE_REDIRECT_URI = 'https://scootme--ferransson.repl.co/api/auth/google/callback';

// Function to get redirect URI - ALWAYS returns the fixed URI
const getRedirectUri = (req?: Request) => {
  // Show what URL we're actually using for debugging 
  if (req && req.headers.host) {
    console.log(`Original host: ${req.headers.host} - using fixed redirect URI instead`);
  }
  
  // Always return our fixed redirect URI that's registered in Google Cloud Console
  return FIXED_GOOGLE_REDIRECT_URI;
};

// Initial redirect URI for startup logging
const initialRedirectUri = getRedirectUri();
console.log('Google OAuth redirect URI (initial):', initialRedirectUri);

// Important note about Google OAuth configuration
console.log('IMPORTANT: Make sure to register ALL potential redirect URIs in the Google Cloud Console:');
console.log('1. The primary domain: https://scootme--ferransson.repl.co/api/auth/google/callback');
console.log('2. Your development domain: ' + (process.env.REPL_ID ? `https://${process.env.REPL_ID}.id.repl.co/api/auth/google/callback` : 'unknown'));
console.log('3. Any additional Replit domains where you test this application.');

// Log auth configuration (without exposing secrets)
if (process.env.GOOGLE_CLIENT_ID) {
  const clientIdPrefix = process.env.GOOGLE_CLIENT_ID.substring(0, 6);
  const clientIdSuffix = process.env.GOOGLE_CLIENT_ID.substring(process.env.GOOGLE_CLIENT_ID.length - 4);
  console.log(`Using Google Client ID: ${clientIdPrefix}...${clientIdSuffix}`);
} else {
  console.error("GOOGLE_CLIENT_ID is not set");
}

// Create OAuth client factory that generates fresh client for each request
const createOAuthClient = (req?: Request) => {
  const redirectUri = getRedirectUri(req);
  console.log('Creating OAuth client with redirect URI:', redirectUri);
  
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

/**
 * Generate Google OAuth URL for redirection
 */
export function getGoogleAuthUrl(req: Request) {
  // Create a fresh OAuth client with the appropriate redirect URI
  const oauth2Client = createOAuthClient(req);
  
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    prompt: 'consent',  // Force consent screen to ensure refresh token
    state: req.headers.host || 'default' // Store the host in state for verification
  });

  return url;
}

/**
 * Handle OAuth callback
 */
export async function handleGoogleCallback(req: Request, res: Response) {
  try {
    console.log('Google OAuth callback received:', {
      url: req.originalUrl,
      query: req.query,
      headers: {
        host: req.headers.host,
        referer: req.headers.referer,
        origin: req.headers.origin
      }
    });
    
    // Create a fresh OAuth client with the FIXED redirect URI
    const oauth2Client = createOAuthClient();
    
    const { code, error, state } = req.query;
    
    // Handle OAuth errors returned by Google
    if (error) {
      console.error('Google OAuth error returned:', error);
      return res.redirect(`/auth?error=${encodeURIComponent(error as string)}`);
    }
    
    if (!code || typeof code !== 'string') {
      console.error('No code provided in callback');
      return res.redirect('/auth?error=no_code_provided');
    }
    
    // Get original domain from state parameter - this is where user should be redirected after auth
    let redirectDomain = 'scootme--ferransson.repl.co'; // Default domain
    
    if (state && typeof state === 'string') {
      console.log('State parameter returned:', state);
      // Only use the state as redirect domain if it looks like a valid domain
      if (state.includes('.') && !state.includes('/') && !state.includes('?')) {
        redirectDomain = state;
        console.log('Using state as redirect domain:', redirectDomain);
      }
    }
    
    console.log('Getting tokens from code');
    // Exchange code for tokens
    try {
      const { tokens } = await oauth2Client.getToken(code);
      console.log('Tokens received successfully');
      oauth2Client.setCredentials(tokens);
    } catch (tokenError) {
      console.error('Failed to get tokens:', tokenError);
      return res.redirect(`https://${redirectDomain}/auth?error=token_exchange_failed`);
    }
    
    // Get user info with the access token
    console.log('Getting user info from Google');
    let userInfoResponse;
    try {
      userInfoResponse = await oauth2Client.request({
        url: 'https://www.googleapis.com/oauth2/v3/userinfo',
      });
    } catch (userInfoError) {
      console.error('Failed to get user info:', userInfoError);
      return res.redirect(`https://${redirectDomain}/auth?error=userinfo_failed`);
    }
    
    const userInfo = userInfoResponse.data as any;
    console.log('User info retrieved:', {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name
    });
    
    if (!userInfo.email) {
      console.error('No email provided by Google');
      return res.redirect(`https://${redirectDomain}/auth?error=no_email_provided`);
    }
    
    // Check if user already exists
    let user = await storage.getUserByProviderId('google', userInfo.sub);
    
    if (!user) {
      // Create a new user
      const username = `${(userInfo.name || userInfo.email.split('@')[0]).toLowerCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 1000)}`;
      
      console.log('Creating new user');
      try {
        user = await storage.createUser({
          username,
          email: userInfo.email,
          fullName: userInfo.name || username,
          password: null, // No password for OAuth users
          profilePicture: userInfo.picture || null,
          providerId: "google",
          providerAccountId: userInfo.sub,
          isEmailVerified: true // Email is verified through Google
        });
      } catch (createUserError) {
        console.error('Failed to create user:', createUserError);
        return res.redirect(`https://${redirectDomain}/auth?error=user_creation_failed`);
      }
    }
    
    // Log the user in
    console.log('Logging in user:', user.id);
    req.login(user, (err) => {
      if (err) {
        console.error('Login error', err);
        return res.redirect(`https://${redirectDomain}/auth?error=login_failed`);
      }
      
      // Redirect to home page after successful login
      // If we're already on the same domain, use a relative URL
      if (req.headers.host === redirectDomain) {
        return res.redirect('/');
      } else {
        // Otherwise use absolute URL to redirect to the original domain
        return res.redirect(`https://${redirectDomain}/`);
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Determine where to redirect based on the state parameter
    let redirectUrl = '/auth?error=' + encodeURIComponent(errorMessage);
    if (req.query.state && typeof req.query.state === 'string' && 
        req.query.state.includes('.') && !req.query.state.includes('/')) {
      redirectUrl = `https://${req.query.state}${redirectUrl}`;
    }
    
    return res.redirect(redirectUrl);
  }
}