const express = require("express");

const analyzeRoutes = require("./analyze.routes");
const chatRoutes = require("./chat.routes");
const convertRoutes = require("./convert.routes");
const debugRoutes = require("./debug.routes");
const executeRoutes = require("./execute.routes");
const explainRoutes = require("./explain.routes");
const healthRoutes = require("./health.routes");
const languagesRoutes = require("./languages.routes");
const learnRoutes = require("./learn.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/languages", languagesRoutes);
router.use("/execute", executeRoutes);
router.use("/explain", explainRoutes);
router.use("/chat", chatRoutes);
router.use("/analyze", analyzeRoutes);
router.use("/debug", debugRoutes);
router.use("/learn", learnRoutes);
router.use("/convert", convertRoutes);

module.exports = router;
