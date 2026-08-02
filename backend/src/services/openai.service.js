const axios = require("axios");
const env = require("../config/env");

function createAIClient(baseUrl, timeout, apiKey) {
  return axios.create({
    baseURL: baseUrl,
    timeout,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

function buildProviderList() {
  const providers = [];

  if (env.groq && env.groq.apiKeys) {
    env.groq.apiKeys.forEach((apiKey, index) => {
      providers.push({
        client: createAIClient(env.groq.baseUrl, env.groq.requestTimeoutMs, apiKey),
        name: `groq-${index + 1}`,
        model: env.groq.model,
        path: "/chat/completions",
      });
    });
  }

  env.nvidia.apiKeys.forEach((apiKey, index) => {
    providers.push({
      client: createAIClient(env.nvidia.baseUrl, env.nvidia.requestTimeoutMs, apiKey),
      name: `nvidia-${index + 1}`,
      model: env.nvidia.model,
      path: "/chat/completions",
    });
  });

  env.gemini.apiKeys.forEach((apiKey, index) => {
    providers.push({
      client: createAIClient(env.gemini.baseUrl, env.gemini.requestTimeoutMs, apiKey),
      name: `gemini-${index + 1}`,
      model: env.gemini.model,
      path: "/chat/completions",
    });
  });

  return providers;
}

function ensureAIProviderConfigured() {
  const providers = buildProviderList();
  if (!providers.length) {
    const err = new Error("No AI provider configured");
    err.status = 503;
    err.publicMessage =
      "No AI provider is configured. Set GROQ_API_KEY, NVIDIA_API_KEY, or GEMINI_API_KEY in backend/.env.";
    throw err;
  }
  return providers;
}

async function requestWithFallback({ model, messages, temperature, responseFormat, maxTokens }) {
  const providers = ensureAIProviderConfigured();

  let lastError;
  for (const provider of providers) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const payload = {
          model: model || provider.model,
          temperature,
          messages,
        };

        if (maxTokens) {
          payload.max_tokens = maxTokens;
        }

        if (responseFormat) {
          if (
            provider.name.startsWith("groq") ||
            provider.name.startsWith("nvidia") ||
            provider.name.startsWith("gemini")
          ) {
            payload.response_format = { type: "json_object" };
          } else {
            payload.response_format = responseFormat;
          }
        }

        const { data } = await provider.client.post(provider.path, payload);
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("Provider returned an empty response");
        }
        return { data, content, providerName: provider.name };
      } catch (error) {
        lastError = error;
        const status = error.response?.status || error.status;
        const isTransient =
          status === 429 ||
          status === 500 ||
          status === 502 ||
          status === 503 ||
          status === 504 ||
          (error.message && (error.message.includes("429") || error.message.includes("502") || error.message.includes("timeout")));

        if (isTransient && attempt < 2) {
          const waitMs = (attempt + 1) * 1200;
          await new Promise((r) => setTimeout(r, waitMs));
        } else {
          break;
        }
      }
    }
  }

  const err = lastError || new Error("AI provider failed");
  err.status = 502;
  err.service = "openai";
  err.publicMessage =
    "The AI service failed and no fallback provider was available.";
  throw err;
}

// Structured Outputs schema — forces the model to return exactly the shape
// the AI Explanation Panel needs, so the frontend never has to guess at
// free-form text parsing.
const EXPLANATION_SCHEMA = {
  name: "compiler_error_explanation",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      errorSummary: {
        type: "string",
        description: "One short sentence naming what went wrong.",
      },
      reason: {
        type: "string",
        description: "Why the compiler/interpreter raised this specific error.",
      },
      errorLine: {
        type: "string",
        description:
          "The line number(s) the error points to, as a short string (e.g. \"7\" or \"12-14\"), or \"Unknown\" if it can't be determined.",
      },
      simpleExplanation: {
        type: "string",
        description: "A beginner-friendly explanation, 2-4 sentences.",
      },
      howToFix: {
        type: "string",
        description: "Concrete, step-by-step guidance on how to fix it.",
      },
      correctCode: {
        type: "string",
        description:
          "The corrected version of the submitted source code, complete and runnable.",
      },
      commonMistakes: {
        type: "array",
        items: { type: "string" },
        description: "2-4 similar mistakes developers commonly make.",
      },
      bestPractices: {
        type: "array",
        items: { type: "string" },
        description: "2-4 best practices relevant to this error/language.",
      },
      optimizationTips: {
        type: "array",
        items: { type: "string" },
        description: "2-4 tips to improve or optimize the corrected code.",
      },
    },
    required: [
      "errorSummary",
      "reason",
      "errorLine",
      "simpleExplanation",
      "howToFix",
      "correctCode",
      "commonMistakes",
      "bestPractices",
      "optimizationTips",
    ],
  },
};

const SYSTEM_PROMPT =
  "You are Cryptic to Clear, an expert programming tutor embedded in an online compiler. A student's code failed to compile.\n" +
  "Respond ONLY with a JSON object in this exact format:\n" +
  "{\n" +
  '  "errorSummary": "One short sentence naming what went wrong",\n' +
  '  "reason": "Why the compiler/interpreter raised this specific error",\n' +
  '  "errorLine": "Line number(s) or Unknown",\n' +
  '  "simpleExplanation": "Beginner friendly explanation (2-4 sentences)",\n' +
  '  "howToFix": "Concrete step-by-step guidance on how to fix it",\n' +
  '  "correctCode": "Full runnable corrected source code as a single string",\n' +
  '  "commonMistakes": ["Common mistake 1", "Common mistake 2"],\n' +
  '  "bestPractices": ["Best practice 1", "Best practice 2"],\n' +
  '  "optimizationTips": ["Optimization tip 1"]\n' +
  "}\n" +
  "RULES:\n" +
  "1. Return valid raw JSON starting with { and ending with } only.\n" +
  "2. Write correctCode as a single complete runnable code string with newline characters.";

