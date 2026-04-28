const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const { globalLimiter } = require("./middlewares/rateLimiter");
const parentsService = require("./services/parents.service");

const REGISTRATION_CLEANUP_INTERVAL_MS = 60 * 1000;
if (!global.__parentRegistrationCleanupTimer) {
  global.__parentRegistrationCleanupTimer = setInterval(async () => {
    try {
      await parentsService.purgeExpiredPendingRegistrations();
    } catch (error) {
      console.error(
        "[app] Failed to purge expired pending parent registrations",
        error,
      );
    }
  }, REGISTRATION_CLEANUP_INTERVAL_MS);

  global.__parentRegistrationCleanupTimer.unref?.();
}

const app = express();

// Trust proxy for Railway/reverse proxies to allow rate limiting to work correctly
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "data:", "https://*.supabase.co", "blob:"],
        "frame-src": ["'self'", "https://www.google.com", "https://*.google.com"],
        "connect-src": ["'self'", "https://*.supabase.co", "data:"],
      },
    },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Apply global rate limiter to all API routes
app.use("/api", globalLimiter);

// Health check route (not rate-limited)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", routes);

// Serve static files from the frontend build
const distPath = path.join(__dirname, "../..", "dist");
app.use(express.static(distPath));

// Catch-all route to serve the frontend SPA
// Express 5 / path-to-regexp no longer accepts bare "*" route patterns.
app.get(/.*/, (req, res, next) => {
  // If request is for an API route but it wasn't matched, let it fall through to 404
  if (req.path.startsWith("/api")) {
    return next();
  }
  // Otherwise, serve the SPA index.html
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      next();
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;
