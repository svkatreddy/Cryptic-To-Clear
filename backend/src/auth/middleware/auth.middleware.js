const jwt = require("jsonwebtoken");
const env = require("../../config/env");
const userModel = require("../../models/user.model");

/**
 * Extract token from cookies or Authorization header
 */
const extractToken = (req) => {
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

/**
 * Middleware requiring a valid user session.
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in or continue as guest.",
      });
    }

    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session expired or user no longer exists.",
      });
    }

    req.user = userModel.sanitizeUser(user);
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
      error: error.message,
    });
  }
};

/**
 * Optional Auth middleware: attaches req.user if authenticated, but never blocks guests.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, env.jwt.secret);
      const user = await userModel.findById(decoded.id);
      if (user) {
        req.user = userModel.sanitizeUser(user);
      }
    }
  } catch {
    // Ignore invalid tokens for guest access
    req.user = null;
  }
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
};
