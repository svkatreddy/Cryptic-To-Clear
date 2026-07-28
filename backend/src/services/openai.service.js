const axios = require("axios");
const env = require("../config/env");

const client = axios.create({
  baseURL: env.openai.baseUrl,
  timeout: env.openai.requestTimeoutMs,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.openai.apiKey}`,
  },
});

const groqClient = axios.create({
  baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  timeout: Number(process.env.GROQ_TIMEOUT_MS || 30000),
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.GROQ_API_KEY || ""}`,
  },
});

async function requestWithFallback({ model, messages, temperature, responseFormat, isChat }) {
  const providers = [];

  if (env.openai.apiKey) {
    providers.push({
      client,
      name: "nvidia",
      baseUrl: env.openai.baseUrl,
      model,
      headers: { Authorization: `Bearer ${env.openai.apiKey}` },
    });
  }

  if (process.env.GROQ_API_KEY) {
    providers.push({
      client: groqClient,
      name: "groq",
      baseUrl: groqClient.defaults.baseURL,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    });
  }

  if (!providers.length) {
    const err = new Error("No AI provider configured");
    err.status = 503;
    err.publicMessage = "No AI provider is configured. Set OPENAI_API_KEY or GROQ_API_KEY.";
    throw err;
  }

  let lastError;
  for (const provider of providers) {
    try {
      const payload = {
        model: provider.model,
        temperature,
        messages,
      };

      if (responseFormat) {
        payload.response_format = responseFormat;
      }

      if (isChat) {
        const { data } = await provider.client.post("/chat/completions", payload);
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("Provider returned an empty response");
        }
        return { data, content, providerName: provider.name };
      }

      const { data } = await provider.client.post("/chat/completions", payload);
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Provider returned an empty response");
      }
      return { data, content, providerName: provider.name };
    } catch (error) {
      lastError = error;
    }
  }

  const err = lastError || new Error("AI provider failed");
  err.status = 502;
  err.service = "openai";
  err.publicMessage = "The AI service failed and no fallback provider was available.";
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
  "You are CodeMentor AI, an expert programming tutor embedded in an online " +
  "compiler. A student's code failed to compile. Explain the failure kindly " +
  "and precisely, then provide a corrected version of their code. Always " +
  "respond using the provided JSON schema only — no prose outside it.";

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
  if (!env.openai.apiKey) {
    const err = new Error("OpenAI API key not configured");
    err.status = 503;
    err.publicMessage =
      "AI explanations aren't configured yet. Set OPENAI_API_KEY in backend/.env.";
    throw err;
  }

  try {
    const { content } = await requestWithFallback({
      model: env.openai.model,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt({ language, error, sourceCode }) },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: EXPLANATION_SCHEMA,
      },
      isChat: true,
    });

    return JSON.parse(content);
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
  if (!env.openai.apiKey && !process.env.GROQ_API_KEY) {
    const err = new Error("AI API key not configured");
    err.status = 503;
    err.publicMessage =
      "The AI chat isn't configured yet. Set OPENAI_API_KEY or GROQ_API_KEY in backend/.env.";
    throw err;
  }

  const contextMessage = {
    role: "system",
    content: `The user is currently editing a ${language} file. Current editor content:\n\n\`\`\`${language}\n${
      sourceCode || "(empty file)"
    }\n\`\`\``,
  };

  try {
    const { content } = await requestWithFallback({
      model: env.openai.model,
      temperature: 0.4,
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        contextMessage,
        ...messages,
      ],
      isChat: true,
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
  "You are CodeMentor AI's static code quality analyzer. Review the " +
  "submitted source code as a senior engineer doing a thorough code " +
  "review. Score readability and maintainability honestly (most real-world " +
  "code scores 50-85, reserve 90+ for genuinely excellent code). Only " +
  "report issues that are actually present — return empty arrays for " +
  "categories with nothing to report rather than inventing filler. Always " +
  "respond using the provided JSON schema only — no prose outside it.";

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
  if (!env.openai.apiKey) {
    const err = new Error("OpenAI API key not configured");
    err.status = 503;
    err.publicMessage =
      "The Code Quality Analyzer isn't configured yet. Set OPENAI_API_KEY in backend/.env.";
    throw err;
  }

  try {
    const { data } = await client.post("/chat/completions", {
      model: env.openai.model,
      temperature: 0.2,
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: buildAnalysisPrompt({ language, sourceCode }) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: ANALYSIS_SCHEMA,
      },
    });

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      const err = new Error("OpenAI returned an empty response");
      err.status = 502;
      err.publicMessage = "The AI service returned an empty response. Please try again.";
      throw err;
    }

    return JSON.parse(raw);
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
  "You are CodeMentor AI's execution simulator, powering a visual debugger. " +
  "Given source code, simulate its execution step by step as a debugger " +
  "would: variable assignments, function calls/returns, loop iterations, " +
  "branch decisions, and output. Line numbers must exactly match the given " +
  "source (1-indexed). Keep variable values realistic and consistent across " +
  "steps. Always respond using the provided JSON schema only — no prose " +
  "outside it.";

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
  if (!env.openai.apiKey) {
    const err = new Error("OpenAI API key not configured");
    err.status = 503;
    err.publicMessage =
      "The Visual Debugger isn't configured yet. Set OPENAI_API_KEY in backend/.env.";
    throw err;
  }

  try {
    const { data } = await client.post("/chat/completions", {
      model: env.openai.model,
      temperature: 0.2,
      messages: [
        { role: "system", content: TRACE_SYSTEM_PROMPT },
        { role: "user", content: buildTracePrompt({ language, sourceCode, stdin }) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: TRACE_SCHEMA,
      },
    });

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      const err = new Error("OpenAI returned an empty response");
      err.status = 502;
      err.publicMessage = "The AI service returned an empty response. Please try again.";
      throw err;
    }

    return JSON.parse(raw);
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
  "You are CodeMentor AI's Learning Mode, an expert programming teacher. " +
  "Given source code, produce a complete, multi-level teaching package " +
  "about it: explanations at three levels, a real-life analogy, a Mermaid " +
  "flowchart of its logic, pseudocode, complexity analysis, a practice " +
  "question, an interview question, and related topics. Keep the Mermaid " +
  "flowchart syntactically valid and simple (flowchart TD, short labels, " +
  "no special characters that would break Mermaid parsing). Always respond " +
  "using the provided JSON schema only — no prose outside it.";

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
  if (!env.openai.apiKey) {
    const err = new Error("OpenAI API key not configured");
    err.status = 503;
    err.publicMessage =
      "Learning Mode isn't configured yet. Set OPENAI_API_KEY in backend/.env.";
    throw err;
  }

  try {
    const { data } = await client.post("/chat/completions", {
      model: env.openai.model,
      temperature: 0.4,
      messages: [
        { role: "system", content: LEARNING_SYSTEM_PROMPT },
        { role: "user", content: buildLearningPrompt({ language, sourceCode }) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: LEARNING_SCHEMA,
      },
    });

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      const err = new Error("OpenAI returned an empty response");
      err.status = 502;
      err.publicMessage = "The AI service returned an empty response. Please try again.";
      throw err;
    }

    return JSON.parse(raw);
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
  "You are CodeMentor AI's code converter. Convert the submitted source " +
  "code from one programming language to another while preserving its " +
  "exact logic and behavior. Write idiomatic code in the target language " +
  "(follow its naming and formatting conventions) rather than a literal " +
  "line-by-line transliteration. Always respond using the provided JSON " +
  "schema only — no prose outside it.";

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
  if (!env.openai.apiKey) {
    const err = new Error("OpenAI API key not configured");
    err.status = 503;
    err.publicMessage =
      "Code Conversion isn't configured yet. Set OPENAI_API_KEY in backend/.env.";
    throw err;
  }

  try {
    const { data } = await client.post("/chat/completions", {
      model: env.openai.model,
      temperature: 0.2,
      messages: [
        { role: "system", content: CONVERSION_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildConversionPrompt({ sourceLanguage, targetLanguage, sourceCode }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: CONVERSION_SCHEMA,
      },
    });

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      const err = new Error("OpenAI returned an empty response");
      err.status = 502;
      err.publicMessage = "The AI service returned an empty response. Please try again.";
      throw err;
    }

    return JSON.parse(raw);
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

const EXECUTION_SYSTEM_PROMPT =
  "You are a code execution assistant. Given source code and optional stdin, simulate the compilation and execution of the program exactly. " +
  "Return only valid JSON matching the schema. Do not include any extra explanation outside the JSON. " +
  "Use statusId 3 for success, 6 for compilation error, 7 for runtime error, and 13 for execution unavailable. " +
  "Put stdout in output. If compilation fails, populate compileError. If runtime fails, populate runtimeError.";

function buildExecutionPrompt({ language, sourceCode, stdin }) {
  return [
    `Programming language: ${language}`,
    "",
    "Source code:",
    "```",
    sourceCode,
    "```",
    "",
    `Standard input:\n${stdin || "(none)"}`,
  ].join("\n");
}

async function runCode({ language, sourceCode, stdin }) {
  if (!env.openai.apiKey && !process.env.GROQ_API_KEY) {
    const err = new Error("AI API key not configured");
    err.status = 503;
    err.publicMessage =
      "Code execution via AI isn't configured yet. Set OPENAI_API_KEY or GROQ_API_KEY in backend/.env.";
    throw err;
  }

  try {
    const { content } = await requestWithFallback({
      model: env.openai.model,
      temperature: 0.1,
      messages: [
        { role: "system", content: EXECUTION_SYSTEM_PROMPT },
        { role: "user", content: buildExecutionPrompt({ language, sourceCode, stdin }) },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: EXECUTION_SCHEMA,
      },
      isChat: true,
    });

    const parsed = JSON.parse(content);
    return {
      statusId: Number(parsed.statusId) || 13,
      statusDescription: parsed.statusDescription || "Execution unavailable",
      output: parsed.output || "",
      compileError: parsed.compileError || "",
      runtimeError: parsed.runtimeError || "",
      time: parsed.time || null,
      memory: parsed.memory ?? null,
      isAccepted: parsed.isAccepted === true,
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