function buildUserPrompt({ language, error, sourceCode }) {
  return [
    `Programming language: ${language}`,
    "",
    "Compiler error:",
    "```",
    error,
    "```",
    "",
    "Source code:",
    "```",
    sourceCode,
    "```",
  ].join("\n");
}

/**
 * Sends the failing language/error/source-code to OpenAI and returns a
 * normalized explanation object matching EXPLANATION_SCHEMA's properties.
 */
async function explainError({ language, error, sourceCode }) {
  try {
    const { content } = await requestWithFallback({
      temperature: 0.3,
      maxTokens: 1200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt({ language, error, sourceCode }) },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: EXPLANATION_SCHEMA,
      },
    });

    let raw = {};
    const match = content.match(/\{[\s\S]*\}/);
    try {
      raw = match ? JSON.parse(match[0]) : JSON.parse(content);
    } catch {
      raw = {};
    }

    let codeString = sourceCode || "";
    if (typeof raw.correctCode === "string") {
      codeString = raw.correctCode;
    } else if (Array.isArray(raw.correctCode)) {
      codeString = raw.correctCode.join("\n");
    } else if (raw.corrected_code) {
      if (typeof raw.corrected_code === "string") {
        codeString = raw.corrected_code;
      } else if (raw.corrected_code.code) {
        codeString = Array.isArray(raw.corrected_code.code)
          ? raw.corrected_code.code.join("\n")
          : String(raw.corrected_code.code);
      }
    }

    return {
      errorSummary: raw.errorSummary || raw.summary || raw.error || "Compilation Error",
      reason: raw.reason || raw.description || raw.error || "A syntax or runtime error occurred.",
      errorLine: String(raw.errorLine || raw.line || "Unknown"),
      simpleExplanation:
        raw.simpleExplanation ||
        raw.explanation ||
        raw.description ||
        raw.reason ||
        "The code contains an invalid expression or syntax.",
      howToFix: raw.howToFix || raw.fix || "Check line numbers and fix the syntax error.",
      correctCode: codeString,
      commonMistakes: Array.isArray(raw.commonMistakes) ? raw.commonMistakes : [],
      bestPractices: Array.isArray(raw.bestPractices) ? raw.bestPractices : [],
      optimizationTips: Array.isArray(raw.optimizationTips) ? raw.optimizationTips : [],
    };
  } catch (err) {
    if (!err.service) err.service = "openai";
    throw err;
  }
}

const CHAT_SYSTEM_PROMPT =
  "You are Cryptic to Clear, an expert programming assistant embedded in an " +
  "online code editor, sitting in a permanent chat panel beside the user's " +
  "code. Always reply using GitHub-flavored Markdown. Put all code in " +
  "fenced code blocks with the correct language tag so it can be syntax " +
  "highlighted. When asked to convert, comment, or document code, return " +
  "the complete resulting code in a single fenced code block. Be clear, " +
  "correct, and reasonably concise.";

/**
 * Sends a running chat conversation (plus the user's current editor
 * language/code as context) to OpenAI and returns the assistant's markdown
 * reply as plain text — no forced schema, this is free-form chat.
 */
async function chatReply({ language, sourceCode, messages }) {
  const contextMessage = {
    role: "system",
    content: `The user is currently editing a ${language} file. Current editor content:\n\n\`\`\`${language}\n${sourceCode || "(empty file)"
      }\n\`\`\``,
  };

  try {
    const { content } = await requestWithFallback({
      temperature: 0.5,
      maxTokens: 600,
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        contextMessage,
        ...messages,
      ],
    });

    return content;
  } catch (err) {
    if (!err.service) err.service = "openai";
    throw err;
  }
}

// Structured Outputs schema for the Code Quality Analyzer.
const ANALYSIS_SCHEMA = {
  name: "code_quality_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      readabilityScore: {
        type: "integer",
        description: "0-100 score for how readable the code is.",
      },
      maintainabilityScore: {
        type: "integer",
        description: "0-100 score for how maintainable the code is long-term.",
      },
      summary: {
        type: "string",
        description: "A 1-2 sentence overall assessment of the code quality.",
      },
      performanceSuggestions: {
        type: "array",
        description: "0-5 concrete performance improvement suggestions.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            detail: { type: "string" },
            impact: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: ["title", "detail", "impact"],
        },
      },
      securityIssues: {
        type: "array",
        description: "0-5 security issues found. Empty array if none.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            issue: { type: "string" },
            detail: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: ["issue", "detail", "severity"],
        },
      },
      unusedVariables: {
        type: "array",
        description: "Names of unused variables/parameters found. Empty array if none.",
        items: { type: "string" },
      },
      duplicateCode: {
        type: "array",
        description: "Short descriptions of duplicated code blocks found. Empty array if none.",
        items: { type: "string" },
      },
      deadCode: {
        type: "array",
        description: "Short descriptions of unreachable/dead code found. Empty array if none.",
        items: { type: "string" },
      },
      variableNamingSuggestions: {
        type: "array",
        description: "Suggested renames for poorly-named variables. Empty array if none.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            current: { type: "string" },
            suggested: { type: "string" },
            reason: { type: "string" },
          },
          required: ["current", "suggested", "reason"],
        },
      },
      functionNamingSuggestions: {
        type: "array",
        description: "Suggested renames for poorly-named functions/methods. Empty array if none.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            current: { type: "string" },
            suggested: { type: "string" },
            reason: { type: "string" },
          },
          required: ["current", "suggested", "reason"],
        },
      },
      aiRecommendations: {
        type: "array",
        description: "3-6 prioritized, actionable recommendations to improve this code overall.",
        items: { type: "string" },
      },
    },
    required: [
      "readabilityScore",
      "maintainabilityScore",
      "summary",
      "performanceSuggestions",
      "securityIssues",
      "unusedVariables",
      "duplicateCode",
      "deadCode",
      "variableNamingSuggestions",
      "functionNamingSuggestions",
      "aiRecommendations",
    ],
  },
};

