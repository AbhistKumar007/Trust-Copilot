const { validationResult } = require("express-validator");

/**
 * Middleware to run after express-validator checks.
 * Returns 422 with field-level error details if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: "Validation failed",
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next();
};

/**
 * Validates that a string is a valid Crypto address (roughly 20 to 90 alphanumeric characters).
 * Used as a custom validator with express-validator to allow ETH, BTC, SOL, etc.
 */
const isValidCryptoAddress = (value) => {
  if (!value || typeof value !== "string") return false;
  return /^[a-zA-Z0-9]{20,90}$/.test(value.trim());
};

module.exports = { validate, isValidCryptoAddress };
