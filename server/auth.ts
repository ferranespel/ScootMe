import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, registerSchema, loginSchema } from "@shared/schema";
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'scooterapp-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Set up Google OAuth strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/api/auth/google/callback",
        scope: ["profile", "email"],
        // Add additional parameters to help with the redirect URI issue
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if we already have a user with this Google ID
          const providerId = "google";
          const providerAccountId = profile.id;
          
          // Find user by provider ID
          let user = await storage.getUserByProviderId(providerId, providerAccountId);
          
          if (!user) {
            // Create a new user
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (!email) {
              return done(new Error("Email is required from Google"));
            }
            
            // Generate a username based on display name or email
            const name = profile.displayName || email.split('@')[0];
            const username = `${name.toLowerCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 1000)}`;
            
            // Create the user
            user = await storage.createUser({
              username,
              email,
              fullName: profile.displayName || username,
              password: null, // No password for OAuth users
              profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
              providerId,
              providerAccountId,
              isEmailVerified: true // Email is verified through Google
            });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password and create user
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
      });

      // Auto-login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      // Validate request body
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid username or password" });
        }
        
        req.login(user, (err) => {
          if (err) return next(err);
          // Return user without password
          const { password, ...userWithoutPassword } = user;
          res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Return user without password
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  // Google OAuth routes
  app.get("/api/auth/google", (req, res, next) => {
    console.log("Google OAuth request received. Replit hostname:", req.hostname);
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      // Add additional options to help debug
      prompt: "select_account"
    })(req, res, next);
  });
  
  app.get(
    "/api/auth/google/callback",
    (req, res, next) => {
      console.log("Google OAuth callback received:", req.url);
      passport.authenticate("google", { 
        failureRedirect: "/auth",
        failWithError: true
      })(req, res, next);
    },
    (req, res) => {
      // Successful authentication, redirect to home page
      console.log("Google OAuth authentication successful");
      res.redirect("/");
    },
    (err, req, res, next) => {
      // Error handler
      console.error("Google OAuth error:", err);
      res.redirect("/auth?error=google-auth-failed");
    }
  );
}
