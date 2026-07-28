const express = require("express");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../middleware/asyncHandler");
const { convert } = require("../controllers/convert.controller");

const router = express.Router();

const convertLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many conversion requests. Please wait a moment and try again.",
  },
});

router.post("/", convertLimiter, asyncHandler(convert));

module.exports = router;
