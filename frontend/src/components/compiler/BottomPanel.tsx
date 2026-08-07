"use client";

import { useState, useRef, useEffect } from "react";
import { GripHorizontal, CornerDownLeft } from "lucide-react";

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
}

export default function BottomPanel({
  output,
  errors,
  status,
  onResizeStart,
  onSubmitInput,
  onClearOutput,
  isRunning = false,
  input = "",
  onInputChange,
  activeTab = "output",
  onTabChange,
}: BottomPanelProps) {
  const [terminalPrompt, setTerminalPrompt] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll output to bottom and focus input prompt when output or errors change
  useEffect(() => {
    if (status !== "idle" && activeTab === "output") {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
      promptInputRef.current?.focus();
    }
  }, [output, errors, status, activeTab]);

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

  const isExecutionActive = status !== "idle" || output.length > 0 || errors.length > 0;

  return (
    <div className="flex h-full flex-col border-t border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--ink)] font-sans">
      {/* Drag handle */}
      <div
        onMouseDown={onResizeStart}
        className="h-2 w-full flex items-center justify-center cursor-row-resize group shrink-0 -mt-1 hover:bg-[var(--border)] transition-colors"
      >
        <GripHorizontal className="h-3 w-8 text-[var(--ink-faint)] group-hover:text-[var(--ink-dim)] transition-colors" />
      </div>

      {/* Programiz Header Bar with Tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] shrink-0 bg-[var(--panel)]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onTabChange?.("output")}
            className={`px-3 py-1 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "output"
                ? "bg-[var(--bg)] text-[var(--ink)] shadow-sm font-semibold"
                : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
            }`}
          >
            <span>Output</span>
            {status === "running" && (
              <span className="h-2 w-2 rounded-full bg-[var(--syn-const)] animate-ping ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.("stdin")}
            className={`px-3 py-1 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "stdin"
                ? "bg-[var(--bg)] text-[var(--ink)] shadow-sm font-semibold"
                : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
            }`}
          >
            <span>Input (STDIN)</span>
            {input && input.trim().length > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--syn-function)] ml-1" />
            )}
          </button>

          {errors && (
            <button
              type="button"
              onClick={() => onTabChange?.("errors")}
              className={`px-3 py-1 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === "errors"
                  ? "bg-[var(--bg)] text-[var(--syn-const)] shadow-sm font-semibold"
                  : "text-[var(--syn-const)]/70 hover:text-[var(--syn-const)]"
              }`}
            >
              <span>Errors</span>
              <span className="h-2 w-2 rounded-full bg-[var(--syn-const)] ml-1" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClearOutput}
          className="px-3 py-1 text-[12px] font-medium text-[var(--ink-dim)] hover:text-[var(--ink)] glass border border-[var(--border)] rounded-md transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "stdin" ? (
        <div className="flex-1 p-3 bg-[var(--bg)] flex flex-col font-mono text-[13px]">
          <textarea
            value={input}
            onChange={(e) => onInputChange?.(e.target.value)}
            placeholder="Type standard input (STDIN) here before running your program..."
            className="w-full flex-1 bg-transparent text-[var(--ink)] placeholder:text-[var(--ink-faint)] border border-[var(--border)] rounded-lg p-3 font-mono text-[13px] outline-none focus:border-[var(--syn-function)] transition-colors resize-none"
          />
        </div>
      ) : activeTab === "errors" ? (
        <div className="flex-1 p-4 font-mono text-[13px] bg-[var(--bg)] overflow-y-auto select-text">
          <pre className="whitespace-pre-wrap text-[var(--syn-const)] leading-relaxed">
            {errors}
          </pre>
        </div>
      ) : (
        /* Output Tab View */
        <div
          onClick={() => {
            if (isExecutionActive) promptInputRef.current?.focus();
          }}
          className="flex-1 p-4 font-mono text-[13px] bg-[var(--bg)] overflow-y-auto cursor-text flex flex-col selection:bg-blue-500/30 select-text"
        >
          {/* Errors (if any) */}
          {errors && (
            <pre className="whitespace-pre-wrap text-[var(--syn-const)] font-mono text-[13px] leading-relaxed mb-2">
              {errors}
            </pre>
          )}

          {/* Stdout Output & Input lines */}
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
                const isPromptText = promptMatch && /^(enter|input|type|please|what|how|select|choose)\b|[:?=>$]$/i.test(promptMatch[1].trim());
                const isResultHeader = promptMatch && /^(name|age|cgpa|score|result|output|total|sum|diff|product|count):/i.test(promptMatch[1].trim());

                if (promptMatch && isPromptText && !isResultHeader) {
                  return (
                    <div key={idx} className="text-[var(--ink)]">
                      <span>{promptMatch[1]}</span>
                      <span className="text-[var(--syn-function)] font-bold">{promptMatch[2]}</span>
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

          {/* Terminal Input Prompt */}
          {isExecutionActive && (
            <form
              onSubmit={handleSendPrompt}
              className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border)] shrink-0 font-mono"
            >
              <span className="text-[var(--syn-string)] font-bold text-[13px] shrink-0">$</span>
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
      )}
    </div>
  );
}
