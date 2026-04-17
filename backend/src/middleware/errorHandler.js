/**
 * Global error handling middleware.
 * Catches all errors passed via next(err) and returns consistent JSON responses.
 */
const errorHandler = (err, req, res, next) => {
  // Log full error in development
  if (process.env.NODE_ENV !== "production") {
    console.error("❌ Error:", err);
  } else {
    console.error(`❌ [${new Date().toISOString()}] ${err.message}`);
  }

  // Axios errors (external API failures)
  if (err.isAxiosError) {
    const status = err.response?.status || 502;
    const message = err.response?.data?.message || "External API request failed";
    return res.status(status).json({
      success: false,
      error: message,
      code: "EXTERNAL_API_ERROR",
    });
  }

  // OpenAI errors
  if (err.constructor?.name === "OpenAI" || err.message?.includes("OpenAI")) {
    return res.status(503).json({
      success: false,
      error: "AI service temporarily unavailable",
      code: "AI_SERVICE_ERROR",
    });
  }

  // Generic errors
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal server error",
    code: err.code || "INTERNAL_ERROR",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

/**
 * Helper to create structured API errors.
 */
const createError = (message, statusCode = 500, code = "ERROR") => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

module.exports = { errorHandler, createError };
