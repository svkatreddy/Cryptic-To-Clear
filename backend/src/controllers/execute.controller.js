const { getLanguageConfig } = require("../config/languages");
const openaiService = require("../services/openai.service");

/**
 * POST /api/execute
 * Body: { language: string, sourceCode: string, stdin?: string }
 *
 * This single reusable endpoint powers both the editor's "Run" and
 * "Compile" actions by using the AI execution provider.
 */
async function execute(req, res, next) {
  try {
    const { language, sourceCode, stdin } = req.body || {};

    if (!language || typeof sourceCode !== "string") {
      return res.status(400).json({
        success: false,
        message: "Request must include 'language' and 'sourceCode'.",
      });
    }

    if (!sourceCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "There's no code to run yet — write something first.",
      });
    }

    const langConfig = getLanguageConfig(language);
    if (!langConfig) {
      return res.status(400).json({
        success: false,
        message: `Execution for "${language}" isn't supported yet.`,
      });
    }

    try {
      const executionResult = await openaiService.runCode({
        language,
        sourceCode,
        stdin,
      });

      return res.status(200).json({
        success: true,
        language,
        languageType: langConfig.type,
        statusId: executionResult.statusId,
        statusDescription: executionResult.statusDescription,
        output: executionResult.output,
        compileError: executionResult.compileError,
        runtimeError: executionResult.runtimeError,
        time: executionResult.time,
        memory: executionResult.memory,
        isAccepted: executionResult.isAccepted,
      });
    } catch (executionError) {
      const message =
        executionError.publicMessage ||
        executionError.message ||
        "The code execution engine failed. Check your backend configuration and try again.";
      return res.status(502).json({ success: false, message });
    }
  } catch (err) {
    return next(err);
  }
}

module.exports = { execute };
