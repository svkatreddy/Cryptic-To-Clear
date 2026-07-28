const express = require("express");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../middleware/asyncHandler");
const { chat } = require("../controllers/chat.controller");

const router = express.Router();

// Chat is interactive, so this is a bit more generous than /api/explain.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many chat messages. Please wait a moment and try again.",
  },
});

router.post("/", chatLimiter, asyncHandler(chat));

module.exports = router;