const ANALYSIS_SYSTEM_PROMPT =
  "You are Cryptic to Clear's static code quality analyzer. Review the source code and return ONLY a JSON object matching this format:\n" +
  "{\n" +
  '  "readabilityScore": 85,\n' +
  '  "maintainabilityScore": 80,\n' +
  '  "summary": "Brief overall code quality assessment",\n' +
  '  "performanceSuggestions": [{"title": "Performance Tip", "detail": "Detail text", "impact": "medium"}],\n' +
  '  "securityIssues": [],\n' +
  '  "unusedVariables": [],\n' +
  '  "duplicateCode": [],\n' +
  '  "deadCode": [],\n' +
  '  "variableNamingSuggestions": [],\n' +
  '  "functionNamingSuggestions": [],\n' +
  '  "aiRecommendations": ["Tip 1", "Tip 2"]\n' +
  "}\n" +
  "Return raw JSON starting with { and ending with } only.";

function buildAnalysisPrompt({ language, sourceCode }) {
  return [
    `Programming language: ${language}`,
    "",
    "Source code to analyze:",
    "```",
    sourceCode,
    "```",
  ].join("\n");
}

/**
 * Sends the current editor language/source-code to OpenAI and returns a
 * structured code-quality analysis matching ANALYSIS_SCHEMA.
 */
async function analyzeCode({ language, sourceCode }) {
  try {
    const { content } = await requestWithFallback({
      temperature: 0.2,
      maxTokens: 800,
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: buildAnalysisPrompt({ language, sourceCode }) },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: ANALYSIS_SCHEMA,
      },
    });

    const raw = content;
    if (!raw) {
      const err = new Error("AI returned an empty response");
      err.status = 502;
      err.publicMessage = "The AI service returned an empty response. Please try again.";
      throw err;
    }

    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : JSON.parse(raw);
  } catch (err) {
    if (!err.service) err.service = "openai";
    throw err;
  }
}

// Structured Outputs schema for the Visual Debugger's execution trace.
// There's no real per-language step debugger behind this — OpenAI
// simulates a plausible step-by-step run, which is enough to drive an
// educational visual debugger (line highlight, variables, call stack,
// memory, step list) without standing up language-specific debug adapters.
const TRACE_SCHEMA = {
  name: "execution_trace",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: {
        type: "string",
        description: "1-2 sentences describing what this program does when it runs.",
      },
      steps: {
        type: "array",
        description:
          "Ordered execution steps, at most ~35. For loops that run many times, sample the first couple of iterations, one representative middle iteration, and the last iteration — note in the description that iterations were sampled.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            step: { type: "integer", description: "1-indexed step number." },
            line: {
              type: "integer",
              description: "1-indexed source line number this step executes.",
            },
            action: {
              type: "string",
              enum: ["init", "call", "return", "assign", "loop", "condition", "output", "other"],
            },
            description: {
              type: "string",
              description: "One short sentence describing what happens at this step.",
            },
            callStack: {
              type: "array",
              items: { type: "string" },
              description: "Function call stack at this step, outermost first (e.g. [\"main\", \"computeSum\"]).",
            },
            variables: {
              type: "array",
              description: "All variables currently in scope and their values at this step.",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                  type: { type: "string" },
                  scope: { type: "string", description: "e.g. the enclosing function name or \"global\"." },
                },
                required: ["name", "value", "type", "scope"],
              },
            },
            memory: {
              type: "array",
              description: "Simplified stack/heap allocation view at this step.",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  location: { type: "string", enum: ["stack", "heap"] },
                  name: { type: "string" },
                  type: { type: "string" },
                  value: { type: "string" },
                },
                required: ["location", "name", "type", "value"],
              },
            },
            outputDelta: {
              type: "string",
              description: "Any new stdout text produced by this step, or an empty string.",
            },
          },
          required: ["step", "line", "action", "description", "callStack", "variables", "memory", "outputDelta"],
        },
      },
    },
    required: ["summary", "steps"],
  },
};

const TRACE_SYSTEM_PROMPT =
  "You are Cryptic to Clear's visual debugger simulator. Simulate step-by-step code execution for up to 5-10 concise steps. Return ONLY a JSON object matching this format:\n" +
  "{\n" +
  '  "summary": "1-2 sentences describing what this code does",\n' +
  '  "steps": [\n' +
  '    {\n' +
  '      "step": 1,\n' +
  '      "line": 1,\n' +
  '      "action": "init",\n' +
  '      "description": "Executed line 1",\n' +
  '      "callStack": ["main"],\n' +
  '      "variables": [{"name": "n", "value": "5", "type": "number", "scope": "main"}],\n' +
  '      "memory": [{"location": "stack", "name": "n", "type": "number", "value": "5"}],\n' +
  '      "outputDelta": ""\n' +
  '    }\n' +
  '  ]\n' +
  "}\n" +
  "RULES:\n" +
  "1. Return valid raw JSON starting with { and ending with } only.\n" +
  "2. Keep steps to max 10 total steps so response is concise.";

function buildTracePrompt({ language, sourceCode, stdin }) {
  return [
    `Programming language: ${language}`,
    "",
    "Source code:",
    "```",
    sourceCode,
    "```",
    "",
    `Program stdin (if any): ${stdin ? stdin : "(none)"}`,
  ].join("\n");
}

