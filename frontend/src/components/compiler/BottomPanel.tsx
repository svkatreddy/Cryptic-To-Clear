"use client";

import { useState, useRef, useEffect } from "react";
import { GripHorizontal, CornerDownLeft } from "lucide-react";

export type BottomTab = "output" | "errors";

interface BottomPanelProps {
  output: string;
  errors: string;
  status: "idle" | "running" | "success" | "error";
  onResizeStart: (e: React.MouseEvent) => void;
  onSubmitInput?: (newInputLine: string) => void;
  onClearOutput?: () => void;
  isRunning?: boolean;
}

export default function BottomPanel({
  output,
  errors,
  status,
  onResizeStart,
  onSubmitInput,
  onClearOutput,
  isRunning = false,
}: BottomPanelProps) {
  const [terminalPrompt, setTerminalPrompt] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll output to bottom and focus input prompt when output or errors change
  useEffect(() => {
    if (status !== "idle") {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
      promptInputRef.current?.focus();
    }
  }, [output, errors, status]);

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
    <div className="flex h-full flex-col border-t border-[var(--border)] bg-[#0d1117] text-[var(--ink)] font-sans">
      {/* Drag handle */}
      <div
        onMouseDown={onResizeStart}
        className="h-2 w-full flex items-center justify-center cursor-row-resize group shrink-0 -mt-1 hover:bg-white/5 transition-colors"
      >
        <GripHorizontal className="h-3 w-8 text-[var(--ink-faint)] group-hover:text-[var(--ink-dim)] transition-colors" />
      </div>

      {/* Programiz Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] shrink-0 bg-[#161b22]">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[#e6edf3]">Output</span>
          {status === "running" && (
            <span className="text-[11px] font-mono text-amber-400 animate-pulse ml-2">
              Running...
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClearOutput}
          className="px-3 py-1 text-[12px] font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>

      {/* Clean Terminal Canvas: 100% blank at start */}
      <div
        onClick={() => {
          if (isExecutionActive) promptInputRef.current?.focus();
        }}
        className="flex-1 p-4 font-mono text-[13px] bg-[#0d1117] overflow-y-auto cursor-text flex flex-col selection:bg-blue-500/30 select-text"
      >
        {/* Errors (if any) */}
        {errors && (
          <pre className="whitespace-pre-wrap text-rose-400 font-mono text-[13px] leading-relaxed mb-2">
            {errors}
          </pre>
        )}

        {/* Stdout Output (Emitted by print statements & typed input lines) */}
        {output && (
          <div className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
            {output.split("\n").map((line, idx) => {
              const trimmed = line.trim();
              const isInputLine = trimmed.startsWith(">");
              return (
                <div
                  key={idx}
                  className={isInputLine ? "text-cyan-400 font-bold" : "text-[#e6edf3]"}
                >
                  {line}
                </div>
              );
            })}
          </div>
        )}

        {/* Terminal Input Prompt (Only shown when running or after execution starts) */}
        {isExecutionActive && (
          <form
            onSubmit={handleSendPrompt}
            className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10 shrink-0 font-mono"
          >
            <span className="text-emerald-400 font-bold text-[13px] shrink-0">$</span>
            <input
              ref={promptInputRef}
              type="text"
              value={terminalPrompt}
              onChange={(e) => setTerminalPrompt(e.target.value)}
              disabled={isRunning}
              placeholder={isRunning ? "Executing..." : "Enter input..."}
              className="flex-1 bg-transparent text-white font-mono text-[13px] placeholder:text-gray-600 border-none outline-none focus:ring-0 p-0 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isRunning || !terminalPrompt.trim()}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
            >
              <span>Enter</span>
              <CornerDownLeft className="h-3 w-3 text-emerald-400" />
            </button>
          </form>
        )}

        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
