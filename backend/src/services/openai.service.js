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
    for (let attempt = 0; attempt < 2; attempt++) {
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
        const isRateLimit =
          error.response?.status === 429 ||
          error.status === 429 ||
          (error.response?.data && JSON.stringify(error.response.data).includes("429")) ||
          (error.message && error.message.includes("429"));
        if (isRateLimit) {
          const waitMs = (attempt + 1) * 1500;
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
  "You are CodeMentor AI, an expert programming tutor embedded in an online compiler. A student's code failed to compile.\n" +
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
  "You are CodeMentor AI, an expert programming assistant embedded in an " +
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
    content: `The user is currently editing a ${language} file. Current editor content:\n\n\`\`\`${language}\n${
      sourceCode || "(empty file)"
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
  "You are CodeMentor AI's static code quality analyzer. Review the source code and return ONLY a JSON object matching this format:\n" +
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
  "You are CodeMentor AI's visual debugger simulator. Simulate step-by-step code execution for up to 5-10 concise steps. Return ONLY a JSON object matching this format:\n" +
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
  "You are CodeMentor AI's Learning Mode, an expert programming teacher. Given source code, produce a complete teaching package.\n" +
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
  "You are CodeMentor AI's code converter. Convert the submitted source code from one language to another while preserving exact logic.\n" +
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
  "You are a real interactive UNIX terminal compiler and execution engine.\n" +
  "Simulate exact line-by-line compilation and execution of the source code with the provided stdin values.\n\n" +
  "SCHEMA FOR RESPONSE (JSON ONLY):\n" +
  "{\n" +
  '  "statusId": 3,\n' +
  '  "statusDescription": "Success",\n' +
  '  "output": "Exact interactive terminal output stream",\n' +
  '  "compileError": "",\n' +
  '  "runtimeError": "",\n' +
  '  "time": "0.05s",\n' +
  '  "memory": 8,\n' +
  '  "isAccepted": true\n' +
  "}\n\n" +
  "CRITICAL RULES:\n" +
  "1. SYNTAX CHECKING: Before running, strictly check for syntax errors, missing semicolons, unclosed brackets, missing quotes, or invalid expressions. If ANY compilation error exists, DO NOT auto-fix it! Immediately return statusId=6, statusDescription='Compilation Error', output='', compileError='<exact error message, line number, and position>', runtimeError='', isAccepted=false.\n" +
  "2. Execute valid code step-by-step from top to bottom of the main entry point.\n" +
  "3. Print every printf / cout / System.out / print statement exact text output.\n" +
  "4. Whenever ANY input statement is reached in ANY language (C: scanf, getchar, fgets; C++: cin, getline; Java: Scanner, BufferedReader; Python: input(); Go: fmt.Scan; C#: Console.ReadLine):\n" +
  "   a. If input values exist in Stdin, consume the next value, echo it formatted as '> input_value' in the terminal output stream right where it was read, and continue execution.\n" +
  "   b. If Stdin is empty ([NO STDIN VALUES PROVIDED] or no values remaining), DO NOT throw a Runtime Error or EOF error! Stop execution immediately right at that input prompt without any runtime error. Set statusId=3, statusDescription='Success', runtimeError='', compileError=''. Include all printed prompt text in the output field.\n" +
  "5. Return ONLY raw JSON starting with { and ending with } without markdown code fences.";

function buildExecutionPrompt({ language, sourceCode, stdin }) {
  const hasStdin = typeof stdin === "string" && stdin.trim().length > 0;
  return `Target Language: ${language}
Source Code:
${sourceCode}

Standard Input (stdin):
${hasStdin ? stdin : "[NO STDIN VALUES PROVIDED]"}`;
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

async function runCode({ language, sourceCode, stdin }) {
  const langKey = (language || "").toLowerCase();

  // Pre-validate C compilation rules deterministically
  if (langKey === "c") {
    const cValError = validateCCode(sourceCode);
    if (cValError) return cValError;
  }

  // Pre-validate Java compilation rules deterministically
  if (langKey === "java") {
    const validationError = validateJavaCode(sourceCode);
    if (validationError) {
      return validationError;
    }
  }

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

  // Fast AI Execution via Groq (llama-3.1-8b-instant)
  try {
    const { content } = await requestWithFallback({
      temperature: 0.0,
      maxTokens: 300,
      messages: [
        { role: "system", content: EXECUTION_SYSTEM_PROMPT },
        { role: "user", content: buildExecutionPrompt({ language, sourceCode, stdin }) },
      ],
      responseFormat: { type: "json_object" },
      isChat: true,
    });

    let parsed = {};
    try {
      const match = content.match(/\{[\s\S]*?\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        parsed = JSON.parse(content);
      }
    } catch {
      parsed = {
        output: content.replace(/```json|```|\{|\}/g, "").trim(),
        statusId: 3,
      };
    }

    let cleanOut = cleanTerminalOutput(typeof parsed.output === "string" ? parsed.output : JSON.stringify(parsed.output || ""));

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
