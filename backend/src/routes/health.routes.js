const express = require("express");
const env = require("../config/env");

const router = express.Router();

router.get("/", async (req, res) => {
  const groqConfigured = Boolean(env.groq && env.groq.apiKeys && env.groq.apiKeys.length > 0);

  res.status(200).json({
    success: true,
    status: "ok",
    uptime: process.uptime(),
    groq: {
      configured: groqConfigured,
      model: env.groq.model,
    },
  });
});

module.exports = router;
