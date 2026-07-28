const openaiService = require("../services/openai.service");

/**
 * POST /api/explain
 * Body: { language: string, error: string, sourceCode: string }
 *
 * Triggered automatically by the frontend whenever a compilation fails.
 * Reusable beyond that trigger too — any client can post a language/error/
 * source-code triple here and get back a structured explanation.
 */
async function explain(req, res, next) {
  try {
    const { language, error, sourceCode } = req.body || {};

    if (!language || !error || typeof sourceCode !== "string") {
      return res.status(400).json({
        success: false,
        message:
          "Request must include 'language', 'error', and 'sourceCode'.",
      });
    }

    const explanation = await openaiService.explainError({
      language,
      error,
      sourceCode,
    });

    return res.status(200).json({ success: true, explanation });
  } catch (err) {
    return next(err);
  }
}

module.exports = { explain };