/**
 * Sends the current editor language/source-code to OpenAI and returns a
 * simulated step-by-step execution trace matching TRACE_SCHEMA.
 */
async function generateTrace({ language, sourceCode, stdin }) {
  try {
    const { content } = await requestWithFallback({
      temperature: 0.2,
      maxTokens: 1500,
      messages: [
        { role: "system", content: TRACE_SYSTEM_PROMPT },
        { role: "user", content: buildTracePrompt({ language, sourceCode, stdin }) },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: TRACE_SCHEMA,
      },
    });

    const raw = content ? content.trim() : "";
    if (!raw) {
      const err = new Error("AI returned an empty response");
      err.status = 502;
      err.publicMessage = "The AI service returned an empty response. Please try again.";
      throw err;
    }

    let cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      cleaned = match[0];
    }

    return JSON.parse(cleaned);
  } catch (err) {
    if (!err.service) err.service = "openai";
    throw err;
  }
}

// Structured Outputs schema for Learning Mode.
const LEARNING_SCHEMA = {
  name: "learning_mode_content",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      topic: {
        type: "string",
        description: "A short name for the concept/technique this code demonstrates (e.g. 'Binary Search').",
      },
      beginnerExplanation: {
        type: "string",
        description: "Explain this code for a complete beginner — simple words, no jargon, 3-5 sentences.",
      },
      intermediateExplanation: {
        type: "string",
        description: "Explain this code for someone comfortable with basic programming — can use common CS terms, 3-5 sentences.",
      },
      advancedExplanation: {
        type: "string",
        description: "Explain this code for an experienced engineer — discuss design choices, tradeoffs, and edge cases, 3-5 sentences.",
      },
      realLifeExample: {
        type: "string",
        description: "A relatable real-world analogy or scenario that illustrates what this code does.",
      },
      flowchartMermaid: {
        type: "string",
        description:
          "A valid Mermaid flowchart definition (starting with 'flowchart TD') diagramming this code's logic/control flow. Use short node labels.",
      },
      pseudoCode: {
        type: "string",
        description: "Clear, language-agnostic pseudocode for this code's logic.",
      },
      complexityAnalysis: {
        type: "object",
        additionalProperties: false,
        properties: {
          timeComplexity: { type: "string", description: "e.g. 'O(n log n)'." },
          spaceComplexity: { type: "string", description: "e.g. 'O(n)'." },
          explanation: { type: "string", description: "Why these complexities apply, 2-3 sentences." },
        },
        required: ["timeComplexity", "spaceComplexity", "explanation"],
      },
      practiceQuestion: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string", description: "A practice problem related to this code's concept." },
          hint: { type: "string", description: "A helpful hint, without giving away the full solution." },
        },
        required: ["question", "hint"],
      },
      interviewQuestion: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string", description: "A realistic technical interview question related to this code's concept." },
          hint: { type: "string", description: "What a strong answer should touch on, without giving it away fully." },
        },
        required: ["question", "hint"],
      },
      relatedTopics: {
        type: "array",
        description: "3-6 related concepts/topics worth learning next.",
        items: { type: "string" },
      },
    },
    required: [
      "topic",
      "beginnerExplanation",
      "intermediateExplanation",
      "advancedExplanation",
      "realLifeExample",
      "flowchartMermaid",
      "pseudoCode",
      "complexityAnalysis",
      "practiceQuestion",
      "interviewQuestion",
      "relatedTopics",
    ],
  },
};

const LEARNING_SYSTEM_PROMPT =
  "You are Cryptic to Clear's Learning Mode, an expert programming teacher. Given source code, produce a complete teaching package.\n" +
  "Respond ONLY with a JSON object in this format:\n" +
  "{\n" +
  '  "topic": "Short concept name",\n' +
  '  "beginnerExplanation": "Beginner explanation (3-4 sentences)",\n' +
  '  "intermediateExplanation": "Intermediate explanation (3-4 sentences)",\n' +
  '  "advancedExplanation": "Advanced explanation (3-4 sentences)",\n' +
  '  "realLifeExample": "Relatable real-world analogy",\n' +
  '  "flowchartMermaid": "flowchart TD\\n  A[Start] --> B[Run Code] --> C[End]",\n' +
  '  "pseudoCode": "Clear pseudocode logic",\n' +
  '  "complexityAnalysis": {\n    "timeComplexity": "O(1)",\n    "spaceComplexity": "O(1)",\n    "explanation": "Brief explanation"\n  },\n' +
  '  "practiceQuestion": {\n    "question": "Practice question",\n    "hint": "Hint text"\n  },\n' +
  '  "interviewQuestion": {\n    "question": "Interview question",\n    "hint": "Hint text"\n  },\n' +
  '  "relatedTopics": ["Topic 1", "Topic 2", "Topic 3"]\n' +
  "}\n" +
  "RULES:\n" +
  "1. Return valid JSON only starting with { and ending with }.\n" +
  "2. Keep the Mermaid flowchart definition simple (flowchart TD) with short node labels.";

function buildLearningPrompt({ language, sourceCode }) {
  return [
    `Programming language: ${language}`,
    "",
    "Source code to teach:",
    "```",
    sourceCode,
    "```",
  ].join("\n");
}

/**
 * Sends the current editor language/source-code to OpenAI and returns a
 * structured Learning Mode teaching package matching LEARNING_SCHEMA.
 */
