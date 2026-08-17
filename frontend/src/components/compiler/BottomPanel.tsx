"use client";

import { useState, useRef, useEffect } from "react";
import {
  GripHorizontal,
  Terminal,
  FileText,
  AlertCircle,
  Trash2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  CornerDownLeft,
  Play,
  Plus,
  Square,
} from "lucide-react";

export type BottomTab = "output" | "testcases" | "stdin" | "errors";

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  status?: "idle" | "running" | "pass" | "fail" | "error";
  error?: string;
}

interface BottomPanelProps {
  output: string;
  errors: string;
  status: "idle" | "running" | "success" | "error";
  onResizeStart: (e: React.MouseEvent) => void;
  onSubmitInput?: (newInputLine: string) => void;
  onClearOutput?: () => void;
  onStopExecution?: () => void;
  isRunning?: boolean;
  input?: string;
  onInputChange?: (val: string) => void;
  activeTab?: BottomTab;
  onTabChange?: (tab: BottomTab) => void;
  testCases?: TestCase[];
  onTestCasesChange?: (testCases: TestCase[]) => void;
  onRunTestCases?: (testCases: TestCase[]) => void;
  executionTime?: string;
  memoryUsage?: string;
  onTriggerAiExplain?: () => void;
}

export default function BottomPanel({
  output,
  errors,
  status,
  onResizeStart,
  onSubmitInput,
  onClearOutput,
  onStopExecution,
  isRunning = false,
  input = "",
  onInputChange,
  activeTab = "output",
  onTabChange,
  testCases = [],
  onTestCasesChange,
  onRunTestCases,
  executionTime = "—",
  memoryUsage = "—",
  onTriggerAiExplain,
}: BottomPanelProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);
  const [terminalPrompt, setTerminalPrompt] = useState("");

  const hasExecutionResult =
    status !== "idle" || output.length > 0 || errors.length > 0;

  // Keep the latest output visible
  useEffect(() => {
    if (hasExecutionResult) {
      terminalEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [output, errors, status, hasExecutionResult]);

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalPrompt.trim()) return;
    const valueToSend = terminalPrompt;
    setTerminalPrompt("");
    if (onSubmitInput) {
      onSubmitInput(valueToSend);
    }
    setTimeout(() => {
      promptInputRef.current?.focus();
    }, 50);
  };

  const handleAddTestCase = () => {
    const newCase: TestCase = {
      id: `tc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      input: "",
      expectedOutput: "",
      status: "idle",
    };
    onTestCasesChange?.([...testCases, newCase]);
  };

  const handleRemoveTestCase = (id: string) => {
    onTestCasesChange?.(testCases.filter((tc) => tc.id !== id));
  };

  const handleUpdateTestCase = (
    id: string,
    field: "input" | "expectedOutput",
    val: string
  ) => {
    onTestCasesChange?.(
      testCases.map((tc) =>
        tc.id === id ? { ...tc, [field]: val, status: "idle" } : tc
      )
    );
  };

  const isExecutionActive =
    status !== "idle" || output.length > 0 || errors.length > 0;
  const passedCount = testCases.filter((tc) => tc.status === "pass").length;

  return (
    <div className="flex h-full flex-col border-t border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--ink)] font-sans select-none">
      {/* Drag handle */}
      <div
        onMouseDown={onResizeStart}
        className="h-2 w-full flex items-center justify-center cursor-row-resize group shrink-0 hover:bg-[var(--border)] transition-colors"
      >
        <GripHorizontal className="h-2 w-8 text-[var(--ink-faint)] group-hover:text-[var(--ink-dim)] transition-colors" />
      </div>

      {/* Header Bar with Tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] shrink-0 bg-[var(--panel)]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => onTabChange?.("output")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-mono transition-all cursor-pointer ${activeTab === "output"
              ? "bg-[var(--bg)] text-[var(--ink)] font-bold shadow-sm border border-[var(--border)]"
              : "text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-white/5"
              }`}
          >
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span>Output</span>
            {output && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.("testcases")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-mono transition-all cursor-pointer ${activeTab === "testcases"
              ? "bg-[var(--bg)] text-[var(--ink)] font-bold shadow-sm border border-[var(--border)]"
              : "text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-white/5"
              }`}
          >
            <Play className="h-3.5 w-3.5 text-purple-400" />
            <span>Test Cases</span>
            {testCases.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                {passedCount}/{testCases.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.("stdin")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-mono transition-all cursor-pointer ${activeTab === "stdin"
              ? "bg-[var(--bg)] text-[var(--ink)] font-bold shadow-sm border border-[var(--border)]"
              : "text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-white/5"
              }`}
          >
            <FileText className="h-3.5 w-3.5 text-cyan-400" />
            <span>Input (STDIN)</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.("errors")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-mono transition-all cursor-pointer ${activeTab === "errors"
              ? "bg-[var(--bg)] text-[var(--ink)] font-bold shadow-sm border border-[var(--border)]"
              : "text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-white/5"
              }`}
          >
            <AlertCircle
              className={`h-3.5 w-3.5 ${errors ? "text-rose-400" : "text-gray-400"
                }`}
            />
            <span>Errors & Diagnostics</span>
            {errors && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                !
              </span>
            )}
          </button>
        </div>

        {/* Status Metrics & Action Controls */}
        <div className="flex items-center gap-3">
          {hasExecutionResult && !isRunning && (
            <div className="hidden sm:flex items-center gap-2.5 text-[11px] font-mono text-[var(--ink-dim)] border-r border-[var(--border)] pr-3">
              <span className="flex items-center gap-1" title="Execution Time">
                <Clock className="h-3 w-3 text-cyan-400" />
                {executionTime}
              </span>
              <span className="flex items-center gap-1" title="Memory Used">
                <HardDrive className="h-3 w-3 text-indigo-400" />
                {memoryUsage}
              </span>
            </div>
          )}

          {isRunning && onStopExecution && (
            <button
              type="button"
              onClick={onStopExecution}
              className="px-3 py-1 text-[12px] font-medium text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 rounded-md transition-colors cursor-pointer flex items-center gap-1 font-mono"
            >
              <Square className="h-3 w-3 fill-rose-400" />
              <span>Stop</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClearOutput}
            className="px-3 py-1 text-[12px] font-medium text-[var(--ink-dim)] hover:text-[var(--ink)] glass border border-[var(--border)] rounded-md transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Instant Tab Switching (Using CSS hidden class to eliminate tab lag) */}

      {/* Output Tab View */}
      <div
        onClick={() => {
          if (isExecutionActive) promptInputRef.current?.focus();
        }}
        className={`flex-1 p-4 font-mono text-[13px] bg-[var(--bg)] overflow-y-auto cursor-text flex-col selection:bg-blue-500/30 select-text ${activeTab === "output" ? "flex" : "hidden"
          }`}
      >
        {errors && (
          <pre className="whitespace-pre-wrap text-[var(--syn-const)] font-mono text-[13px] leading-relaxed mb-2">
            {errors}
          </pre>
        )}

        {output ? (
          <div className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
            {output.split("\n").map((line, idx) => {
              const trimmed = line.trim();
              if (trimmed.startsWith(">")) {
                return (
                  <div key={idx} className="text-[var(--syn-function)] font-bold">
                    {line}
                  </div>
                );
              }

              const promptMatch = line.match(/^(.+?[:?=>$]\s*)(\S+.*)$/);
              const isPromptText =
                promptMatch &&
                /^(enter|input|type|please|what|how|select|choose)\b|[:?=>$]$/i.test(
                  promptMatch[1].trim()
                );
              const isResultHeader =
                promptMatch &&
                /^(name|age|cgpa|score|result|output|total|sum|diff|product|count):/i.test(
                  promptMatch[1].trim()
                );

              if (promptMatch && isPromptText && !isResultHeader) {
                return (
                  <div key={idx} className="text-[var(--ink)]">
                    <span>{promptMatch[1]}</span>
                    <span className="text-[var(--syn-function)] font-bold">
                      {promptMatch[2]}
                    </span>
                  </div>
                );
              }

              return (
                <div key={idx} className="text-[var(--ink)]">
                  {line}
                </div>
              );
            })}
          </div>
        ) : (
          status === "idle" && (
            <div className="text-[var(--ink-faint)] italic select-none">
              Output will appear here after execution...
            </div>
          )
        )}

        {isExecutionActive && (
          <form
            onSubmit={handleSendPrompt}
            className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border)] shrink-0 font-mono"
          >
            <span className="text-[var(--syn-string)] font-bold text-[13px] shrink-0">
              $
            </span>
            <input
              ref={promptInputRef}
              type="text"
              value={terminalPrompt}
              onChange={(e) => setTerminalPrompt(e.target.value)}
              disabled={isRunning}
              placeholder={isRunning ? "Executing..." : "Enter input..."}
              className="flex-1 bg-transparent text-[var(--ink)] font-mono text-[13px] placeholder:text-[var(--ink-faint)] border-none outline-none focus:ring-0 p-0 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isRunning || !terminalPrompt.trim()}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded bg-[var(--syn-string)]/20 hover:bg-[var(--syn-string)]/30 text-[var(--syn-string)] border border-[var(--syn-string)]/30 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
            >
              <span>Enter</span>
              <CornerDownLeft className="h-3 w-3 text-[var(--syn-string)]" />
            </button>
          </form>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Test Cases Tab View */}
      <div
        className={`flex-1 p-4 bg-[var(--bg)] overflow-y-auto flex-col font-mono text-[13px] gap-4 ${activeTab === "testcases" ? "flex" : "hidden"
          }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3 shrink-0">
          <div>
            <h4 className="font-bold text-[var(--ink)] text-sm">Test Case Runner</h4>
            <p className="text-[11px] text-[var(--ink-dim)]">
              Define custom input & expected output pairs to verify program correctness.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddTestCase}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--border)] text-xs font-semibold text-[var(--ink)] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Test Case</span>
            </button>

            {testCases.length > 0 && onRunTestCases && (
              <button
                type="button"
                onClick={() => onRunTestCases(testCases)}
                disabled={isRunning}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-emerald-300" />
                <span>Run All Cases</span>
              </button>
            )}
          </div>
        </div>

        {testCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-[var(--border)] rounded-xl my-auto">
            <p className="text-xs text-[var(--ink-dim)] mb-3">
              No custom test cases added yet.
            </p>
            <button
              type="button"
              onClick={handleAddTestCase}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
            >
              + Create First Test Case
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {testCases.map((tc, idx) => (
              <div
                key={tc.id}
                className={`p-3 rounded-xl border transition-colors ${tc.status === "pass"
                  ? "bg-emerald-950/10 border-emerald-500/30"
                  : tc.status === "fail" || tc.status === "error"
                    ? "bg-rose-950/10 border-rose-500/30"
                    : "bg-[var(--panel)] border-[var(--border)]"
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[var(--ink-dim)]">
                      Test Case #{idx + 1}
                    </span>
                    {tc.status === "pass" && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" /> Passed
                      </span>
                    )}
                    {tc.status === "fail" && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <XCircle className="h-3 w-3" /> Failed
                      </span>
                    )}
                    {tc.status === "running" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                        Running...
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTestCase(tc.id)}
                    className="text-[var(--ink-dim)] hover:text-rose-400 p-1 transition-colors cursor-pointer"
                    title="Delete Test Case"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-[var(--ink-dim)] mb-1">
                      Input (STDIN)
                    </label>
                    <textarea
                      value={tc.input}
                      onChange={(e) =>
                        handleUpdateTestCase(tc.id, "input", e.target.value)
                      }
                      placeholder="Input data for this test case..."
                      rows={2}
                      className="w-full bg-[var(--bg)] text-[var(--ink)] border border-[var(--border)] rounded-md p-2 font-mono text-xs outline-none focus:border-[var(--syn-function)] transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[var(--ink-dim)] mb-1">
                      Expected Output
                    </label>
                    <textarea
                      value={tc.expectedOutput}
                      onChange={(e) =>
                        handleUpdateTestCase(tc.id, "expectedOutput", e.target.value)
                      }
                      placeholder="Expected stdout output..."
                      rows={2}
                      className="w-full bg-[var(--bg)] text-[var(--ink)] border border-[var(--border)] rounded-md p-2 font-mono text-xs outline-none focus:border-[var(--syn-function)] transition-colors resize-none"
                    />
                  </div>
                </div>

                {tc.actualOutput !== undefined && (
                  <div className="mt-2.5 pt-2.5 border-t border-[var(--border)] text-xs font-mono">
                    <span className="text-[11px] text-[var(--ink-dim)] block mb-1">
                      Actual Output:
                    </span>
                    <pre className="p-2 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {tc.actualOutput || "(empty)"}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STDIN Input View */}
      <div
        className={`flex-1 p-3 bg-[var(--bg)] flex-col font-mono text-[13px] ${activeTab === "stdin" ? "flex" : "hidden"
          }`}
      >
        <textarea
          value={input}
          onChange={(e) => onInputChange?.(e.target.value)}
          placeholder="Type standard input (STDIN) here before running your program..."
          className="w-full flex-1 bg-transparent text-[var(--ink)] placeholder:text-[var(--ink-faint)] border border-[var(--border)] rounded-lg p-3 font-mono text-[13px] outline-none focus:border-[var(--syn-function)] transition-colors resize-none"
        />
      </div>

      {/* Errors Tab View */}
      <div
        className={`flex-1 p-4 font-mono text-[13px] bg-[var(--bg)] overflow-y-auto select-text flex-col ${activeTab === "errors" ? "flex" : "hidden"
          }`}
      >
        {errors ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <AlertCircle className="h-4 w-4" />
                <span>Compiler / Runtime Diagnostics</span>
              </div>

              {onTriggerAiExplain && (
                <button
                  onClick={onTriggerAiExplain}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Ask AI to Explain & Fix</span>
                </button>
              )}
            </div>

            <pre className="whitespace-pre-wrap text-rose-300 bg-[var(--bg-elevated)] p-4 rounded-xl border border-rose-500/20 leading-relaxed overflow-x-auto text-[12.5px]">
              {errors}
            </pre>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-[var(--ink-faint)] italic select-none">
            <CheckCircle2 className="h-8 w-8 mb-2 text-emerald-400 opacity-40" />
            <p>No compilation or runtime errors reported.</p>
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
