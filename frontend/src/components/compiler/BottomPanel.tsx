"use client";

import { useState } from "react";
import { Terminal, FileInput, AlertTriangle, Clock, Cpu, GripHorizontal } from "lucide-react";

export type BottomTab = "input" | "output" | "errors";

interface BottomPanelProps {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
  input: string;
  onInputChange: (v: string) => void;
  output: string;
  errors: string;
  executionTime: string;
  memoryUsage: string;
  status: "idle" | "running" | "success" | "error";
  onResizeStart: (e: React.MouseEvent) => void;
}

const TABS: { id: BottomTab; label: string; icon: typeof Terminal }[] = [
  { id: "input", label: "Input", icon: FileInput },
  { id: "output", label: "Output", icon: Terminal },
  { id: "errors", label: "Compiler Errors", icon: AlertTriangle },
];

export default function BottomPanel({
  activeTab,
  onTabChange,
  input,
  onInputChange,
  output,
  errors,
  executionTime,
  memoryUsage,
  status,
  onResizeStart,
}: BottomPanelProps) {
  const [errorCount] = useState(0);

  return (
    <div className="flex h-full flex-col glass-strong border-t border-[var(--border)]">
      {/* Drag handle */}
      <div
        onMouseDown={onResizeStart}
        className="h-2 w-full flex items-center justify-center cursor-row-resize group shrink-0 -mt-1"
      >
        <GripHorizontal className="h-3 w-8 text-[var(--ink-faint)] group-hover:text-[var(--ink-dim)] transition-colors" />
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-between px-3 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-mono transition-colors ${
                activeTab === tab.id
                  ? "text-[var(--ink)]"
                  : "text-[var(--ink-faint)] hover:text-[var(--ink-dim)]"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.id === "errors" && errorCount > 0 && (
                <span className="ml-0.5 rounded-full bg-[var(--syn-const)]/20 text-[var(--syn-const)] text-[10px] px-1.5">
                  {errorCount}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute left-2 right-2 -bottom-px h-px bg-gradient-to-r from-[var(--syn-keyword)] to-[var(--syn-function)]" />
              )}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 py-2">
          <span
            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
              status === "running"
                ? "bg-[var(--syn-cursor)] animate-pulse"
                : status === "success"
                ? "bg-[var(--syn-string)]"
                : status === "error"
                ? "bg-[var(--syn-const)]"
                : "bg-[var(--ink-faint)]"
            }`}
          />
          <div className="hidden sm:flex items-center gap-1.5 text-[11.5px] font-mono text-[var(--ink-faint)]">
            <Clock className="h-3.5 w-3.5" />
            {executionTime}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11.5px] font-mono text-[var(--ink-faint)]">
            <Cpu className="h-3.5 w-3.5" />
            {memoryUsage}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === "input" && (
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Type stdin input for your program here…"
            spellCheck={false}
            className="w-full h-full resize-none bg-transparent p-4 font-mono text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none"
          />
        )}

        {activeTab === "output" && (
          <pre className="w-full h-full p-4 font-mono text-[13px] whitespace-pre-wrap text-[var(--syn-string)]">
            {output || (
              <span className="text-[var(--ink-faint)]">
                Run your code to see output here.
              </span>
            )}
          </pre>
        )}

        {activeTab === "errors" && (
          <pre className="w-full h-full p-4 font-mono text-[13px] whitespace-pre-wrap text-[var(--syn-const)]">
            {errors || (
              <span className="text-[var(--ink-faint)]">
                No compiler errors yet — compile your code to check.
              </span>
            )}
          </pre>
        )}
      </div>
    </div>
  );
}
