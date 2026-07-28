const express = require("express");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../middleware/asyncHandler");
const { explain } = require("../controllers/explain.controller");

const router = express.Router();

// AI calls cost money and take longer than a rate-limit "ping" — a bit
// stricter than the execute limiter, still generous for real usage.
const explainLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many AI explanation requests. Please wait a moment and try again.",
  },
});

router.post("/", explainLimiter, asyncHandler(explain));

module.exports = router;