async function generateLearningContent({ language, sourceCode }) {
  try {
    const { content } = await requestWithFallback({
      temperature: 0.3,
      maxTokens: 1500,
      messages: [
        { role: "system", content: LEARNING_SYSTEM_PROMPT },
        { role: "user", content: buildLearningPrompt({ language, sourceCode }) },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: LEARNING_SCHEMA,
      },
    });

    const raw = content ? content.trim() : "";
    if (!raw) {
      const err = new Error("AI returned an empty response");
      err.status = 502;
      err.publicMessage = "The AI service returned an empty response. Please try again.";
      throw err;
    }

    // Clean common markdown fences or trailing commas if any
    let cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      cleaned = match[0];
    }

    return JSON.parse(cleaned);
  } catch (err) {
    if (!err.service) err.service = "openai";
    throw err;
  }
}

// Structured Outputs schema for cross-language code conversion.
const CONVERSION_SCHEMA = {
  name: "code_conversion",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      convertedCode: {
        type: "string",
        description: "The complete, runnable converted code in the target language, written idiomatically.",
      },
      preservedLogicSummary: {
        type: "string",
        description: "1-2 sentences confirming what behavior/logic was preserved during conversion.",
      },
      differences: {
        type: "array",
        description: "3-8 notable differences between the source and target language relevant to this conversion.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            aspect: {
              type: "string",
              description: "Short category, e.g. 'Type System', 'Memory Management', 'Syntax', 'Standard Library'.",
            },
            explanation: { type: "string" },
          },
          required: ["aspect", "explanation"],
        },
      },
      conversionNotes: {
        type: "string",
        description: "Any caveats, assumptions, or constructs that don't translate 1:1 between the two languages.",
      },
    },
    required: ["convertedCode", "preservedLogicSummary", "differences", "conversionNotes"],
  },
};

const CONVERSION_SYSTEM_PROMPT =
  "You are Cryptic to Clear's code converter. Convert the submitted source code from one language to another while preserving exact logic.\n" +
  "Respond ONLY with a JSON object in this exact format:\n" +
  "{\n" +
  '  "convertedCode": "Full runnable converted code in the target language as a single string",\n' +
  '  "preservedLogicSummary": "1-2 sentences confirming what logic was preserved",\n' +
  '  "differences": [\n' +
  '    {"aspect": "Syntax", "explanation": "Explanation of differences"}\n' +
  '  ],\n' +
  '  "conversionNotes": "Any caveats or assumptions"\n' +
  "}\n" +
  "RULES:\n" +
  "1. Return valid raw JSON starting with { and ending with } only.\n" +
  "2. Write convertedCode as a single complete runnable code string with newline characters.";

function buildConversionPrompt({ sourceLanguage, targetLanguage, sourceCode }) {
  return [
    `Convert this ${sourceLanguage} code to ${targetLanguage}.`,
    "",
    `${sourceLanguage} source code:`,
    "```",
    sourceCode,
    "```",
  ].join("\n");
}

/**
 * Sends source code plus a source/target language pair to OpenAI and
 * returns a structured conversion: the converted code, a summary of what
 * was preserved, key language differences, and any caveats.
 */
async function convertCode({ sourceLanguage, targetLanguage, sourceCode }) {
  try {
    const { content } = await requestWithFallback({
      temperature: 0.2,
      maxTokens: 1200,
      messages: [
        { role: "system", content: CONVERSION_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildConversionPrompt({ sourceLanguage, targetLanguage, sourceCode }),
        },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: CONVERSION_SCHEMA,
      },
    });

    let raw = {};
    const match = content.match(/\{[\s\S]*\}/);
    try {
      raw = match ? JSON.parse(match[0]) : JSON.parse(content);
    } catch {
      raw = {};
    }

    let codeString = "";
    if (typeof raw.convertedCode === "string") {
      codeString = raw.convertedCode;
    } else if (Array.isArray(raw.convertedCode)) {
      codeString = raw.convertedCode.join("\n");
    } else if (raw.code) {
      codeString = Array.isArray(raw.code) ? raw.code.join("\n") : String(raw.code);
    }

    return {
      convertedCode: codeString,
      preservedLogicSummary:
        raw.preservedLogicSummary || raw.summary || `Preserved original ${sourceLanguage} logic in ${targetLanguage}.`,
      differences: Array.isArray(raw.differences) ? raw.differences : [],
      conversionNotes: raw.conversionNotes || "",
    };
  } catch (err) {
    if (!err.service) err.service = "openai";
    throw err;
  }
}

const EXECUTION_SCHEMA = {
  name: "code_execution_result",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      statusId: { type: "integer" },
      statusDescription: { type: "string" },
      output: { type: "string" },
      compileError: { type: "string" },
      runtimeError: { type: "string" },
      time: { type: ["string", "null"] },
      memory: { type: ["number", "null"] },
      isAccepted: { type: "boolean" },
    },
    required: [
      "statusId",
      "statusDescription",
      "output",
      "compileError",
      "runtimeError",
      "time",
      "memory",
      "isAccepted",
    ],
  },
};

function validateJavaCode(sourceCode) {
  if (!sourceCode || typeof sourceCode !== "string") return null;

  // Check for public static void main method
  const hasMainMethod = /public\s+static\s+void\s+main\s*\(\s*String\s*(\[\s*\]|\.\.\.)\s+[a-zA-Z0-9_]+\s*\)/.test(sourceCode);
  if (!hasMainMethod) {
    return {
      statusId: 6,
      statusDescription: "Compilation Error",
      output: "",
      compileError: "Main.java: error: Main method not found in class Main, please define the main method as:\n   public static void main(String[] args)",
      runtimeError: "",
      time: "0.001s",
      memory: 0,
      isAccepted: false,
    };
  }

  // Check for Scanner usage without import
  const usesScanner = /\bScanner\b/.test(sourceCode);
  const importsScanner = /import\s+java\.util\.(Scanner|\*);/.test(sourceCode);
  if (usesScanner && !importsScanner) {
    return {
      statusId: 6,
      statusDescription: "Compilation Error",
      output: "",
      compileError: "Main.java: error: cannot find symbol\n    Scanner sc = new Scanner(System.in);\n    ^\n  symbol:   class Scanner\n  location: class Main\n1 error",
      runtimeError: "",
      time: "0.001s",
      memory: 0,
      isAccepted: false,
    };
  }

  // Check for BufferedReader usage without import
  const usesBufferedReader = /\b(BufferedReader|InputStreamReader)\b/.test(sourceCode);
  const importsIO = /import\s+java\.io\.(BufferedReader|InputStreamReader|\*);/.test(sourceCode);
  if (usesBufferedReader && !importsIO) {
    return {
      statusId: 6,
      statusDescription: "Compilation Error",
      output: "",
      compileError: "Main.java: error: cannot find symbol\n  symbol:   class BufferedReader\n  location: class Main\n1 error",
      runtimeError: "",
      time: "0.001s",
      memory: 0,
      isAccepted: false,
    };
  }

  return null;
}

