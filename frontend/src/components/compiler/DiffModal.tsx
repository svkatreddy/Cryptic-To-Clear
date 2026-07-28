"use client";

import { X, Wand2 } from "lucide-react";
import { computeUnifiedDiff } from "@/lib/diff";

interface DiffModalProps {
  open: boolean;
  onClose: () => void;
  oldCode: string;
  newCode: string;
  language: string;
  onApply?: () => void;
  canApply?: boolean;
}

export default function DiffModal({
  open,
  onClose,
  oldCode,
  newCode,
  language,
  onApply,
  canApply,
}: DiffModalProps) {
  if (!open) return null;

  const diff = computeUnifiedDiff(oldCode, newCode);
  const additions = diff.filter((l) => l.type === "added").length;
  const deletions = diff.filter((l) => l.type === "removed").length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col glass-strong rounded-xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Compare Changes"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[var(--border)] shrink-0">
          <div>
            <p className="text-[13.5px] font-medium text-[var(--ink)]">
              Compare Changes
            </p>
            <p className="text-[11px] font-mono mt-0.5">
              <span className="text-[var(--syn-string)]">+{additions}</span>{" "}
              <span className="text-[var(--syn-const)]">-{deletions}</span>{" "}
              <span className="text-[var(--ink-faint)]">· {language}</span>
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

        {/* Diff body */}
        <div className="flex-1 overflow-auto font-mono text-[12px]">
          {diff.map((line, i) => {
            const bg =
              line.type === "added"
                ? "bg-[rgba(46,160,67,0.15)]"
                : line.type === "removed"
                ? "bg-[rgba(248,81,73,0.15)]"
                : "";
            const marker =
              line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
            const markerColor =
              line.type === "added"
                ? "text-[var(--syn-string)]"
                : line.type === "removed"
                ? "text-[var(--syn-const)]"
                : "text-[var(--ink-faint)]";

            return (
              <div key={i} className={`flex ${bg}`}>
                <span className="w-10 shrink-0 text-right pr-2 text-[var(--ink-faint)] select-none border-r border-[var(--border)]">
                  {line.oldLineNo ?? ""}
                </span>
                <span className="w-10 shrink-0 text-right pr-2 text-[var(--ink-faint)] select-none border-r border-[var(--border)]">
                  {line.newLineNo ?? ""}
                </span>
                <span className={`w-5 shrink-0 text-center select-none ${markerColor}`}>
                  {marker}
                </span>
                <span className="flex-1 whitespace-pre-wrap break-all pr-4 text-[var(--ink)]">
                  {line.content || " "}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-4 sm:px-5 py-3.5 border-t border-[var(--border)] shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-[12.5px] font-medium glass hover:border-[var(--border-strong)] transition-colors"
          >
            Close
          </button>
          {onApply && (
            <button
              onClick={() => {
                onApply();
                onClose();
              }}
              disabled={!canApply}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110 transition-all disabled:opacity-50"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Apply This Fix
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
