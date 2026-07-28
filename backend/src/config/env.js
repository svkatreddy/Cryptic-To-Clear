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

  // OpenAI connection, used to explain compiler errors.
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    requestTimeoutMs: Number(process.env.OPENAI_TIMEOUT_MS) || 30000,
  },
};

module.exports = env;
