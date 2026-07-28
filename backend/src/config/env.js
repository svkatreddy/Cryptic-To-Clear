require("dotenv").config();

const parseCorsOrigins = (value) => {
  if (!value) {
    return ["http://localhost:3000", "http://127.0.0.1:3000"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const env = {
  port: process.env.PORT || 5000,
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),

  // Judge0 connection. Works with either:
  //  1) A self-hosted Judge0 CE instance (no auth) — just set JUDGE0_API_URL.
  //  2) RapidAPI's hosted Judge0 CE — set JUDGE0_API_URL to the RapidAPI host
  //     and provide JUDGE0_API_KEY / JUDGE0_API_HOST.
  judge0: {
    apiUrl: process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com",
    apiKey: process.env.JUDGE0_API_KEY || "",
    apiHost: process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com",
    // Max time (ms) we wait for Judge0's synchronous response before giving up.
    requestTimeoutMs: Number(process.env.JUDGE0_TIMEOUT_MS) || 20000,
  },

  // AI provider configuration.
  // NVIDIA is the primary provider with Gemini as the fallback.
  nvidia: {
    apiKeys: [
      process.env.NVIDIA_API_KEY,
      process.env.NVIDIA_API_KEY_PRIMARY,
      process.env.NVIDIA_API_KEY_SECONDARY,
    ].filter(Boolean),
    model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3-ultra-550b-a55b",
    baseUrl: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
    requestTimeoutMs: Number(process.env.NVIDIA_TIMEOUT_MS) || 30000,
  },
  gemini: {
    apiKeys: [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_PRIMARY,
      process.env.GEMINI_API_KEY_SECONDARY,
    ].filter(Boolean),
    model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
    baseUrl: process.env.GEMINI_BASE_URL || "https://api.generativeai.google/v1",
    requestTimeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 30000,
  },
};

module.exports = env;
