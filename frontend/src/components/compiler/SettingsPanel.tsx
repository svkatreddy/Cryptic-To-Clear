"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, Minus, Plus, Sun, Moon } from "lucide-react";
import { EditorSettings } from "./CodeEditor";

interface SettingsPanelProps {
  settings: EditorSettings;
  onChange: (settings: EditorSettings) => void;
  autoSave: boolean;
  onAutoSaveChange: (v: boolean) => void;
}

function Toggle({
  checked,
  onChange,
  label,
  accent = "var(--syn-string)",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  accent?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between py-2"
    >
      <span className="text-[13px] text-[var(--ink-dim)]">{label}</span>
      <span
        className="relative h-5 w-9 rounded-full transition-colors shrink-0"
        style={{ background: checked ? accent : "rgba(148,163,184,0.18)" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-[#0a0d13] transition-transform"
          style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
        />
      </span>
    </button>
  );
}

export default function SettingsPanel({
  settings,
  onChange,
  autoSave,
  onAutoSaveChange,
}: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const set = (patch: Partial<EditorSettings>) =>
    onChange({ ...settings, ...patch });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Editor settings"
        className="h-9 w-9 flex items-center justify-center rounded-lg glass hover:border-[var(--border-strong)] transition-colors text-[var(--ink-dim)]"
      >
        <Settings2 className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 rounded-lg glass-strong p-4 z-50 shadow-2xl"
          >
            <p className="font-mono text-[11px] text-[var(--syn-function)] mb-2 uppercase tracking-wide">
              Editor Features
            </p>

            {/* Theme */}
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] text-[var(--ink-dim)]">Theme</span>
              <div className="flex items-center gap-1 rounded-lg glass p-1">
                <button
                  onClick={() => set({ theme: "vs-dark" })}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors ${
                    settings.theme === "vs-dark"
                      ? "bg-white/10 text-[var(--ink)]"
                      : "text-[var(--ink-faint)]"
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" /> Dark
                </button>
                <button
                  onClick={() => set({ theme: "light" })}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors ${
                    settings.theme === "light"
                      ? "bg-white/10 text-[var(--ink)]"
                      : "text-[var(--ink-faint)]"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" /> Light
                </button>
              </div>
            </div>

            <div className="h-px bg-[var(--border)] my-1" />

            {/* Font size */}
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] text-[var(--ink-dim)]">Font size</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => set({ fontSize: Math.max(11, settings.fontSize - 1) })}
                  className="h-6 w-6 flex items-center justify-center rounded-md glass text-[var(--ink-dim)]"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-mono text-[12px] w-6 text-center">
                  {settings.fontSize}
                </span>
                <button
                  onClick={() => set({ fontSize: Math.min(24, settings.fontSize + 1) })}
                  className="h-6 w-6 flex items-center justify-center rounded-md glass text-[var(--ink-dim)]"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="h-px bg-[var(--border)] my-1" />

            <Toggle
              label="Auto save"
              checked={autoSave}
              onChange={onAutoSaveChange}
              accent="var(--syn-keyword)"
            />
            <Toggle
              label="Word wrap"
              checked={settings.wordWrap}
              onChange={(v) => set({ wordWrap: v })}
              accent="var(--syn-function)"
            />
            <Toggle
              label="Minimap"
              checked={settings.minimap}
              onChange={(v) => set({ minimap: v })}
              accent="var(--syn-const)"
            />
            <Toggle
              label="Line numbers"
              checked={settings.lineNumbers}
              onChange={(v) => set({ lineNumbers: v })}
            />
            <Toggle
              label="Bracket matching"
              checked={settings.bracketMatching}
              onChange={(v) => set({ bracketMatching: v })}
            />

            <p className="mt-2 pt-2 border-t border-[var(--border)] text-[11px] text-[var(--ink-faint)] leading-relaxed">
              Syntax highlighting is always on, powered by Monaco Editor.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
