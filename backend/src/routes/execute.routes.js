const express = require("express");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../middleware/asyncHandler");
const { execute } = require("../controllers/execute.controller");

const router = express.Router();

// Keep the execution engine from being hammered — generous enough for a
// single user actively coding, strict enough to prevent abuse.
const executeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many run requests. Please wait a moment and try again.",
  },
});

router.post("/", executeLimiter, asyncHandler(execute));

module.exports = router;
