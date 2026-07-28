const express = require("express");
const { listLanguages } = require("../config/languages");

const router = express.Router();

// GET /api/languages — lets any client (this frontend, a future mobile app,
// docs, etc.) discover which languages the backend can currently execute.
router.get("/", (req, res) => {
  res.status(200).json({ success: true, languages: listLanguages() });
});

module.exports = router;
