const express = require("express");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../middleware/asyncHandler");
const { validateExecuteRequest } = require("../middleware/validateRequest");
const { execute } = require("../controllers/execute.controller");

const router = express.Router();

const executeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many run requests. Please wait a moment and try again.",
  },
});

router.post("/", executeLimiter, validateExecuteRequest, asyncHandler(execute));

module.exports = router;