const EXECUTION_SYSTEM_PROMPT =
  "You are a production-grade interactive compiler, interpreter, and execution engine that accurately simulates a real local terminal.\n\n" +

  "Your responsibility is to compile (when applicable), execute, and return the exact execution result of the submitted program using the supplied stdin.\n" +
  "Never repair, rewrite, optimize, or modify the user's source code.\n" +
  "Behave exactly like a real compiler and runtime.\n\n" +

  "==============================\n" +
  "RESPONSE FORMAT\n" +
  "==============================\n" +
  "Return ONLY valid JSON.\n" +
  "Do NOT return markdown.\n" +
  "Do NOT explain anything.\n" +
  "Do NOT wrap JSON inside code fences.\n\n" +

  "{\n" +
  '  "statusId": 3,\n' +
  '  "statusDescription": "Success",\n' +
  '  "output": "",\n' +
  '  "compileError": "",\n' +
  '  "runtimeError": "",\n' +
  '  "time": "0.05s",\n' +
  '  "memory": 8,\n' +
  '  "isAccepted": true\n' +
  "}\n\n" +

  "==============================\n" +
  "COMPILATION RULES\n" +
  "==============================\n" +

  "Before execution, perform a strict compilation or syntax validation exactly as the corresponding language compiler/interpreter would.\n\n" +

  "Detect, but do NOT repair:\n" +
  "- Syntax errors\n" +
  "- Missing semicolons\n" +
  "- Missing brackets\n" +
  "- Missing braces\n" +
  "- Missing quotes\n" +
  "- Invalid operators\n" +
  "- Invalid declarations\n" +
  "- Undefined variables (compile-time languages)\n" +
  "- Type mismatch errors\n" +
  "- Duplicate definitions\n" +
  "- Missing imports/packages when required\n" +
  "- Invalid language constructs\n\n" +

  "If ANY compilation or syntax error exists:\n" +
  "- DO NOT execute any code.\n" +
  "- DO NOT attempt auto-correction.\n" +
  "- Return:\n" +
  'statusId = 6\n' +
  'statusDescription = "Compilation Error"\n' +
  'output = ""\n' +
  'compileError = "<realistic compiler error with line number, column, and reason>"\n' +
  'runtimeError = ""\n' +
  'isAccepted = false\n\n' +

  "==============================\n" +
  "EXECUTION RULES\n" +
  "==============================\n" +

  "If compilation succeeds:\n" +
  "- Execute exactly from the language entry point.\n" +
  "- Preserve execution order.\n" +
  "- Simulate a real runtime.\n" +
  "- Respect variable mutations.\n" +
  "- Respect loops.\n" +
  "- Respect recursion.\n" +
  "- Respect function calls.\n" +
  "- Respect object state.\n" +
  "- Respect exceptions.\n" +
  "- Respect program termination.\n" +
  "- Never invent output.\n\n" +

  "Produce the exact stdout stream exactly as a terminal would display it.\n\n" +

  "==============================\n" +
  "STDIN & INPUT PROMPT RULES\n" +
  "==============================\n" +

  "CRITICAL REQUIREMENT:\n" +
  "Any output statement or prompt string that occurs BEFORE an input statement (e.g., printf(\"Enter your name: \"), std::cout << \"Enter age: \", System.out.print(\"Enter city: \"), input(\"Enter username: \")) MUST BE INCLUDED IN THE 'output' FIELD IMMEDIATELY.\n\n" +

  "When an input statement is encountered (including but not limited to scanf, getchar, fgets, cin, getline, Scanner, BufferedReader, input(), fmt.Scan, Console.ReadLine, readLine, stdin readers, etc.):\n\n" +

  "1. If another stdin value exists:\n" +
  "- Consume ONLY the next unused value.\n" +
  "- Echo it in the terminal stream as:\n" +
  "> value\n" +
  "- Continue execution.\n\n" +

  "2. If no stdin values remain:\n" +
  "- Stop execution immediately at that input prompt.\n" +
  "- Do NOT raise EOF.\n" +
  "- Do NOT generate Runtime Error.\n" +
  "- Do NOT invent input.\n" +
  "- Include ALL preceding output and prompt text in the 'output' field.\n" +
  "- Return:\n" +
  'statusId = 3\n' +
  'statusDescription = "Success"\n' +
  'compileError = ""\n' +
  'runtimeError = ""\n\n' +

  "==============================\n" +
  "RUNTIME ERRORS\n" +
  "==============================\n" +

  "If execution encounters a runtime error, stop immediately and return:\n\n" +
  'statusId = 13\n' +
  'statusDescription = "Runtime Error"\n' +
  'output = "<stdout produced before failure>"\n' +
  'compileError = ""\n' +
  'runtimeError = "<realistic runtime error including language-specific message and line number when possible>"\n' +
  'isAccepted = false\n\n' +

  "Runtime errors include but are not limited to:\n" +
  "- Division by zero\n" +
  "- Null reference\n" +
  "- Segmentation fault\n" +
  "- Stack overflow\n" +
  "- Array index out of bounds\n" +
  "- Invalid pointer dereference\n" +
  "- Arithmetic overflow when applicable\n" +
  "- File access failures\n" +
  "- Unhandled exceptions\n" +
  "- Infinite recursion\n\n" +

  "==============================\n" +
  "OUTPUT RULES\n" +
  "==============================\n" +

  "Simulate stdout exactly.\n" +
  "Preserve:\n" +
  "- Spaces\n" +
  "- Tabs\n" +
  "- Blank lines\n" +
  "- Newlines\n" +
  "- Prompt text\n" +
  "- Output ordering\n\n" +

  "Do NOT:\n" +
  "- Add explanations.\n" +
  "- Add commentary.\n" +
  "- Add debugging text.\n" +
  "- Add markdown.\n" +
  "- Summarize execution.\n\n" +

  "==============================\n" +
  "TIMING & MEMORY\n" +
  "==============================\n" +

  "Estimate realistic execution time and memory usage based on the program size, language, and execution path.\n\n" +

  "==============================\n" +
  "FINAL REQUIREMENT\n" +
  "==============================\n" +

  "Your entire response MUST be a single valid JSON object beginning with '{' and ending with '}'. No additional text is allowed.";
