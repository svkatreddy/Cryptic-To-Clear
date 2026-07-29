const { getLanguageConfig } = require("../config/languages");
const { runCode } = require("../services/openai.service");

/**
 * POST /api/execute
 * Body: { language: string, sourceCode: string, stdin?: string }
 *
 * This endpoint powers both the editor's "Run" and "Compile" actions by
 * executing code using the Groq AI engine.
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

    try {
      const executionResult = await runCode({
        language,
        sourceCode,
        stdin,
      });

      return res.status(200).json({
        success: true,
        language,
        languageType: langConfig ? langConfig.type : "interpreted",
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
        "The code execution engine failed. Check your GROQ_API_KEY in backend/.env and try again.";
      return res.status(502).json({ success: false, message });
    }
  } catch (err) {
    return next(err);
  }
}

module.exports = { execute };
