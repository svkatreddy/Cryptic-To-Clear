const axios = require("axios");
const env = require("../config/env");

/**
 * Judge0 status IDs we care about.
 * Full table: https://ce.judge0.com/#statuses-and-languages-status-get
 */
const STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  INTERNAL_ERROR: 13,
  EXECUTION_UNAVAILABLE: 13,
  EXEC_FORMAT_ERROR: 14,
};

// Anything from 7 through 12 is a family of runtime errors (SIGSEGV, SIGFPE,
// NZEC, etc). We treat all of them as "runtime error" for the UI.
const isRuntimeErrorStatus = (id) => id >= 7 && id <= 12;

const isRapidApiConfigured = Boolean(env.judge0.apiKey);
const isLocalJudge0 = env.judge0.apiUrl.includes("localhost") || env.judge0.apiUrl.includes("127.0.0.1");

function isConfigured() {
  return isRapidApiConfigured || isLocalJudge0;
}

const client = axios.create({
  baseURL: env.judge0.apiUrl,
  timeout: env.judge0.requestTimeoutMs,
  headers: {
    "Content-Type": "application/json",
    ...(isRapidApiConfigured
      ? {
          "X-RapidAPI-Key": env.judge0.apiKey,
          "X-RapidAPI-Host": env.judge0.apiHost,
        }
      : {}),
  },
});

const toBase64 = (value = "") =>
  Buffer.from(value ?? "", "utf-8").toString("base64");

const fromBase64 = (value) =>
  value ? Buffer.from(value, "base64").toString("utf-8") : "";

/**
 * Submits source code to Judge0 and waits for the result synchronously
 * (Judge0's `wait=true` flag). Returns a normalized result object so the
 * rest of the backend never has to think about Judge0's raw shape.
 *
 * @param {{ judge0Id: number, sourceCode: string, stdin?: string }} params
 */
async function runSubmission({ judge0Id, sourceCode, stdin = "" }) {
  if (!isRapidApiConfigured && !isLocalJudge0) {
    const err = new Error(
      "Judge0 is not configured. Set JUDGE0_API_KEY for RapidAPI or point JUDGE0_API_URL to a local Judge0 instance."
    );
    err.service = "judge0";
    err.publicMessage =
      "Judge0 is not configured. Set JUDGE0_API_KEY for RapidAPI or point JUDGE0_API_URL to a local Judge0 instance.";
    throw err;
  }

  try {
    const { data } = await client.post(
      "/submissions",
      {
        language_id: judge0Id,
        source_code: toBase64(sourceCode),
        stdin: toBase64(stdin),
      },
      {
        params: {
          base64_encoded: true,
          wait: true,
          fields: "*",
        },
      }
    );

    const statusId = Number(data?.status?.id) || STATUS.INTERNAL_ERROR;

    return {
      statusId,
      statusDescription: data?.status?.description ?? "Unknown status",
      stdout: fromBase64(data?.stdout),
      stderr: fromBase64(data?.stderr),
      compileOutput: fromBase64(data?.compile_output),
      message: fromBase64(data?.message),
      time: data?.time ?? null, // seconds, as a string e.g. "0.012"
      memory: data?.memory ?? null, // kilobytes
      isCompilationError: statusId === STATUS.COMPILATION_ERROR,
      isRuntimeError: isRuntimeErrorStatus(statusId),
      isAccepted: statusId === STATUS.ACCEPTED,
    };
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Execution request failed.";

    return {
      statusId: STATUS.INTERNAL_ERROR,
      statusDescription: "Execution failed",
      stdout: "",
      stderr: "",
      compileOutput: "",
      message,
      time: null,
      memory: null,
      isCompilationError: false,
      isRuntimeError: false,
      isAccepted: false,
    };
  }
}

module.exports = { runSubmission, STATUS, isRuntimeErrorStatus, isConfigured };
