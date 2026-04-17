const rateLimit = require("express-rate-limit");

/**
 * Global rate limiter applied to all API routes.
 * Protects against DDoS and API abuse.
 */
const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
});

/**
 * Stricter limiter for the analyze endpoint (more expensive operation).
 */
const analyzeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10,             // 10 analyses per minute per IP
  message: {
    success: false,
    error: "Analysis rate limit exceeded. Please wait before analyzing another wallet.",
    retryAfter: "1 minute",
  },
});

module.exports = { globalRateLimiter, analyzeRateLimiter };
