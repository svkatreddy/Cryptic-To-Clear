"use client";

import { useRef, useEffect } from "react";
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
} from "lucide-react";

export type BottomTab = "output" | "stdin" | "errors";

interface BottomPanelProps {
  output: string;
  errors: string;
  status: "idle" | "running" | "success" | "error";
  onResizeStart: (e: React.MouseEvent) => void;
  onSubmitInput?: (newInputLine: string) => void;
  onClearOutput?: () => void;
  isRunning?: boolean;
  input?: string;
  onInputChange?: (val: string) => void;
  activeTab?: BottomTab;
  onTabChange?: (tab: BottomTab) => void;
  executionTime?: string;
  memoryUsage?: string;
  onTriggerAiExplain?: () => void;
}

export default function BottomPanel({
  output,
  errors,
  status,
  onResizeStart,
  onClearOutput,
  isRunning = false,
  input = "",
  onInputChange,
  activeTab = "output",
  onTabChange,
  executionTime = "—",
  memoryUsage = "—",
  onTriggerAiExplain,
}: BottomPanelProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

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

  const currentTab = activeTab || (errors ? "errors" : "output");

  return (
    <div className="flex h-full flex-col border-t border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--ink)] font-sans select-none">
      {/* Drag handle */}
      <div
        onMouseDown={onResizeStart}
        className="h-2 w-full flex items-center justify-center cursor-row-resize group shrink-0 hover:bg-[var(--border)] transition-colors"
      >
        <GripHorizontal className="h-2 w-8 text-[var(--ink-faint)] group-hover:text-[var(--ink-dim)] transition-colors" />
      </div>

      {/* Terminal Header & Navigation Tabs */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-[var(--border)] shrink-0 bg-[var(--panel)]">
        {/* Tab selection buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTabChange?.("output")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-mono transition-all cursor-pointer ${
              currentTab === "output"
                ? "bg-[var(--bg)] text-[var(--ink)] font-bold shadow-sm border border-[var(--border)]"
                : "text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-white/5"
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span>Output</span>
            {output && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => onTabChange?.("stdin")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-mono transition-all cursor-pointer ${
              currentTab === "stdin"
                ? "bg-[var(--bg)] text-[var(--ink)] font-bold shadow-sm border border-[var(--border)]"
                : "text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-white/5"
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-purple-400" />
            <span>STDIN Input</span>
            {input.trim() && (
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            )}
          </button>

          <button
            onClick={() => onTabChange?.("errors")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-mono transition-all cursor-pointer ${
              currentTab === "errors"
                ? "bg-[var(--bg)] text-[var(--ink)] font-bold shadow-sm border border-[var(--border)]"
                : "text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-white/5"
            }`}
          >
            <AlertCircle
              className={`h-3.5 w-3.5 ${
                errors ? "text-rose-400" : "text-gray-400"
              }`}
            />
            <span>Errors & Logs</span>
            {errors && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                1
              </span>
            )}
          </button>
        </div>

        {/* Header Right Status Metrics & Action Controls */}
        <div className="flex items-center gap-3">
          {/* Execution Time & Memory Stats */}
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

          {/* Running status badge */}
          {isRunning ? (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              Executing...
            </span>
          ) : status === "success" ? (
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" />
              Exit Code 0
            </span>
          ) : status === "error" ? (
            <span className="flex items-center gap-1 text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              <XCircle className="h-3 w-3" />
              Exit Code 1
            </span>
          ) : null}

          {/* Clear button */}
          <button
            type="button"
            onClick={onClearOutput}
            title="Clear output terminal"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-[var(--ink-dim)] hover:text-[var(--ink)] glass border border-[var(--border)] rounded-md transition-colors cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal View Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg)] p-4 font-mono text-[13px] leading-relaxed select-text">
        {/* TAB 1: OUTPUT */}
        {currentTab === "output" && (
          <div className="space-y-4">
            {output ? (
              <div className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-[var(--ink)]">
                {output.split("\n").map((line, idx) => {
                  const trimmed = line.trim();
                  if (trimmed.startsWith(">")) {
                    return (
                      <div
                        key={idx}
                        className="text-[var(--syn-function)] font-bold py-0.5"
                      >
                        {line}
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="text-[var(--ink)] py-0.5">
                      {line}
                    </div>
                  );
                })}
              </div>
            ) : !errors && status === "idle" ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--ink-faint)] italic select-none">
                <Terminal className="h-8 w-8 mb-2 opacity-30" />
                <p>Program output will appear here after execution...</p>
              </div>
            ) : errors ? (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <p className="font-bold mb-1">Execution completed with errors.</p>
                <p className="text-[var(--ink-dim)]">
                  Check the <strong className="text-rose-400">Errors & Logs</strong> tab for details.
                </p>
              </div>
            ) : null}

            {/* Termination Banner */}
            {hasExecutionResult && !isRunning && (
              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--ink-dim)]">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      status === "success"
                        ? "h-2 w-2 rounded-full bg-emerald-400"
                        : "h-2 w-2 rounded-full bg-rose-400"
                    }
                  />
                  <span>
                    {status === "success"
                      ? "Process terminated cleanly (Exit Code 0)."
                      : "Process terminated with error status (Exit Code 1)."}
                  </span>
                </div>
                <span>
                  Runtime: {executionTime} | Memory: {memoryUsage}
                </span>
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>
        )}

        {/* TAB 2: STDIN INPUT */}
        {currentTab === "stdin" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-[var(--ink-dim)] uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-purple-400" />
                Standard Input (STDIN)
              </label>
              <span className="text-[11px] text-[var(--ink-faint)]">
                Provide inputs line-by-line before running
              </span>
            </div>

            <textarea
              value={input}
              onChange={(e) => onInputChange?.(e.target.value)}
              disabled={isRunning}
              placeholder="e.g. 5&#10;10 20 30"
              spellCheck={false}
              className="w-full min-h-[140px] resize-y rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-[13px] font-mono text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none transition-all focus:border-[var(--syn-function)] focus:ring-1 focus:ring-[var(--syn-function)] disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        )}

        {/* TAB 3: ERRORS & COMPILER LOGS */}
        {currentTab === "errors" && (
          <div className="space-y-4">
            {errors ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <AlertCircle className="h-4 w-4" />
                    <span>Compiler / Runtime Diagnostics</span>
                  </div>

                  {/* Explicit AI Explanation Button (Item 3 Pedagogical Fix) */}
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
        )}
      </div>
    </div>
  );
}