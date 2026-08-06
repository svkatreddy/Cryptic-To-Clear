const DEFAULT_API_BASE_URL =
  typeof window !== "undefined"
    ? `http://${window.location.hostname}:5000`
    : "http://127.0.0.1:5000";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");

export interface ExecuteRequest {
  language: string;
  sourceCode: string;
  stdin?: string;
}

export interface ExecuteResponse {
  success: true;
  language: string;
  languageType: "compiled" | "interpreted";
  statusId: number;
  statusDescription: string;
  output: string;
  compileError: string;
  runtimeError: string;
  time: string | null;
  memory: number | null;
  isAccepted: boolean;
}

export interface ExecuteErrorResponse {
  success: false;
  message: string;
}

export type ExecuteResult = ExecuteResponse | ExecuteErrorResponse;

export interface AIExplanation {
  errorSummary: string;
  reason: string;
  errorLine: string;
  simpleExplanation: string;
  howToFix: string;
  correctCode: string;
  commonMistakes: string[];
  bestPractices: string[];
  optimizationTips: string[];
}

export interface ExplainRequest {
  language: string;
  error: string;
  sourceCode: string;
}

export interface ExplainSuccess {
  success: true;
  explanation: AIExplanation;
}

export interface ExplainFailure {
  success: false;
  message: string;
}

export type ExplainResult = ExplainSuccess | ExplainFailure;

export interface ChatApiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  language: string;
  sourceCode: string;
  messages: ChatApiMessage[];
}

export interface ChatSuccess {
  success: true;
  reply: string;
}

export interface ChatFailure {
  success: false;
  message: string;
}

export type ChatResult = ChatSuccess | ChatFailure;

/**
 * Calls the Express backend's POST /api/chat endpoint that powers the
 * permanent AI Chat panel. Sends the running conversation plus the current
 * editor language/code as context, gets back a markdown reply. Never
 * throws — always resolves to a tagged result.
 */
export async function sendChatMessage(req: ChatRequest): Promise<ChatResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);

    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.success === false) {
      return {
        success: false,
        message:
          data?.message ?? `The AI chat returned an error (HTTP ${res.status}).`,
      };
    }

    return data as ChatSuccess;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { success: false, message: "The AI chat request timed out. Please try again." };
    }
    return {
      success: false,
      message: "Could not reach the AI chat service. Make sure the Express server is running.",
    };
  }
}

export type Severity = "low" | "medium" | "high";

export interface PerformanceSuggestion {
  title: string;
  detail: string;
  impact: Severity;
}

export interface SecurityIssue {
  issue: string;
  detail: string;
  severity: Severity;
}

export interface NamingSuggestion {
  current: string;
  suggested: string;
  reason: string;
}

export interface CodeAnalysis {
  readabilityScore: number;
  maintainabilityScore: number;
  summary: string;
  performanceSuggestions: PerformanceSuggestion[];
  securityIssues: SecurityIssue[];
  unusedVariables: string[];
  duplicateCode: string[];
  deadCode: string[];
  variableNamingSuggestions: NamingSuggestion[];
  functionNamingSuggestions: NamingSuggestion[];
  aiRecommendations: string[];
}

export interface AnalyzeRequest {
  language: string;
  sourceCode: string;
}

export interface AnalyzeSuccess {
  success: true;
  analysis: CodeAnalysis;
}

export interface AnalyzeFailure {
  success: false;
  message: string;
}

export type AnalyzeResult = AnalyzeSuccess | AnalyzeFailure;

export type DebugAction =
  | "init"
  | "call"
  | "return"
  | "assign"
  | "loop"
  | "condition"
  | "output"
  | "other";

export interface DebugVariable {
  name: string;
  value: string;
  type: string;
  scope: string;
}

export interface DebugMemoryEntry {
  location: "stack" | "heap";
  name: string;
  type: string;
  value: string;
}

