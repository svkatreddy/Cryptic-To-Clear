const jwt = require("jsonwebtoken");
const env = require("../config/env");
const userModel = require("../models/user.model");

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
};

/**
 * Attach token cookie to response
 */
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user);
  const cookieOptions = {
    expires: new Date(Date.now() + env.jwt.cookieMaxAge),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  };

  const sanitizedUser = userModel.sanitizeUser(user);

  res.status(statusCode).cookie("token", token, cookieOptions).json({
    success: true,
    message,
    token,
    user: sanitizedUser,
  });
};

/**
 * @route POST /api/auth/register
 * @desc Register new user account
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both an email address and password.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const newUser = await userModel.create({
      name,
      email,
      password,
      provider: "local",
    });

    sendTokenResponse(newUser, 201, res, "Account created successfully! Welcome to Cryptic to Clear.");
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and issue token
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    const user = await userModel.findByEmail(email);

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please check your email and password.",
      });
    }

    const isMatch = await userModel.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please check your email and password.",
      });
    }

    await userModel.updateLastLogin(user.id);
    sendTokenResponse(user, 200, res, "Successfully logged in!");
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/auth/logout
 * @desc Clear authentication session
 */
exports.logout = (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

/**
 * @route GET /api/auth/me
 * @desc Get currently logged in user session
 */
exports.getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * @route POST /api/auth/forgot-password
 * @desc Password reset request placeholder
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Please enter your email address.",
    });
  }

  const user = await userModel.findByEmail(email);
  if (!user) {
    // Return generic success for privacy
    return res.status(200).json({
      success: true,
      message: "If an account exists with that email, password reset instructions have been sent.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Password reset link has been dispatched to your email address.",
    demoNote: "In development/demo mode, use Demo account credentials: demo@cryptictoclear.io / Password123!",
  });
};
