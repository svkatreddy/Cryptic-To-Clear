const express = require("express");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../middleware/asyncHandler");
const { trace } = require("../controllers/debug.controller");

const router = express.Router();

// Trace generation is a heavier structured-output request — keep it modest.
const traceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many debugger requests. Please wait a moment and try again.",
  },
});

router.post("/trace", traceLimiter, asyncHandler(trace));

module.exports = router;
