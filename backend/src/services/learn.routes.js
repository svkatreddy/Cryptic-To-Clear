const express = require("express");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../middleware/asyncHandler");
const { learn } = require("../controllers/learn.controller");

const router = express.Router();

// A full teaching package is a heavier structured-output request.
const learnLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many Learning Mode requests. Please wait a moment and try again.",
  },
});

router.post("/", learnLimiter, asyncHandler(learn));

module.exports = router;