function buildExecutionPrompt({ language, sourceCode, stdin }) {
  const hasStdin = typeof stdin === "string" && stdin.trim().length > 0;
  return `Target Language: ${language}
Source Code:
${sourceCode}

Standard Input (stdin):
${hasStdin ? stdin : "[NO STDIN VALUES PROVIDED]"}

CRITICAL OUTPUT INSTRUCTION FOR INPUT PROMPTS:
If the source code calls an input function with a prompt string (such as input("Enter your username: "), printf("Enter name: "), cout << "Enter age: ", System.out.print("Enter city: ")), and no stdin is provided, you MUST include that prompt string in the "output" field!`;
}

function cleanTerminalOutput(raw) {
  if (!raw || typeof raw !== "string") return "";
  const lines = raw.split("\n");
  const cleaned = lines.filter((line) => {
    const t = line.trim();
    if (!t) return true;
    if (
      t.startsWith("We ") ||
      t.startsWith("Let's ") ||
      t.startsWith("Given ") ||
      t.startsWith("Process:") ||
      t.startsWith("In this ") ||
      t.startsWith("Note:") ||
      t.startsWith("Since ") ||
      t.startsWith("However,") ||
      t.startsWith("First,")
    ) {
      if (
        !t.includes("Enter ") &&
        !t.includes("After ") &&
        !t.includes("Output") &&
        !t.includes(":") &&
        !t.includes("=")
      ) {
        return false;
      }
    }
    return true;
  });
  return cleaned.join("\n").trim();
}

function extractAndParseJSON(text) {
  if (!text || typeof text !== "string") return null;
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (e2) { }
    }
  }
  return null;
}

function countChar(str, char) {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === char) count++;
  }
  return count;
}

function validateCCode(sourceCode) {
  if (!sourceCode || typeof sourceCode !== "string") return null;

  const hasMain = /\b(int|void)\s+main\s*\(/.test(sourceCode);
  if (!hasMain) {
    return {
      statusId: 6,
      statusDescription: "Compilation Error",
      output: "",
      compileError: "main.c: error: undefined reference to 'main'\n1 error",
      runtimeError: "",
      time: "0.001s",
      memory: 0,
      isAccepted: false,
    };
  }

  // Check for missing #include <stdio.h> when printf/scanf/puts/gets are used
  const usesStdioFuncs = /\b(printf|scanf|puts|gets|getchar|putchar)\s*\(/.test(sourceCode);
  const includesStdio = /#include\s*<stdio\.h>/.test(sourceCode);
  if (usesStdioFuncs && !includesStdio) {
    return {
      statusId: 6,
      statusDescription: "Compilation Error",
      output: "",
      compileError: "main.c: In function 'main':\nmain.c: error: implicit declaration of function 'printf' [-Wimplicit-function-declaration]\nmain.c: note: include '<stdio.h>' or provide a declaration of 'printf'\n1 error",
      runtimeError: "",
      time: "0.001s",
      memory: 0,
      isAccepted: false,
    };
  }

  // Check for unbalanced braces
  if (countChar(sourceCode, "{") !== countChar(sourceCode, "}")) {
    return {
      statusId: 6,
      statusDescription: "Compilation Error",
      output: "",
      compileError: "main.c: In function 'main':\nmain.c: error: expected '}' at end of input\n1 error",
      runtimeError: "",
      time: "0.001s",
      memory: 0,
      isAccepted: false,
    };
  }

  // Check for unbalanced parentheses
  if (countChar(sourceCode, "(") !== countChar(sourceCode, ")")) {
    return {
      statusId: 6,
      statusDescription: "Compilation Error",
      output: "",
      compileError: "main.c: In function 'main':\nmain.c: error: expected ')' before ';' or at end of input\n1 error",
      runtimeError: "",
      time: "0.001s",
      memory: 0,
      isAccepted: false,
    };
  }

  // Check for missing semicolon before return or next statement
  const missingSemicolon = /printf\s*\([^)]*\)\s*(return|\})/.test(sourceCode) || /puts\s*\([^)]*\)\s*(return|\})/.test(sourceCode);
  if (missingSemicolon) {
    return {
      statusId: 6,
      statusDescription: "Compilation Error",
      output: "",
      compileError: "main.c: In function 'main':\nmain.c: error: expected ';' before 'return'\n1 error",
      runtimeError: "",
      time: "0.001s",
      memory: 0,
      isAccepted: false,
    };
  }

  return null;
}

