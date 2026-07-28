"use client";

import { X, Keyboard } from "lucide-react";

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["Ctrl", "Enter"], label: "Run code" },
  { keys: ["Ctrl", "Shift", "Enter"], label: "Compile code" },
  { keys: ["Ctrl", "S"], label: "Download code" },
  { keys: ["Ctrl", "B"], label: "Toggle AI panel" },
  { keys: ["Ctrl", "K"], label: "Focus AI chat" },
  { keys: ["Shift", "?"], label: "Show this help" },
  { keys: ["Esc"], label: "Close dialog / panel" },
];

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform ?? "");

export default function ShortcutsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="relative w-full max-w-sm glass-strong rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-[var(--syn-function)]" />
            <p className="text-[13.5px] font-medium text-[var(--ink)]">Keyboard Shortcuts</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 flex items-center justify-center rounded-md text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="p-3">
          {SHORTCUTS.map((s) => (
            <li
              key={s.label}
              className="flex items-center justify-between gap-4 px-2 py-2 rounded-md hover:bg-white/5"
            >
              <span className="text-[12.5px] text-[var(--ink-dim)]">{s.label}</span>
              <span className="flex items-center gap-1 shrink-0">
                {s.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="rounded-md glass px-1.5 py-0.5 text-[10.5px] font-mono text-[var(--ink)]"
                  >
                    {k === "Ctrl" && isMac ? "⌘" : k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
