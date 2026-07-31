/**
 * Request Payload Validation Middleware
 */

function validateExecuteRequest(req, res, next) {
  const { language, sourceCode } = req.body || {};

  if (!language || typeof language !== "string") {
    return res.status(400).json({
      success: false,
      message: "Request must include a valid 'language' string.",
    });
  }

  if (typeof sourceCode !== "string") {
    return res.status(400).json({
      success: false,
      message: "Request must include 'sourceCode' string.",
    });
  }

  if (!sourceCode.trim()) {
    return res.status(400).json({
      success: false,
      message: "There's no code to run yet — write something first.",
    });
  }

  next();
}

function validateExplainRequest(req, res, next) {
  const { language, sourceCode, error } = req.body || {};

  if (!language || typeof language !== "string") {
    return res.status(400).json({
      success: false,
      message: "Request must include a valid 'language' string.",
    });
  }

  if (typeof sourceCode !== "string" || !sourceCode.trim()) {
    return res.status(400).json({
      success: false,
      message: "Request must include non-empty 'sourceCode'.",
    });
  }

  if (!error || typeof error !== "string") {
    return res.status(400).json({
      success: false,
      message: "Request must include 'error' text to explain.",
    });
  }

  next();
}

module.exports = {
  validateExecuteRequest,
  validateExplainRequest,
};
