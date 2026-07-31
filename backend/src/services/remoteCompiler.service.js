const axios = require("axios");
const env = require("../config/env");
const logger = require("../utils/logger");

// Language ID Mapping for Judge0 API
const JUDGE0_LANGUAGE_IDS = {
  c: 50,          // C (GCC 9.2.0)
  cpp: 54,        // C++ (GCC 9.2.0)
  java: 62,       // Java (OpenJDK 13.0.1)
  python: 71,     // Python (3.8.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
};

// Language Name Mapping for Piston API
const PISTON_LANGUAGE_NAMES = {
  c: "c",
  cpp: "c++",
  java: "java",
  python: "python",
  javascript: "javascript",
};

/**
 * Executes code via Judge0 API (RapidAPI or Self-Hosted Docker Instance).
 */
async function executeViaJudge0({ language, sourceCode, stdin = "" }) {
  const langKey = (language || "").toLowerCase();
  const languageId = JUDGE0_LANGUAGE_IDS[langKey];

  if (!languageId) {
    return { isMissingTool: true };
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (env.judge0.apiKey) {
    headers["X-RapidAPI-Key"] = env.judge0.apiKey;
    headers["X-RapidAPI-Host"] = env.judge0.apiHost;
  }

  const url = `${env.judge0.baseUrl}/submissions?wait=true&fields=stdout,stderr,compile_output,status,time,memory`;

  try {
    const response = await axios.post(
      url,
      {
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin || "",
      },
      { headers, timeout: 10000 }
    );

    const data = response.data;
    const statusId = data.status?.id || 3;
    const isAccepted = statusId === 3;

    return {
      statusId,
      statusDescription: data.status?.description || "Success",
      output: (data.stdout || "").trim(),
      compileError: (data.compile_output || "").trim(),
      runtimeError: (data.stderr || "").trim(),
      time: data.time ? `${data.time}s` : "0.05s",
      memory: data.memory ? Math.round(data.memory / 1024) : 8,
      isAccepted,
    };
  } catch (err) {
    logger.warn("Judge0 execution request failed", { error: err.message });
    return { isMissingTool: true };
  }
}

/**
 * Executes code via Piston API (EMKC / Self-Hosted Piston Container).
 */
async function executeViaPiston({ language, sourceCode, stdin = "" }) {
  const langKey = (language || "").toLowerCase();
  const pistonLang = PISTON_LANGUAGE_NAMES[langKey];

  if (!pistonLang) {
    return { isMissingTool: true };
  }

  const url = `${env.piston.baseUrl}/execute`;

  try {
    const response = await axios.post(
      url,
      {
        language: pistonLang,
        version: "*",
        files: [{ content: sourceCode }],
        stdin: stdin || "",
      },
      { timeout: 8000 }
    );

    const runResult = response.data.run || {};
    const hasStderr = Boolean(runResult.stderr && runResult.stderr.trim().length > 0);
    const exitCode = runResult.code ?? 0;

    return {
      statusId: exitCode === 0 && !hasStderr ? 3 : 7,
      statusDescription: exitCode === 0 && !hasStderr ? "Success" : "Runtime Error",
      output: (runResult.stdout || runResult.output || "").trim(),
      compileError: "",
      runtimeError: hasStderr ? runResult.stderr.trim() : "",
      time: "0.05s",
      memory: 12,
      isAccepted: exitCode === 0 && !hasStderr,
    };
  } catch (err) {
    logger.warn("Piston execution request failed", { error: err.message });
    return { isMissingTool: true };
  }
}

module.exports = {
  executeViaJudge0,
  executeViaPiston,
};
