"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RotateCcw,
  CornerDownRight,
  SkipForward,
  Play,
  Pause,
  RotateCw as ResetIcon,
  Variable,
  Layers,
  MemoryStick,
  ListOrdered,
  Terminal,
} from "lucide-react";
import type { ExecutionTrace } from "@/lib/api";
import CodeTraceView from "./CodeTraceView";

interface VisualDebuggerProps {
  open: boolean;
  onClose: () => void;
  language: string;
  sourceCode: string;
  status: "loading" | "success" | "error";
  trace: ExecutionTrace | null;
  errorMessage: string | null;
  currentStepIndex: number;
  playing: boolean;
  onStepInto: () => void;
  onStepOver: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onJumpToStep: (index: number) => void;
  onRetry: () => void;
}

function ControlButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  primary,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
        primary
          ? "text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110"
          : "glass hover:border-[var(--border-strong)]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export default function VisualDebugger({
  open,
  onClose,
  language,
  sourceCode,
  status,
  trace,
  errorMessage,
  currentStepIndex,
  playing,
  onStepInto,
  onStepOver,
  onTogglePlay,
  onReset,
  onJumpToStep,
  onRetry,
}: VisualDebuggerProps) {
  if (!open) return null;

  const steps = trace?.steps ?? [];
  const current = steps[currentStepIndex];
  const prev = currentStepIndex > 0 ? steps[currentStepIndex - 1] : undefined;
  const isLastStep = currentStepIndex >= steps.length - 1;

  const output = steps.slice(0, currentStepIndex + 1).map((s) => s.outputDelta).join("");

  const prevVarMap = new Map((prev?.variables ?? []).map((v) => [v.name, v.value]));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col glass-strong rounded-xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Visual Debugger"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[var(--border)] shrink-0">
          <div>
            <p className="text-[13.5px] font-medium text-[var(--ink)]">Visual Debugger</p>
            <p className="text-[11px] font-mono text-[var(--ink-faint)] mt-0.5">
              {language}
              {trace ? ` · ${trace.summary}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 flex items-center justify-center rounded-md text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {status === "loading" && (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="flex items-center gap-3">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="h-6 w-6 rounded-full border-2 border-[var(--syn-keyword)] border-t-transparent"
              />
              <p className="text-[13px] text-[var(--ink-dim)]">Simulating execution…</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex-1 p-6 space-y-3">
            <p className="text-[13px] text-[var(--ink)] font-medium">Couldn&apos;t start the debugger</p>
            <p className="text-[12px] text-[var(--ink-dim)] leading-relaxed">{errorMessage}</p>
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--syn-function)] hover:text-[var(--ink)] transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        )}

        {status === "success" && current && (
          <>
            {/* Controls */}
            <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 border-b border-[var(--border)] shrink-0 overflow-x-auto">
              <ControlButton icon={ResetIcon} label="Reset" onClick={onReset} />
              <ControlButton
                icon={CornerDownRight}
                label="Step Into"
                onClick={onStepInto}
                disabled={isLastStep}
              />
              <ControlButton
                icon={SkipForward}
                label="Step Over"
                onClick={onStepOver}
                disabled={isLastStep}
              />
              <ControlButton
                icon={playing ? Pause : Play}
                label={playing ? "Pause" : "Continue"}
                onClick={onTogglePlay}
                disabled={isLastStep && !playing}
                primary
              />
              <div className="flex-1" />
              <span className="text-[11.5px] font-mono text-[var(--ink-faint)] shrink-0">
                Step {currentStepIndex + 1} / {steps.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/5 shrink-0">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)]"
                animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 grid lg:grid-cols-[1fr_320px] gap-3 p-3 sm:p-4 overflow-hidden">
              {/* Left: code + output */}
              <div className="flex flex-col gap-3 min-h-0">
                <div className="flex-1 min-h-0">
                  <CodeTraceView sourceCode={sourceCode} currentLine={current.line} />
                </div>
                <div className="glass rounded-lg p-3 shrink-0 max-h-32 overflow-y-auto">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Terminal className="h-3 w-3 text-[var(--syn-string)]" />
                    <span className="text-[10.5px] font-mono text-[var(--ink-faint)] uppercase">Output</span>
                  </div>
                  <pre className="font-mono text-[11.5px] text-[var(--syn-string)] whitespace-pre-wrap">
                    {output || <span className="text-[var(--ink-faint)]">No output yet.</span>}
                  </pre>
                </div>
                <p className="text-[11.5px] text-[var(--ink-dim)] italic shrink-0">{current.description}</p>
              </div>

              {/* Right: variables / call stack / memory / steps */}
              <div className="flex flex-col gap-3 min-h-0 overflow-y-auto pr-0.5">
                {/* Variables */}
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Variable className="h-3.5 w-3.5 text-[var(--syn-function)]" />
                    <span className="text-[12px] font-medium text-[var(--ink)]">Variables</span>
                  </div>
                  {current.variables.length === 0 ? (
                    <p className="text-[11px] text-[var(--ink-faint)]">No variables in scope.</p>
                  ) : (
                    <ul className="space-y-1">
                      <AnimatePresence initial={false}>
                        {current.variables.map((v) => {
                          const changed = prevVarMap.has(v.name) && prevVarMap.get(v.name) !== v.value;
                          return (
                            <motion.li
                              key={v.name}
                              layout
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between gap-2 rounded-md px-2 py-1"
                              style={{ background: changed ? "rgba(255,216,102,0.12)" : "transparent" }}
                            >
                              <span className="font-mono text-[11.5px] text-[var(--ink)]">{v.name}</span>
                              <span className="font-mono text-[11px] text-[var(--syn-string)] truncate max-w-[130px]">
                                {v.value}
                              </span>
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </ul>
                  )}
                </div>

                {/* Call Stack */}
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Layers className="h-3.5 w-3.5 text-[var(--syn-keyword)]" />
                    <span className="text-[12px] font-medium text-[var(--ink)]">Call Stack</span>
                  </div>
                  <ul className="space-y-1">
                    <AnimatePresence initial={false}>
                      {[...current.callStack].reverse().map((fn, i) => (
                        <motion.li
                          key={fn + i}
                          layout
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`rounded-md px-2 py-1 font-mono text-[11.5px] ${
                            i === 0
                              ? "bg-[var(--syn-keyword)]/15 text-[var(--syn-keyword)]"
                              : "text-[var(--ink-dim)]"
                          }`}
                        >
                          {fn}()
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>

                {/* Memory */}
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MemoryStick className="h-3.5 w-3.5 text-[var(--syn-const)]" />
                    <span className="text-[12px] font-medium text-[var(--ink)]">Memory</span>
                    <span className="text-[9.5px] font-mono text-[var(--ink-faint)]">(simulated)</span>
                  </div>
                  {current.memory.length === 0 ? (
                    <p className="text-[11px] text-[var(--ink-faint)]">No allocations yet.</p>
                  ) : (
                    <ul className="space-y-1">
                      {current.memory.map((m, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 text-[11px] font-mono">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="rounded px-1 py-0.5 text-[9px] uppercase"
                              style={{
                                background: m.location === "heap" ? "rgba(184,146,255,0.15)" : "rgba(108,182,255,0.15)",
                                color: m.location === "heap" ? "var(--syn-keyword)" : "var(--syn-function)",
                              }}
                            >
                              {m.location}
                            </span>
                            <span className="text-[var(--ink)]">{m.name}</span>
                          </span>
                          <span className="text-[var(--ink-faint)] truncate max-w-[90px]">{m.value}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Execution Steps */}
                <div className="glass rounded-lg p-3 flex-1 min-h-[140px]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ListOrdered className="h-3.5 w-3.5 text-[var(--syn-string)]" />
                    <span className="text-[12px] font-medium text-[var(--ink)]">Execution Steps</span>
                  </div>
                  <ul className="space-y-0.5">
                    {steps.map((s, i) => (
                      <li key={s.step}>
                        <button
                          onClick={() => onJumpToStep(i)}
                          className={`w-full flex items-center gap-2 rounded-md px-2 py-1 text-left text-[11px] font-mono transition-colors ${
                            i === currentStepIndex
                              ? "bg-[var(--syn-string)]/15 text-[var(--syn-string)]"
                              : "text-[var(--ink-faint)] hover:text-[var(--ink-dim)] hover:bg-white/5"
                          }`}
                        >
                          <span className="w-5 shrink-0 text-right">{s.step}</span>
                          <span className="truncate">L{s.line} · {s.description}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
