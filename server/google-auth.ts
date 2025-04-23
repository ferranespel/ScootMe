import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { storage } from './storage';

// Initialize Google OAuth client
// Use environment variables for production or development URLs
const redirectUri = process.env.NODE_ENV === 'production' 
  ? `${process.env.PRODUCTION_URL}/api/auth/google/callback`
  : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/auth/google/callback`;

// Create OAuth client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

/**
 * Generate Google OAuth URL for redirection
 */
export function getGoogleAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    prompt: 'consent'  // Force consent screen to ensure refresh token
  });

  return url;
}

/**
 * Handle OAuth callback
 */
export async function handleGoogleCallback(req: Request, res: Response) {
  try {
    console.log('Handling Google callback');
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      console.error('No code provided in callback');
      return res.redirect('/auth?error=no_code_provided');
    }
    
    console.log('Getting tokens from code');
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user info with the access token
    console.log('Getting user info from Google');
    const userInfoResponse = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });
    
    const userInfo = userInfoResponse.data as any;
    console.log('User info retrieved:', {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name
    });
    
    if (!userInfo.email) {
      console.error('No email provided by Google');
      return res.redirect('/auth?error=no_email_provided');
    }
    
    // Check if user already exists
    let user = await storage.getUserByProviderId('google', userInfo.sub);
    
    if (!user) {
      // Create a new user
      const username = `${(userInfo.name || userInfo.email.split('@')[0]).toLowerCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 1000)}`;
      
      console.log('Creating new user');
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
    }
    
    // Log the user in
    console.log('Logging in user:', user.id);
    req.login(user, (err) => {
      if (err) {
        console.error('Login error', err);
        return res.redirect('/auth?error=login_failed');
      }
      
      // Redirect to home page after successful login
      return res.redirect('/');
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.redirect('/auth?error=' + encodeURIComponent('Authentication failed'));
  }
}