const openaiService = require("../services/openai.service");

const MAX_SOURCE_LENGTH = 12000;

/**
 * POST /api/learn
 * Body: { language: string, sourceCode: string }
 *
 * Powers Learning Mode. Returns a complete multi-level teaching package for
 * the given code: explanations at three levels, a real-life example, a
 * Mermaid flowchart, pseudocode, complexity analysis, a practice question,
 * an interview question, and related topics.
 */
async function learn(req, res, next) {
  try {
    const { language, sourceCode } = req.body || {};

    if (!language || typeof sourceCode !== "string" || !sourceCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Request must include 'language' and a non-empty 'sourceCode'.",
      });
    }

    const content = await openaiService.generateLearningContent({
      language,
      sourceCode: sourceCode.slice(0, MAX_SOURCE_LENGTH),
    });

    return res.status(200).json({ success: true, content });
  } catch (err) {
    return next(err);
  }
}

module.exports = { learn };
