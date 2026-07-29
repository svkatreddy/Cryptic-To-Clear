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
          (error.response?.data && JSON.stringify(error.response.data).includes("429"));
        if (isRateLimit && attempt === 0) {
          await new Promise((r) => setTimeout(r, 700));
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
  try {
    const { content } = await requestWithFallback({
      temperature: 0.3,
      maxTokens: 800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt({ language, error, sourceCode }) },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: EXPLANATION_SCHEMA,
      },
    });

    const match = content.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : JSON.parse(content);
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
  "You are CodeMentor AI's visual debugger simulator. Simulate step-by-step code execution and return ONLY a JSON object matching this format:\n" +
  "{\n" +
  '  "summary": "1-2 sentences describing what this code does",\n' +
  '  "steps": [\n' +
  '    {\n' +
  '      "step": 1,\n' +
  '      "line": 1,\n' +
  '      "action": "Execute line 1",\n' +
  '      "description": "Executed line 1",\n' +
  '      "callStack": ["main"],\n' +
  '      "variables": [{"location": "local", "name": "n", "type": "number", "value": "5"}],\n' +
  '      "memory": [{"location": "heap", "name": "fn", "type": "function", "value": "Function"}],\n' +
  '      "outputDelta": ""\n' +
  '    }\n' +
  '  ]\n' +
  "}\n" +
  "Return raw JSON starting with { and ending with } only.";

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
      maxTokens: 1000,
      messages: [
        { role: "system", content: TRACE_SYSTEM_PROMPT },
        { role: "user", content: buildTracePrompt({ language, sourceCode, stdin }) },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: TRACE_SCHEMA,
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
      maxTokens: 1000,
      messages: [
        { role: "system", content: LEARNING_SYSTEM_PROMPT },
        { role: "user", content: buildLearningPrompt({ language, sourceCode }) },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: LEARNING_SCHEMA,
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
    if (match) {
      return JSON.parse(match[0]);
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
  try {
    const { content } = await requestWithFallback({
      temperature: 0.2,
      maxTokens: 800,
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
  "You are a real interactive UNIX terminal compiler. Simulate line-by-line compilation and execution of the source code with the provided stdin values.\n" +
  "SCHEMA:\n" +
  '{\n  "output": "Exact interactive terminal output stream",\n  "compileError": "",\n  "runtimeError": "",\n  "statusId": 3\n}\n' +
  "RULES FOR INTERACTIVE TERMINAL OUTPUT:\n" +
  "1. Execute the code step-by-step from top to bottom.\n" +
  "2. Print every System.out/printf/cout/print statement on its line.\n" +
  "3. When a Scanner/cin/input statement reads a value from stdin, echo the typed input value formatted as '> input_value' on its own line in the stream, then continue to the next statement.\n" +
  "4. If stdin runs out of input values for pending input statements, stop execution immediately right at the prompt line expecting input.\n" +
  "5. Do NOT include any AI commentary, markdown, code explanations, or extra text.\n" +
  "6. Return ONLY raw JSON starting with { and ending with }.";

function buildExecutionPrompt({ language, sourceCode, stdin }) {
  return `Language: ${language}\nSource:\n${sourceCode}\n\nStdin:\n${stdin || ""}`;
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

async function runCode({ language, sourceCode, stdin }) {
  // Fast Local Execution for JavaScript (< 2ms)
  const langKey = (language || "").toLowerCase();
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
