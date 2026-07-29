require("dotenv").config({ override: true });

const parseCorsOrigins = (value) => {
  if (!value) {
    return ["http://localhost:3000", "http://127.0.0.1:3000"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const filterValidKeys = (keys) =>
  keys
    .filter(Boolean)
    .map((k) => k.trim())
    .filter(
      (k) =>
        !k.toLowerCase().includes("your_") &&
        !k.toLowerCase().includes("placeholder") &&
        k.length > 5
    );

const env = {
  port: process.env.PORT || 5000,
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),

  // AI provider configuration.
  // Groq, NVIDIA, and Gemini supported as providers.
  groq: {
    apiKeys: filterValidKeys([
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY_PRIMARY,
      process.env.GROQ_API_KEY_SECONDARY,
    ]),
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
    requestTimeoutMs: Number(process.env.GROQ_TIMEOUT_MS) || 6000,
  },
  nvidia: {
    apiKeys: filterValidKeys([
      process.env.NVIDIA_API_KEY,
      process.env.NVIDIA_API_KEY_PRIMARY,
      process.env.NVIDIA_API_KEY_SECONDARY,
    ]),
    model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3-ultra-550b-a55b",
    baseUrl: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
    requestTimeoutMs: Number(process.env.NVIDIA_TIMEOUT_MS) || 12000,
  },
  gemini: {
    apiKeys: filterValidKeys([
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_PRIMARY,
      process.env.GEMINI_API_KEY_SECONDARY,
    ]),
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    baseUrl: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
    requestTimeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 12000,
  },
};

module.exports = env;
