const openaiService = require("../services/openai.service");

const MAX_SOURCE_LENGTH = 20000;

/**
 * POST /api/analyze
 * Body: { language: string, sourceCode: string }
 *
 * Powers the Code Quality Analyzer. Reusable beyond its current trigger —
 * any client can post a language/source-code pair and get back a
 * structured quality report.
 */
async function analyze(req, res, next) {
  try {
    const { language, sourceCode } = req.body || {};

    if (!language || typeof sourceCode !== "string" || !sourceCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Request must include 'language' and a non-empty 'sourceCode'.",
      });
    }

    const analysis = await openaiService.analyzeCode({
      language,
      sourceCode: sourceCode.slice(0, MAX_SOURCE_LENGTH),
    });

    return res.status(200).json({ success: true, analysis });
  } catch (err) {
    return next(err);
  }
}

module.exports = { analyze };