export interface ExecutionStep {
  step: number;
  line: number;
  action: DebugAction;
  description: string;
  callStack: string[];
  variables: DebugVariable[];
  memory: DebugMemoryEntry[];
  outputDelta: string;
}

export interface ExecutionTrace {
  summary: string;
  steps: ExecutionStep[];
}

export interface TraceRequest {
  language: string;
  sourceCode: string;
  stdin?: string;
}

export interface TraceSuccess {
  success: true;
  trace: ExecutionTrace;
}

export interface TraceFailure {
  success: false;
  message: string;
}

export type TraceResult = TraceSuccess | TraceFailure;

/**
 * Calls the Express backend's POST /api/debug/trace endpoint, which asks
 * OpenAI to simulate a step-by-step execution trace of the current code for
 * the Visual Debugger. Never throws — always resolves to a tagged result.
 */
export async function generateTrace(req: TraceRequest): Promise<TraceResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const res = await fetch(`${API_BASE_URL}/api/debug/trace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.success === false) {
      return {
        success: false,
        message: data?.message ?? `The debugger returned an error (HTTP ${res.status}).`,
      };
    }

    return data as TraceSuccess;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { success: false, message: "The debugger request timed out. Please try again." };
    }
    return {
      success: false,
      message: "Could not reach the debugger service. Make sure the Express server is running.",
    };
  }
}

export interface ComplexityAnalysis {
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
}

export interface QuestionWithHint {
  question: string;
  hint: string;
}

export interface LearningContent {
  topic: string;
  beginnerExplanation: string;
  intermediateExplanation: string;
  advancedExplanation: string;
  realLifeExample: string;
  flowchartMermaid: string;
  pseudoCode: string;
  complexityAnalysis: ComplexityAnalysis;
  practiceQuestion: QuestionWithHint;
  interviewQuestion: QuestionWithHint;
  relatedTopics: string[];
}

export interface LearnRequest {
  language: string;
  sourceCode: string;
}

export interface LearnSuccess {
  success: true;
  content: LearningContent;
}

export interface LearnFailure {
  success: false;
  message: string;
}

export type LearnResult = LearnSuccess | LearnFailure;

/**
 * Calls the Express backend's POST /api/learn endpoint, which asks OpenAI
 * for a complete multi-level teaching package about the current code.
 * Powers Learning Mode. Never throws — always resolves to a tagged result.
 */
export async function learnCode(req: LearnRequest): Promise<LearnResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const res = await fetch(`${API_BASE_URL}/api/learn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.success === false) {
      return {
        success: false,
        message: data?.message ?? `Learning Mode returned an error (HTTP ${res.status}).`,
      };
    }

    return data as LearnSuccess;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { success: false, message: "The Learning Mode request timed out. Please try again." };
    }
    return {
      success: false,
      message: "Could not reach Learning Mode. Make sure the Express server is running.",
    };
  }
}

export interface LanguageDifference {
  aspect: string;
  explanation: string;
}

export interface CodeConversion {
  convertedCode: string;
  preservedLogicSummary: string;
  differences: LanguageDifference[];
  conversionNotes: string;
}

export interface ConvertRequest {
  sourceLanguage: string;
  targetLanguage: string;
  sourceCode: string;
}

export interface ConvertSuccess {
  success: true;
  conversion: CodeConversion;
}

export interface ConvertFailure {
  success: false;
  message: string;
}

export type ConvertResult = ConvertSuccess | ConvertFailure;

/**
 * Calls the Express backend's POST /api/convert endpoint, which asks
 * OpenAI to convert code between two languages while preserving logic.
 * Never throws — always resolves to a tagged result.
 */
