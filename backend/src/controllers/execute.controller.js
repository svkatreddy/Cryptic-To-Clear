const { getLanguageConfig } = require("../config/languages");
const { executeCodeLocally } = require("../services/localCompiler.service");
const { executeViaJudge0, executeViaPiston } = require("../services/remoteCompiler.service");
const { runCode } = require("../services/openai.service");
const logger = require("../utils/logger");

/**
 * POST /api/execute
 * Body: { language: string, sourceCode: string, stdin?: string }
 *
 * Multi-tiered execution controller:
 * 1. Native Local Compilers (JDK, gcc, etc.)
 * 2. Remote Sandbox Execution APIs (Judge0 & Piston APIs when configured)
 * 3. Groq AI Execution Engine (Instant fallback)
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
    let executionResult;

    // Tier 1: Attempt native local compilation & execution
    try {
      const localResult = await executeCodeLocally({ language, sourceCode, stdin });
      if (!localResult.isMissingTool) {
        executionResult = localResult;
        logger.info("Local compiler execution successful", { language, statusId: executionResult.statusId });
      }
    } catch (localErr) {
      logger.warn("Local compiler execution skipped or failed", { language, error: localErr.message });
    }

    // Tier 2: Attempt remote execution APIs (Judge0 / Piston) if configured
    if (!executionResult) {
      try {
        const judge0Result = await executeViaJudge0({ language, sourceCode, stdin });
        if (!judge0Result.isMissingTool) {
          executionResult = judge0Result;
          logger.info("Judge0 remote execution successful", { language, statusId: executionResult.statusId });
        }
      } catch (jErr) {
        logger.warn("Judge0 execution skipped", { language, error: jErr.message });
      }
    }

    if (!executionResult) {
      try {
        const pistonResult = await executeViaPiston({ language, sourceCode, stdin });
        if (!pistonResult.isMissingTool) {
          executionResult = pistonResult;
          logger.info("Piston remote execution successful", { language, statusId: executionResult.statusId });
        }
      } catch (pErr) {
        logger.warn("Piston execution skipped", { language, error: pErr.message });
      }
    }

    // Tier 3: Fallback to AI Execution Engine if local & remote APIs skipped
    if (!executionResult) {
      logger.info("Running code via Groq AI execution engine", { language });
      executionResult = await runCode({
        language,
        sourceCode,
        stdin,
      });
    }

    return res.status(200).json({
      success: true,
      language,
      languageType: langConfig ? langConfig.type : "interpreted",
      statusId: executionResult.statusId,
      statusDescription: executionResult.statusDescription,
      output: executionResult.output || "",
      compileError: executionResult.compileError || "",
      runtimeError: executionResult.runtimeError || "",
      time: executionResult.time || "0.05s",
      memory: executionResult.memory ?? 8,
      isAccepted: executionResult.isAccepted !== false,
    });
  } catch (err) {
    logger.error("Execution handler uncaught error", { error: err.message });
    const message =
      err.publicMessage ||
      err.message ||
      "The code execution engine failed. Please check your backend service configuration and try again.";
    return res.status(502).json({ success: false, message });
  }
}

module.exports = { execute };
