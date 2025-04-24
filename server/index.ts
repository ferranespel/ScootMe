import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Log all environment variables for debugging
  console.log("Environment variables:", {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    REPLIT_ENVIRONMENT: process.env.REPLIT_ENVIRONMENT,
  });
  
  // Use environment port if specified, otherwise use 3000
  // This way we can override it from the environment if needed
  const port = process.env.PORT || 3000;
  
  // Log the port decision
  console.log(`Using port: ${port} (NODE_ENV: ${process.env.NODE_ENV})`);
  
  // Check if port 5000 is already in use (for debugging purposes)
  import('child_process').then(cp => {
    try {
      const command = 'lsof -i :5000 | grep LISTEN || echo "Port 5000 appears to be available"';
      cp.exec(command, (error, stdout, stderr) => {
        if (error) {
          console.log(`Port check error: ${error.message}`);
          return;
        }
        console.log(`Port 5000 check result: ${stdout.trim()}`);
      });
    } catch (e) {
      console.log(`Port check failed: ${e.message}`);
    }
  });
  
  // Start server on the standard port
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
