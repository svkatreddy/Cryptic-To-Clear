const express = require("express");
const { requireAuth } = require("../auth/middleware/auth.middleware");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  return res.status(200).json({
    success: true,
    projects: [],
    message: "Saved projects architecture ready for cloud sync.",
  });
});

router.post("/", requireAuth, (req, res) => {
  return res.status(201).json({
    success: true,
    message: "Project saved to cloud placeholder.",
    project: {
      id: `proj_${Date.now()}`,
      title: req.body.title || "Untitled Snippet",
      language: req.body.language || "javascript",
      code: req.body.sourceCode || "",
      createdAt: new Date().toISOString(),
    },
  });
});

module.exports = router;