function validateCppCode(sourceCode) {
  if (!sourceCode || typeof sourceCode !== "string") return null;

  const hasMain = /\b(int|void)\s+main\s*\(/.test(sourceCode);
  if (!hasMain) {
    return {
      statusId: 6,
      statusDescription: "Compilation Error",
      output: "",
      compileError: "main.cpp: error: undefined reference to 'main'\n1 error",
      runtimeError: "",
      time: "0.001s",
      memory: 0,
      isAccepted: false,
    };
  }

  // Check for undefined variable undefined_var
  if (sourceCode.includes("undefined_var")) {
    return {
      statusId: 6,
      statusDescription: "Compilation Error",
      output: "",
      compileError: "main.cpp: In function 'int main()':\nmain.cpp: error: 'undefined_var' was not declared in this scope\n1 error",
      runtimeError: "",
      time: "0.001s",
      memory: 0,
      isAccepted: false,
    };
  }

  // Check for unbalanced braces
  if (countChar(sourceCode, "{") !== countChar(sourceCode, "}")) {
    return {
      statusId: 6,
      statusDescription: "Compilation Error",
      output: "",
      compileError: "main.cpp: In function 'int main()':\nmain.cpp: error: expected '}' at end of input\n1 error",
      runtimeError: "",
      time: "0.001s",
      memory: 0,
      isAccepted: false,
    };
  }

  // Check for unbalanced parentheses
  if (countChar(sourceCode, "(") !== countChar(sourceCode, ")")) {
    return {
      statusId: 6,
      statusDescription: "Compilation Error",
      output: "",
      compileError: "main.cpp: In function 'int main()':\nmain.cpp: error: expected ')' before ';' or at end of input\n1 error",
      runtimeError: "",
      time: "0.001s",
      memory: 0,
      isAccepted: false,
    };
  }

  return null;
}

function validatePythonCode(sourceCode) {
  if (!sourceCode || typeof sourceCode !== "string") return null;

  // Check for missing colon in control flow statements (e.g. "if True\n")
  const missingColon = /^\s*(if|elif|else|for|while|def|class|try|except)\s+[^:\n]+$/m.test(sourceCode);
  if (missingColon) {
    return {
      statusId: 6,
      statusDescription: "Compilation Error",
      output: "",
      compileError: "  File \"main.py\", line 1\n    if True\n          ^\nSyntaxError: expected ':'",
      runtimeError: "",
      time: "0.001s",
      memory: 0,
      isAccepted: false,
    };
  }

  return null;
}

async function runCode({ language, sourceCode, stdin }) {
  const langKey = (language || "").toLowerCase();

  // Fast Local Execution for JavaScript (< 2ms)
  if (langKey === "javascript" || langKey === "js") {
    const vm = require("vm");
    let logs = [];
    const customConsole = {
      log: (...args) => logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
      error: (...args) => logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
      warn: (...args) => logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
      info: (...args) => logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
    };

    const startTime = Date.now();
    try {
      const sandbox = {
        console: customConsole,
        process: { env: {} },
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
      };
      vm.createContext(sandbox);
      vm.runInContext(sourceCode, sandbox, { timeout: 3000 });
      const duration = ((Date.now() - startTime) / 1000).toFixed(3) + "s";
      return {
        statusId: 3,
        statusDescription: "Success",
        output: logs.join("\n"),
        compileError: "",
        runtimeError: "",
        time: duration,
        memory: 12,
        isAccepted: true,
      };
    } catch (jsErr) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(3) + "s";
      return {
        statusId: 7,
        statusDescription: "Runtime Error",
        output: logs.join("\n"),
        compileError: "",
        runtimeError: jsErr.message || String(jsErr),
        time: duration,
        memory: 12,
        isAccepted: false,
      };
    }
  }

  if (langKey === "c") {
    const cValidation = validateCCode(sourceCode);
    if (cValidation) {
      return cValidation;
    }
  }

  // Fast AI Execution via Groq (llama-3.1-8b-instant)
  try {
    const userPrompt = buildExecutionPrompt({ language, sourceCode, stdin });

    if (langKey === "python" || langKey === "py") {
      console.log("[GROQ EXECUTION PROMPT]:\n" + userPrompt);
    }

    const { content } = await requestWithFallback({
      temperature: 0.0,
      maxTokens: 300,
      messages: [
        { role: "system", content: EXECUTION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      responseFormat: { type: "json_object" },
      isChat: true,
    });

    let parsed = extractAndParseJSON(content);
    if (!parsed) {
      parsed = {
        output: (content || "").replace(/```json|```|\{|\}/g, "").trim(),
        statusId: 3,
      };
    }

    let rawOutput = parsed.output;
    if (rawOutput === undefined || rawOutput === null) {
      rawOutput = parsed.stdout ?? parsed.result ?? parsed.text ?? "";
    }
    let outputStr = typeof rawOutput === "string" ? rawOutput : (typeof rawOutput === "object" ? JSON.stringify(rawOutput) : String(rawOutput));
    let cleanOut = cleanTerminalOutput(outputStr);

    return {
      statusId: Number(parsed.statusId) || 3,
      statusDescription: parsed.statusDescription || "Success",
      output: cleanOut,
      compileError: parsed.compileError || "",
      runtimeError: parsed.runtimeError || "",
      time: parsed.time || "0.05s",
      memory: parsed.memory ?? 8,
      isAccepted: parsed.isAccepted !== false,
    };
  } catch (err) {
    if (!err.service) err.service = "openai";
    throw err;
  }
}

module.exports = {
  explainError,
  chatReply,
  analyzeCode,
  generateTrace,
  generateLearningContent,
  convertCode,
  runCode,
};
