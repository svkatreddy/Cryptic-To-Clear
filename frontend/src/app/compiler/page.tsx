"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Toolbar from "@/components/compiler/Toolbar";
import AIPanel from "@/components/compiler/AIPanel";
import BottomPanel, { BottomTab } from "@/components/compiler/BottomPanel";
import { EditorSettings } from "@/components/compiler/CodeEditor";
import { LANGUAGES, LanguageConfig, getLanguage } from "@/lib/languages";
import {
  executeCode,
  explainError,
  sendChatMessage,
  analyzeCode,
  CodeAnalysis,
  generateTrace,
  ExecutionTrace,
  learnCode,
  LearningContent,
} from "@/lib/api";
import { changedLineNumbers } from "@/lib/diff";
import {
  downloadTextFile,
  formatExplanationMarkdown,
  formatExecutionReport,
  exportTextAsPdf,
  printPlainText,
  buildShareUrl,
  decodeShareState,
} from "@/lib/exportUtils";
import {
  ChatMessage,
  ErrorChatMessage,
  ExplanationChatMessage,
  buildApiHistory,
  makeId,
} from "@/lib/chat";

// Heavy, click-triggered surfaces are lazy-loaded — none of them (or their
// dependencies like mermaid / react-syntax-highlighter) ship in the initial
// compiler bundle. A lightweight skeleton fills the same modal frame while
// each chunk downloads, so opening still feels instant rather than blank.
function ModalSkeleton() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-2xl h-72 glass-strong rounded-xl shadow-2xl animate-pulse" />
    </div>
  );
}

const CodeEditor = dynamic(() => import("@/components/compiler/CodeEditor"), {
  ssr: false,
});
const DiffModal = dynamic(() => import("@/components/compiler/DiffModal"), {
  ssr: false,
  loading: ModalSkeleton,
});
const AnalyzerModal = dynamic(() => import("@/components/compiler/AnalyzerModal"), {
  ssr: false,
  loading: ModalSkeleton,
});
const VisualDebugger = dynamic(() => import("@/components/compiler/VisualDebugger"), {
  ssr: false,
  loading: ModalSkeleton,
});
const LearningModeModal = dynamic(() => import("@/components/compiler/LearningModeModal"), {
  ssr: false,
  loading: ModalSkeleton,
});
const ConverterModal = dynamic(() => import("@/components/compiler/ConverterModal"), {
  ssr: false,
  loading: ModalSkeleton,
});
const ShortcutsModal = dynamic(() => import("@/components/compiler/ShortcutsModal"), {
  ssr: false,
});

const STORAGE_KEY = "codementor:compiler:v1";
const CHAT_STORAGE_KEY = "codementor:chat:v1";
const NAVBAR_H = 64;

interface PersistedState {
  language: string;
  code: Record<string, string>;
  settings: EditorSettings;
  autoSave: boolean;
}

interface FixState {
  applied: boolean;
  preSnapshot: string | null;
}

function defaultCodeMap(): Record<string, string> {
  const map: Record<string, string> = {};
  LANGUAGES.forEach((l) => (map[l.id] = l.template));
  return map;
}

// Judge0 reports time in seconds (as a string, e.g. "0.012") and memory in
// kilobytes. The UI shows friendlier units.
function formatTime(time: string | null): string {
  if (!time) return "—";
  const seconds = parseFloat(time);
  if (Number.isNaN(seconds)) return "—";
  return `${Math.round(seconds * 1000)} ms`;
}

function formatMemory(memoryKb: number | null): string {
  if (!memoryKb && memoryKb !== 0) return "—";
  return `${(memoryKb / 1024).toFixed(2)} MB`;
}

