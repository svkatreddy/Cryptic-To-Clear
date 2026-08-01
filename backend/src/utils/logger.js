/**
 * Centralized Structured Logger for Cryptic to Clear Platform
 */

const LOG_LEVELS = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};

const currentLevel = process.env.LOG_LEVEL ? (LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO) : LOG_LEVELS.INFO;

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const payload = {
    timestamp,
    level,
    message,
    ...meta,
  };
  return JSON.stringify(payload);
}

const logger = {
  debug(message, meta) {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log(formatMessage("DEBUG", message, meta));
    }
  },
  info(message, meta) {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.log(formatMessage("INFO", message, meta));
    }
  },
  warn(message, meta) {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(formatMessage("WARN", message, meta));
    }
  },
  error(message, meta) {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(formatMessage("ERROR", message, meta));
    }
  },
  requestLogger(req, res, next) {
    const start = Date.now();
    const requestId = `req_${Math.random().toString(36).substring(2, 9)}`;
    req.requestId = requestId;

    res.on("finish", () => {
      const durationMs = Date.now() - start;
      logger.info(`HTTP ${req.method} ${req.originalUrl}`, {
        requestId,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs: `${durationMs}ms`,
        ip: req.ip,
      });
    });

    next();
  },
};

module.exports = logger;
