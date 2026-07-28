import type { AIExplanation, ChatApiMessage } from "./api";

export interface QuickAction {
  label: string;
  prompt: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: "Explain this code", prompt: "Explain what this code does, step by step." },
  {
    label: "Optimize",
    prompt: "Suggest ways to optimize this code, and explain the tradeoffs of each suggestion.",
  },
  {
    label: "Find Bug",
    prompt: "Carefully review this code for bugs, edge cases, or incorrect logic. List anything you find.",
  },
  {
    label: "Convert Java to Python",
    prompt: "Convert the following code from Java to Python. Return the complete converted code in a fenced code block.",
  },
  {
    label: "Convert Python to Java",
    prompt: "Convert the following code from Python to Java. Return the complete converted code in a fenced code block.",
  },
  {
    label: "Explain Algorithm",
    prompt: "Identify and explain the algorithm(s) used in this code.",
  },
  {
    label: "Generate Test Cases",
    prompt: "Generate a set of test cases for this code, including edge cases. Present them clearly.",
  },
  {
    label: "Explain Output",
    prompt: "Explain what output this code produces (or would produce), and why.",
  },
  {
    label: "Generate Comments",
    prompt: "Add clear, concise inline comments to this code and return the fully commented version.",
  },
  {
    label: "Generate Documentation",
    prompt: "Generate documentation for this code — a docstring or README-style description of what it does, its parameters, and its return value.",
  },
  {
    label: "Time Complexity",
    prompt: "Analyze the time complexity of this code. Explain your reasoning using Big-O notation.",
  },
  {
    label: "Space Complexity",
    prompt: "Analyze the space complexity of this code. Explain your reasoning using Big-O notation.",
  },
];

export type ChatRole = "user" | "assistant";

interface ChatMessageBase {
  id: string;
  role: ChatRole;
  timestamp: number;
}

export interface TextChatMessage extends ChatMessageBase {
  kind: "text";
  content: string;
}

export interface LoadingChatMessage extends ChatMessageBase {
  kind: "loading";
  label: string;
}

export interface ErrorChatMessage extends ChatMessageBase {
  kind: "error";
  message: string;
  /** Payload needed to retry the request that produced this error. */
  retry:
    | { type: "chat"; text: string }
    | { type: "explain"; compilerError: string; language: string; sourceCode: string };
}

export interface ExplanationChatMessage extends ChatMessageBase {
  kind: "explanation";
  explanation: AIExplanation;
  sourceLanguage: string;
}

export type ChatMessage =
  | TextChatMessage
  | LoadingChatMessage
  | ErrorChatMessage
  | ExplanationChatMessage;

export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Flattens the panel's rich message list into the plain {role, content}
 * pairs the backend's stateless /api/chat endpoint expects. Loading and
 * error placeholders carry no useful context and are skipped; explanation
 * messages are summarized so the model retains some memory of them without
 * resending the full structured payload.
 */
export function buildApiHistory(messages: ChatMessage[], limit = 12): ChatApiMessage[] {
  const history: ChatApiMessage[] = [];
  for (const m of messages) {
    if (m.kind === "text") {
      history.push({ role: m.role, content: m.content });
    } else if (m.kind === "explanation") {
      history.push({
        role: "assistant",
        content: `[Compiler error explanation] ${m.explanation.errorSummary} — ${m.explanation.howToFix}`,
      });
    }
  }
  return history.slice(-limit);
}
