const openaiService = require("../services/openai.service");

const MAX_SOURCE_LENGTH = 15000;

/**
 * POST /api/convert
 * Body: { sourceLanguage: string, targetLanguage: string, sourceCode: string }
 *
 * Converts code between any two supported languages, preserving logic,
 * and returns the converted code alongside an explanation of the key
 * differences between the two languages for this conversion.
 */
async function convert(req, res, next) {
  try {
    const { sourceLanguage, targetLanguage, sourceCode } = req.body || {};

    if (
      !sourceLanguage ||
      !targetLanguage ||
      typeof sourceCode !== "string" ||
      !sourceCode.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Request must include 'sourceLanguage', 'targetLanguage', and a non-empty 'sourceCode'.",
      });
    }

    if (sourceLanguage === targetLanguage) {
      return res.status(400).json({
        success: false,
        message: "Source and target languages must be different.",
      });
    }

    const conversion = await openaiService.convertCode({
      sourceLanguage,
      targetLanguage,
      sourceCode: sourceCode.slice(0, MAX_SOURCE_LENGTH),
    });

    return res.status(200).json({ success: true, conversion });
  } catch (err) {
    return next(err);
  }
}

module.exports = { convert };
