const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const env = require("./config/env");
const errorHandler = require("./middleware/errorHandler");

const healthRoutes = require("./routes/health.routes");
const languagesRoutes = require("./routes/languages.routes");
const executeRoutes = require("./routes/execute.routes");
const explainRoutes = require("./routes/explain.routes");
const chatRoutes = require("./routes/chat.routes");
const analyzeRoutes = require("./routes/analyze.routes");
const debugRoutes = require("./routes/debug.routes");
const learnRoutes = require("./services/learn.routes");
const convertRoutes = require("./routes/convert.routes");

const app = express();

// Security headers. CSP is disabled here because this is a pure JSON API
// consumed by a separate frontend origin, not a page-serving app.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, postman, server-side) or any origin in development
      if (!origin || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      if (Array.isArray(env.corsOrigin) && env.corsOrigin.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.use("/api/health", healthRoutes);
app.use("/api/languages", languagesRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api/explain", explainRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/learn", learnRoutes);
app.use("/api/convert", convertRoutes);


// 404 for anything else under /api
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.get("/", (req, res) => {
  res.send("CodeMentor AI backend is running.");
});

// Must be registered last — catches errors from every route above.
app.use(errorHandler);

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`CodeMentor AI backend listening on port ${env.port}`);
});

// Graceful shutdown so in-flight requests finish cleanly (e.g. under a
// process manager or container orchestrator sending SIGTERM).
["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal, () => {
    // eslint-disable-next-line no-console
    console.log(`${signal} received, shutting down gracefully…`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
});