export default function CompilerPage() {
  const [language, setLanguage] = useState<string>("javascript");
  const [codeMap, setCodeMap] = useState<Record<string, string>>(
    defaultCodeMap()
  );
  const [settings, setSettings] = useState<EditorSettings>({
    theme: "vs-dark",
    fontSize: 14,
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
    bracketMatching: true,
  });
  const [autoSave, setAutoSave] = useState(true);
  const [saveNote, setSaveNote] = useState("");

  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [aiOverlayOpen, setAiOverlayOpen] = useState(false);

  // Permanent AI chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  // "Apply AI Fix" bookkeeping, keyed by the explanation message's id so
  // each fix in the chat history tracks its own applied/undo state.
  const [fixState, setFixState] = useState<Record<string, FixState>>({});
  const [highlightLines, setHighlightLines] = useState<number[]>([]);
  const [diffTarget, setDiffTarget] = useState<ExplanationChatMessage | null>(null);

  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const [analyzerStatus, setAnalyzerStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [analyzerError, setAnalyzerError] = useState<string | null>(null);

  const [debuggerOpen, setDebuggerOpen] = useState(false);
  const [debugStatus, setDebugStatus] = useState<"loading" | "success" | "error">("loading");
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [debugStepIndex, setDebugStepIndex] = useState(0);
  const [debugPlaying, setDebugPlaying] = useState(false);
  const [debugLanguage, setDebugLanguage] = useState<string | null>(null);

  const [learningOpen, setLearningOpen] = useState(false);
  const [learningStatus, setLearningStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [learningContent, setLearningContent] = useState<LearningContent | null>(null);
  const [learningError, setLearningError] = useState<string | null>(null);

  const [converterOpen, setConverterOpen] = useState(false);

  const [bottomTab, setBottomTab] = useState<BottomTab>("output");
  const [bottomHeight, setBottomHeight] = useState(240);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [errors, setErrors] = useState("");
  const [executionTime, setExecutionTime] = useState("—");
  const [memoryUsage, setMemoryUsage] = useState("—");
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">(
    "idle"
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [exportNote, setExportNote] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const showExportNote = (message: string) => {
    setExportNote(message);
    setTimeout(() => setExportNote(""), 2000);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const resizing = useRef(false);

  // Load persisted editor state on mount (one-time hydration from
  // localStorage, which only exists client-side, so an effect is correct here)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedState = JSON.parse(raw);
        setLanguage(parsed.language ?? "javascript");
        setCodeMap({ ...defaultCodeMap(), ...parsed.code });
        setSettings((s) => ({ ...s, ...parsed.settings }));
        setAutoSave(parsed.autoSave ?? true);
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  // Load chat history for this session (sessionStorage, so it clears when
  // the tab closes — matching "chat history during the session").
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) {
        const parsed: ChatMessage[] = JSON.parse(raw);
        setMessages(parsed.filter((m) => m.kind !== "loading"));
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  // A shared link (?share=...) takes priority over localStorage — this is
  // what makes "Share Link" actually work for whoever opens it.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shared = params.get("share");
      if (shared) {
        const decoded = decodeShareState(shared);
        if (decoded) {
          setLanguage(decoded.language);
          setCodeMap((m) => ({ ...m, [decoded.language]: decoded.sourceCode }));
          showExportNote("Loaded shared code");
        }
      }
    } catch {
      // ignore malformed share links
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist chat history as it grows.
  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(messages.filter((m) => m.kind !== "loading"))
      );
    } catch {
      // ignore quota errors
    }
  }, [messages]);

  // Auto save (editor code)
  useEffect(() => {
    if (!autoSave) return;
    const handle = setTimeout(() => {
      try {
        const payload: PersistedState = { language, code: codeMap, settings, autoSave };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setSaveNote("Saved");
        const clear = setTimeout(() => setSaveNote(""), 1500);
        return () => clearTimeout(clear);
      } catch {
        // ignore quota errors
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [language, codeMap, settings, autoSave]);

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () =>
      setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Bottom panel resize
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const next = rect.bottom - e.clientY;
      setBottomHeight(Math.min(Math.max(next, 120), rect.height * 0.75));
    };
    const onUp = () => {
      resizing.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Visual Debugger "Continue" auto-play
  useEffect(() => {
    if (!debugPlaying || !trace) return;
    const id = setInterval(() => {
      setDebugStepIndex((i) => {
        if (i >= trace.steps.length - 1) {
          setDebugPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 800);
    return () => clearInterval(id);
  }, [debugPlaying, trace]);

  const currentLang = getLanguage(language);
  const code = codeMap[language] ?? currentLang.template;

  const openAiPanel = () => {
    setAiPanelOpen(true);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setAiOverlayOpen(true);
    }
  };

  const handleCodeChange = useCallback(
    (value: string) => {
      setCodeMap((m) => ({ ...m, [language]: value }));
      // A manual edit moves the file past any applied fix — clear the
      // highlight rather than show a stale diff.
      setHighlightLines([]);
    },
    [language]
  );

  const handleLanguageChange = (id: LanguageConfig["id"]) => {
    setLanguage(id);
    setHighlightLines([]);
  };

  // ---- Permanent AI chat -------------------------------------------------

  const sendChat = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || chatBusy) return;

      const userMsg: ChatMessage = {
        id: makeId(),
        role: "user",
        kind: "text",
        timestamp: Date.now(),
        content: trimmed,
      };
      const loadingId = makeId();
      const loadingMsg: ChatMessage = {
        id: loadingId,
        role: "assistant",
        kind: "loading",
        timestamp: Date.now(),
        label: "Thinking…",
      };

      const apiMessages = [...buildApiHistory(messages), { role: "user" as const, content: trimmed }];

      setMessages((m) => [...m, userMsg, loadingMsg]);
      setChatInput("");
      setChatBusy(true);
      openAiPanel();

      const result = await sendChatMessage({ language, sourceCode: code, messages: apiMessages });

      setMessages((m) =>
        m.map((msg) =>
          msg.id === loadingId
            ? result.success
              ? ({
                  id: loadingId,
                  role: "assistant",
                  kind: "text",
                  timestamp: Date.now(),
                  content: result.reply,
                } as ChatMessage)
              : ({
                  id: loadingId,
                  role: "assistant",
                  kind: "error",
                  timestamp: Date.now(),
                  message: result.message,
                  retry: { type: "chat", text: trimmed },
                } as ChatMessage)
            : msg
        )
      );
      setChatBusy(false);
    },
    [chatBusy, language, code, messages]
  );

  const triggerAIExplain = useCallback(
    async (compilerError: string, forLanguage: string, forSourceCode: string) => {
      const userMsg: ChatMessage = {
        id: makeId(),
        role: "user",
        kind: "text",
        timestamp: Date.now(),
        content: `Compilation failed. Please explain this error:\n\n\`\`\`\n${compilerError}\n\`\`\``,
      };
      const loadingId = makeId();
      const loadingMsg: ChatMessage = {
        id: loadingId,
        role: "assistant",
        kind: "loading",
        timestamp: Date.now(),
        label: "Analyzing your error…",
      };

      setMessages((m) => [...m, userMsg, loadingMsg]);
      setChatBusy(true);
      openAiPanel();

      const result = await explainError({
        language: forLanguage,
        error: compilerError,
        sourceCode: forSourceCode,
      });

      setMessages((m) =>
        m.map((msg) =>
          msg.id === loadingId
            ? result.success
              ? ({
                  id: loadingId,
                  role: "assistant",
                  kind: "explanation",
                  timestamp: Date.now(),
                  explanation: result.explanation,
                  sourceLanguage: forLanguage,
                } as ChatMessage)
              : ({
                  id: loadingId,
                  role: "assistant",
                  kind: "error",
                  timestamp: Date.now(),
                  message: result.message,
                  retry: {
                    type: "explain",
                    compilerError,
                    language: forLanguage,
                    sourceCode: forSourceCode,
                  },
                } as ChatMessage)
            : msg
        )
      );
      setChatBusy(false);
    },
    []
  );

  const handleRetry = (msg: ErrorChatMessage) => {
    setChatBusy(true);
    setMessages((m) =>
      m.map((x) =>
        x.id === msg.id
          ? ({
              id: msg.id,
              role: "assistant",
              kind: "loading",
              timestamp: Date.now(),
              label: msg.retry.type === "chat" ? "Thinking…" : "Analyzing your error…",
            } as ChatMessage)
          : x
      )
    );

    (async () => {
      if (msg.retry.type === "chat") {
        const apiMessages = buildApiHistory(messages.filter((x) => x.id !== msg.id));
        const result = await sendChatMessage({ language, sourceCode: code, messages: apiMessages });
        setMessages((m) =>
          m.map((x) =>
            x.id === msg.id
              ? result.success
                ? ({ id: msg.id, role: "assistant", kind: "text", timestamp: Date.now(), content: result.reply } as ChatMessage)
                : ({ id: msg.id, role: "assistant", kind: "error", timestamp: Date.now(), message: result.message, retry: msg.retry } as ChatMessage)
              : x
          )
        );
      } else {
        const { compilerError, language: retryLang, sourceCode } = msg.retry;
        const result = await explainError({ language: retryLang, error: compilerError, sourceCode });
        setMessages((m) =>
          m.map((x) =>
            x.id === msg.id
              ? result.success
                ? ({
                    id: msg.id,
                    role: "assistant",
                    kind: "explanation",
                    timestamp: Date.now(),
                    explanation: result.explanation,
                    sourceLanguage: retryLang,
                  } as ChatMessage)
                : ({ id: msg.id, role: "assistant", kind: "error", timestamp: Date.now(), message: result.message, retry: msg.retry } as ChatMessage)
              : x
          )
        );
      }
      setChatBusy(false);
    })();
  };

  const getFixState = (id: string) => {
    const s = fixState[id];
    return { applied: s?.applied ?? false, canUndo: !!(s?.applied && s?.preSnapshot !== null) };
  };

  const handleApplyFix = (msg: ExplanationChatMessage) => {
    const targetLang = msg.sourceLanguage;
    const before = codeMap[targetLang] ?? getLanguage(targetLang).template;
    if (targetLang !== language) setLanguage(targetLang);
    setCodeMap((m) => ({ ...m, [targetLang]: msg.explanation.correctCode }));
    setFixState((fs) => ({ ...fs, [msg.id]: { applied: true, preSnapshot: before } }));
    setHighlightLines(changedLineNumbers(before, msg.explanation.correctCode));
  };

  const handleUndoFix = (msg: ExplanationChatMessage) => {
    const s = fixState[msg.id];
    if (!s?.applied || s.preSnapshot === null) return;
    const targetLang = msg.sourceLanguage;
    if (targetLang !== language) setLanguage(targetLang);
    setCodeMap((m) => ({ ...m, [targetLang]: s.preSnapshot as string }));
    setFixState((fs) => ({ ...fs, [msg.id]: { applied: false, preSnapshot: null } }));
    setHighlightLines([]);
  };

  const handleCompareChanges = (msg: ExplanationChatMessage) => {
    setDiffTarget(msg);
  };

  const handleAnalyze = useCallback(async () => {
    setAnalyzerOpen(true);
    setAnalyzerStatus("loading");
    setAnalyzerError(null);

    const result = await analyzeCode({ language, sourceCode: code });

    if (result.success) {
      setAnalysis(result.analysis);
      setAnalyzerStatus("success");
    } else {
      setAnalyzerError(result.message);
      setAnalyzerStatus("error");
    }
  }, [language, code]);

  const handleDebug = useCallback(async () => {
    setDebuggerOpen(true);
    setDebugStatus("loading");
    setDebugError(null);
    setDebugStepIndex(0);
    setDebugPlaying(false);
    setDebugLanguage(language);

    const result = await generateTrace({ language, sourceCode: code, stdin: input });

    if (result.success) {
      setTrace(result.trace);
      setDebugStatus("success");
    } else {
      setDebugError(result.message);
      setDebugStatus("error");
    }
  }, [language, code, input]);

  const handleDebugStepInto = () => {
    setDebugStepIndex((i) => Math.min(i + 1, (trace?.steps.length ?? 1) - 1));
  };

  const handleDebugStepOver = () => {
    setDebugStepIndex((i) => {
      const steps = trace?.steps ?? [];
      if (steps.length === 0) return i;
      const currentDepth = steps[i]?.callStack.length ?? 0;
      for (let j = i + 1; j < steps.length; j++) {
        if (steps[j].callStack.length <= currentDepth) return j;
      }
      return steps.length - 1;
    });
  };

  const handleDebugReset = () => {
    setDebugStepIndex(0);
    setDebugPlaying(false);
  };

  const handleDebugTogglePlay = () => {
    setDebugPlaying((p) => !p);
  };

  const handleDebugJumpToStep = (index: number) => {
    setDebugStepIndex(index);
    setDebugPlaying(false);
  };

  const handleExplain = useCallback(async () => {
    setLearningOpen(true);
    setLearningStatus("loading");
    setLearningError(null);

    const result = await learnCode({ language, sourceCode: code });

    if (result.success) {
      setLearningContent(result.content);
      setLearningStatus("success");
    } else {
      setLearningError(result.message);
      setLearningStatus("error");
    }
  }, [language, code]);

  const handleExploreTopic = (topic: string) => {
    setLearningOpen(false);
    void sendChat(`Explain the topic "${topic}" and how it relates to my current code.`);
  };

  const handleUseConvertedInEditor = (languageId: string, convertedCode: string) => {
    setCodeMap((m) => ({ ...m, [languageId]: convertedCode }));
    setLanguage(languageId);
    setHighlightLines([]);
    setConverterOpen(false);
  };

  // ---- Run / Compile ------------------------------------------------------

  const handleRun = useCallback(async () => {
    if (!currentLang.judge0Supported) {
      setBottomTab("errors");
      setStatus("error");
      setErrors(
        `${currentLang.label} execution isn't connected to the backend yet.\nSupported right now: C, C++, Java, Python, JavaScript, Go, Rust, PHP, Kotlin, C#.`
      );
      return;
    }

    setIsRunning(true);
    setStatus("running");
    setBottomTab("output");
    setOutput("");
    setErrors("");

    const result = await executeCode({
      language,
      sourceCode: code,
      stdin: input,
    });

    if (!result.success) {
      setStatus("error");
      setBottomTab("errors");
      setErrors(result.message);
      setExecutionTime("—");
      setMemoryUsage("—");
      setIsRunning(false);
      return;
    }

    const errorText = result.compileError
      ? `Compilation Error:\n${result.compileError}`
      : result.runtimeError
      ? `Runtime Error:\n${result.runtimeError}`
      : "";

    setOutput(result.output || "Program produced no output.");
    setErrors(errorText);
    setExecutionTime(formatTime(result.time));
    setMemoryUsage(formatMemory(result.memory));

    if (result.compileError) {
      void triggerAIExplain(result.compileError, language, code);
    }

    if (errorText) {
      setBottomTab("errors");
      setStatus("error");
    } else {
      setBottomTab("output");
      setStatus("success");
    }
    setIsRunning(false);
  }, [currentLang, language, code, input, triggerAIExplain]);

  const handleCompile = useCallback(async () => {
    if (!currentLang.judge0Supported) {
      setBottomTab("errors");
      setStatus("error");
      setErrors(
        `${currentLang.label} isn't connected to the backend yet.\nSupported right now: C, C++, Java, Python, JavaScript, Go, Rust, PHP, Kotlin, C#.`
      );
      return;
    }

    setIsCompiling(true);
    setStatus("running");
    setBottomTab("errors");
    setErrors("");

    const result = await executeCode({
      language,
      sourceCode: code,
      stdin: input,
    });

    if (!result.success) {
      setStatus("error");
      setErrors(result.message);
      setIsCompiling(false);
      return;
    }

    setExecutionTime(formatTime(result.time));
    setMemoryUsage(formatMemory(result.memory));

    if (result.compileError) {
      setErrors(`Compilation Error:\n${result.compileError}`);
      setStatus("error");
      void triggerAIExplain(result.compileError, language, code);
    } else if (result.languageType === "interpreted") {
      setErrors(
        `${currentLang.label} has no separate compile step — the interpreter checked your code while running it.\n\n0 errors, 0 warnings.`
      );
      setStatus("success");
    } else {
      setErrors("Compiled successfully.\n\n0 errors, 0 warnings.");
      setStatus("success");
    }
    setIsCompiling(false);
  }, [currentLang, language, code, input, triggerAIExplain]);

  const handleClear = () => {
    setCodeMap((m) => ({ ...m, [language]: "" }));
    setHighlightLines([]);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showExportNote("Code copied to clipboard");
    } catch {
      showExportNote("Couldn't copy — clipboard unavailable");
    }
  };

  const handleDownloadCode = useCallback(() => {
    downloadTextFile(`main.${currentLang.extension}`, code);
    showExportNote("Code downloaded");
  }, [code, currentLang]);

  const handleExportPdf = async () => {
    try {
      await exportTextAsPdf(
        `${currentLang.label} — main.${currentLang.extension}`,
        code,
        `main.${currentLang.extension}.pdf`
      );
      showExportNote("PDF exported");
    } catch {
      showExportNote("Couldn't export PDF");
    }
  };

  const handleShareLink = async () => {
    const url = buildShareUrl({ language, sourceCode: code });
    try {
      await navigator.clipboard.writeText(url);
      showExportNote("Share link copied to clipboard");
    } catch {
      showExportNote("Couldn't copy link — clipboard unavailable");
    }
  };

  const handlePrintCode = () => {
    printPlainText(`${currentLang.label} — main.${currentLang.extension}`, code);
  };

  const latestExplanationMessage = [...messages]
    .reverse()
    .find((m): m is ExplanationChatMessage => m.kind === "explanation");

  const handleDownloadExplanation = () => {
    if (!latestExplanationMessage) return;
    const md = formatExplanationMarkdown(
      latestExplanationMessage.explanation,
      getLanguage(latestExplanationMessage.sourceLanguage).label
    );
    downloadTextFile("ai-explanation.md", md, "text/markdown;charset=utf-8");
    showExportNote("AI explanation downloaded");
  };

  const handleDownloadCorrectedCode = () => {
    if (!latestExplanationMessage) return;
    const lang = getLanguage(latestExplanationMessage.sourceLanguage);
    downloadTextFile(
      `corrected.${lang.extension}`,
      latestExplanationMessage.explanation.correctCode
    );
    showExportNote("Corrected code downloaded");
  };

  const handleDownloadExecutionReport = () => {
    const report = formatExecutionReport({
      language: currentLang.label,
      sourceCode: code,
      stdin: input,
      output,
      errors,
      executionTime,
      memoryUsage,
      status,
    });
    downloadTextFile("execution-report.txt", report);
    showExportNote("Execution report downloaded");
  };

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      handleCodeChange(String(reader.result ?? ""));
    };
    reader.readAsText(file);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const diffOldCode = diffTarget
    ? fixState[diffTarget.id]?.applied
      ? fixState[diffTarget.id]!.preSnapshot ?? ""
      : codeMap[diffTarget.sourceLanguage] ?? ""
    : "";
  const diffNewCode = diffTarget?.explanation.correctCode ?? "";

  // Global keyboard shortcuts. Ctrl/Cmd combos work everywhere (including
  // while focused in Monaco, since none of them are Monaco's own default
  // bindings); the bare "?" help shortcut only fires outside text inputs so
  // it never interferes with typing.
  useEffect(() => {
    const anyModalOpen =
      shortcutsOpen ||
      !!diffTarget ||
      analyzerOpen ||
      debuggerOpen ||
      learningOpen ||
      converterOpen ||
      aiOverlayOpen;

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (e.key === "Escape" && anyModalOpen) {
        e.preventDefault();
        if (shortcutsOpen) setShortcutsOpen(false);
        else if (diffTarget) setDiffTarget(null);
        else if (analyzerOpen) setAnalyzerOpen(false);
        else if (debuggerOpen) {
          setDebuggerOpen(false);
          setDebugPlaying(false);
        } else if (learningOpen) setLearningOpen(false);
        else if (converterOpen) setConverterOpen(false);
        else if (aiOverlayOpen) setAiOverlayOpen(false);
        return;
      }

      if (mod && e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        void handleCompile();
        return;
      }
      if (mod && e.key === "Enter") {
        e.preventDefault();
        void handleRun();
        return;
      }
      if (mod && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        handleDownloadCode();
        return;
      }
      if (mod && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setAiPanelOpen((v) => !v);
        return;
      }
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setAiPanelOpen(true);
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          setAiOverlayOpen(true);
        }
        setTimeout(() => document.getElementById("ai-chat-input")?.focus(), 60);
        return;
      }

      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (!isTyping && e.shiftKey && e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    shortcutsOpen,
    diffTarget,
    analyzerOpen,
    debuggerOpen,
    learningOpen,
    converterOpen,
    aiOverlayOpen,
    handleRun,
    handleCompile,
    handleDownloadCode,
  ]);

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      <div
        ref={containerRef}
        className="flex flex-col bg-[var(--bg)]"
        style={{ height: "calc(100vh - " + NAVBAR_H + "px)", marginTop: NAVBAR_H }}
      >
        <Toolbar
          language={language}
          onLanguageChange={handleLanguageChange}
          onRun={handleRun}
          onCompile={handleCompile}
          onClear={handleClear}
          onUpload={handleUpload}
          isRunning={isRunning}
          isCompiling={isCompiling}
          fullscreen={fullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          settings={settings}
          onSettingsChange={setSettings}
          autoSave={autoSave}
          onAutoSaveChange={setAutoSave}
          onToggleAIPanel={() => setAiPanelOpen((v) => !v)}
          aiPanelOpen={aiPanelOpen}
          onAnalyze={handleAnalyze}
          isAnalyzing={analyzerOpen && analyzerStatus === "loading"}
          onDebug={handleDebug}
          isDebugging={debuggerOpen && debugStatus === "loading"}
          onExplain={handleExplain}
          isExplaining={learningOpen && learningStatus === "loading"}
          onConvert={() => setConverterOpen(true)}
          onDownloadCode={handleDownloadCode}
          onCopyCode={() => void handleCopyCode()}
          onExportPdf={() => void handleExportPdf()}
          onShareLink={() => void handleShareLink()}
          onPrintCode={handlePrintCode}
          onDownloadExplanation={handleDownloadExplanation}
          onDownloadCorrectedCode={handleDownloadCorrectedCode}
          onDownloadExecutionReport={handleDownloadExecutionReport}
          hasExplanation={!!latestExplanationMessage}
          hasCorrectedCode={!!latestExplanationMessage}
          hasExecutionResult={status !== "idle"}
          onShowShortcuts={() => setShortcutsOpen(true)}
        />

        <div className="flex flex-1 min-h-0">
          {/* Editor + bottom panel */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex-1 min-h-0">
              <CodeEditor
                language={currentLang.monacoId}
                value={code}
                onChange={handleCodeChange}
                settings={settings}
                highlightLines={highlightLines}
                currentLine={
                  debuggerOpen &&
                  debugStatus === "success" &&
                  trace &&
                  debugLanguage === language
                    ? trace.steps[debugStepIndex]?.line ?? null
                    : null
                }
              />
            </div>
            <div style={{ height: bottomHeight }} className="shrink-0">
              <BottomPanel
                activeTab={bottomTab}
                onTabChange={setBottomTab}
                input={input}
                onInputChange={setInput}
                output={output}
                errors={errors}
                executionTime={executionTime}
                memoryUsage={memoryUsage}
                status={status}
                onResizeStart={(e) => {
                  e.preventDefault();
                  resizing.current = true;
                }}
              />
            </div>
          </div>

          {/* Permanent AI Chat panel — desktop */}
          {aiPanelOpen && (
            <div className="hidden md:block w-[320px] shrink-0">
              <AIPanel
                messages={messages}
                busy={chatBusy}
                inputValue={chatInput}
                onInputChange={setChatInput}
                onSend={() => void sendChat(chatInput)}
                onQuickAction={(prompt) => void sendChat(prompt)}
                onRetry={handleRetry}
                getFixState={getFixState}
                onApplyFix={handleApplyFix}
                onUndoFix={handleUndoFix}
                onCompareChanges={handleCompareChanges}
                inputId="ai-chat-input"
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile AI overlay trigger */}
      <button
        onClick={() => setAiOverlayOpen(true)}
        className="md:hidden fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full bg-gradient-to-br from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] shadow-[0_10px_30px_-8px_rgba(184,146,255,0.5)] flex items-center justify-center"
        aria-label="Open AI Assistant"
      >
        <span className="text-[#0a0d13] font-display font-bold text-sm">AI</span>
      </button>

      {aiOverlayOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setAiOverlayOpen(false)}
          />
          <div className="relative w-[86%] max-w-sm">
            <AIPanel
              onClose={() => setAiOverlayOpen(false)}
              messages={messages}
              busy={chatBusy}
              inputValue={chatInput}
              onInputChange={setChatInput}
              onSend={() => void sendChat(chatInput)}
              onQuickAction={(prompt) => void sendChat(prompt)}
              onRetry={handleRetry}
              getFixState={getFixState}
              onApplyFix={handleApplyFix}
              onUndoFix={handleUndoFix}
              onCompareChanges={handleCompareChanges}
            />
          </div>
        </div>
      )}

      {saveNote && autoSave && (
        <div className="fixed bottom-5 left-5 z-40 font-mono text-[11px] text-[var(--syn-string)] glass rounded-full px-3 py-1.5">
          {saveNote}
        </div>
      )}

      {exportNote && (
        <div className="fixed bottom-5 left-5 z-40 font-mono text-[11px] text-[var(--syn-function)] glass rounded-full px-3 py-1.5">
          {exportNote}
        </div>
      )}

      {diffTarget && (
        <DiffModal
          open={!!diffTarget}
          onClose={() => setDiffTarget(null)}
          oldCode={diffOldCode}
          newCode={diffNewCode}
          language={getLanguage(diffTarget.sourceLanguage).label}
          onApply={() => handleApplyFix(diffTarget)}
          canApply
        />
      )}

      <AnalyzerModal
        open={analyzerOpen}
        onClose={() => setAnalyzerOpen(false)}
        language={currentLang.label}
        status={analyzerStatus}
        analysis={analysis}
        errorMessage={analyzerError}
        onRetry={() => void handleAnalyze()}
      />

      <VisualDebugger
        open={debuggerOpen}
        onClose={() => {
          setDebuggerOpen(false);
          setDebugPlaying(false);
        }}
        language={currentLang.label}
        sourceCode={code}
        status={debugStatus}
        trace={trace}
        errorMessage={debugError}
        currentStepIndex={debugStepIndex}
        playing={debugPlaying}
        onStepInto={handleDebugStepInto}
        onStepOver={handleDebugStepOver}
        onTogglePlay={handleDebugTogglePlay}
        onReset={handleDebugReset}
        onJumpToStep={handleDebugJumpToStep}
        onRetry={() => void handleDebug()}
      />

      <LearningModeModal
        open={learningOpen}
        onClose={() => setLearningOpen(false)}
        language={currentLang.label}
        status={learningStatus}
        content={learningContent}
        errorMessage={learningError}
        onRetry={() => void handleExplain()}
        onExploreTopic={handleExploreTopic}
      />

      <ConverterModal
        open={converterOpen}
        onClose={() => setConverterOpen(false)}
        initialSourceLanguage={language}
        getSourceCode={(id) => codeMap[id] ?? getLanguage(id).template}
        onUseInEditor={handleUseConvertedInEditor}
      />

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </main>
  );
}
