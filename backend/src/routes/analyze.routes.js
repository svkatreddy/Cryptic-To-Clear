const express = require("express");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../middleware/asyncHandler");
const { analyze } = require("../controllers/analyze.controller");

const router = express.Router();

// A full analysis is a heavier request than a chat turn — a bit stricter.
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many analysis requests. Please wait a moment and try again.",
  },
});

router.post("/", analyzeLimiter, asyncHandler(analyze));

module.exports = router;
