const openaiService = require("../services/openai.service");

const MAX_SOURCE_LENGTH = 12000;
const MAX_STDIN_LENGTH = 2000;

/**
 * POST /api/debug/trace
 * Body: { language: string, sourceCode: string, stdin?: string }
 *
 * Powers the Visual Debugger. Returns a simulated step-by-step execution
 * trace (line, variables, call stack, memory, output per step).
 */
async function trace(req, res, next) {
  try {
    const { language, sourceCode, stdin } = req.body || {};

    if (!language || typeof sourceCode !== "string" || !sourceCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Request must include 'language' and a non-empty 'sourceCode'.",
      });
    }

    const result = await openaiService.generateTrace({
      language,
      sourceCode: sourceCode.slice(0, MAX_SOURCE_LENGTH),
      stdin: typeof stdin === "string" ? stdin.slice(0, MAX_STDIN_LENGTH) : "",
    });

    return res.status(200).json({ success: true, trace: result });
  } catch (err) {
    return next(err);
  }
}

module.exports = { trace };