export async function convertCode(req: ConvertRequest): Promise<ConvertResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const res = await fetch(`${API_BASE_URL}/api/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.success === false) {
      return {
        success: false,
        message: data?.message ?? `Code Conversion returned an error (HTTP ${res.status}).`,
      };
    }

    return data as ConvertSuccess;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { success: false, message: "The conversion request timed out. Please try again." };
    }
    return {
      success: false,
      message: "Could not reach Code Conversion. Make sure the Express server is running.",
    };
  }
}

/**
 * Calls the Express backend's POST /api/analyze endpoint, which sends the
 * current editor language/code to OpenAI and returns a structured code
 * quality report for the Code Quality Analyzer. Never throws — always
 * resolves to a tagged result.
 */
export async function analyzeCode(req: AnalyzeRequest): Promise<AnalyzeResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);

    const res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.success === false) {
      return {
        success: false,
        message: data?.message ?? `The analyzer returned an error (HTTP ${res.status}).`,
      };
    }

    return data as AnalyzeSuccess;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { success: false, message: "The analysis request timed out. Please try again." };
    }
    return {
      success: false,
      message: "Could not reach the analyzer service. Make sure the Express server is running.",
    };
  }
}

/**
 * Calls the Express backend's POST /api/explain endpoint, which sends the
 * language, compiler error, and source code to OpenAI and returns a
 * structured explanation. Like executeCode, this never throws — it always
 * resolves to a tagged result so the AI panel can render it directly.
 */
export async function explainError(req: ExplainRequest): Promise<ExplainResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    const res = await fetch(`${API_BASE_URL}/api/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.success === false) {
      return {
        success: false,
        message:
          data?.message ??
          `The AI explanation service returned an error (HTTP ${res.status}).`,
      };
    }

    return data as ExplainSuccess;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        success: false,
        message: "The AI explanation request timed out. Please try again.",
      };
    }
    return {
      success: false,
      message:
        "Could not reach the AI explanation service. Make sure the Express server is running.",
    };
  }
}

/**
 * Calls the Express backend's POST /api/execute endpoint, which in turn
 * compiles + runs the code via the Groq AI engine. Never throws for expected failure
 * cases (bad code, unreachable backend, etc.) — it always resolves to a
 * tagged result so the UI can render it directly.
 */
export async function executeCode(
  req: ExecuteRequest
): Promise<ExecuteResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(`${API_BASE_URL}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.success === false) {
      return {
        success: false,
        message:
          data?.message ??
          `The compiler service returned an error (HTTP ${res.status}).`,
      };
    }

    return data as ExecuteResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        success: false,
        message: "The request timed out. Please try again.",
      };
    }
    return {
      success: false,
      message:
        "Could not reach the compiler backend. Make sure the Express server is running and NEXT_PUBLIC_API_BASE_URL is set correctly.",
    };
  }
}

/* ==========================================================================
   AUTHENTICATION & USER TYPES AND APIS
   ========================================================================== */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "local" | "google" | "github";
  role: "user" | "admin";
  plan: "free" | "pro" | "team" | "enterprise";
  subscriptionStatus: "active" | "inactive" | "trialing" | "canceled";
  subscriptionExpiry?: string | null;
  credits: number;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.success === false) {
      return {
        success: false,
        message: data?.message || "Invalid credentials.",
      };
    }
    return data as AuthResponse;
  } catch {
    return {
      success: false,
      message: "Could not connect to authentication server.",
    };
  }
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
      credentials: "include",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.success === false) {
      return {
        success: false,
        message: data?.message || "Could not complete registration.",
      };
    }
    return data as AuthResponse;
  } catch {
    return {
      success: false,
      message: "Could not connect to registration server.",
    };
  }
}

export async function logoutUser(): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => null);
    return data || { success: true };
  } catch {
    return { success: true };
  }
}

export async function fetchMe(token?: string): Promise<AuthResponse> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers,
      credentials: "include",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.success === false) {
      return { success: false, message: data?.message || "Session unauthenticated." };
    }
    return data as AuthResponse;
  } catch {
    return { success: false, message: "Could not fetch user session." };
  }
}

export async function requestForgotPassword(email: string): Promise<{ success: boolean; message: string; demoNote?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => null);
    return data || { success: true, message: "Instructions dispatched." };
  } catch {
    return { success: false, message: "Network error requesting password reset." };
  }
}

