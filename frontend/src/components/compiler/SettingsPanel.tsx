"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, Minus, Plus, Sun, Moon } from "lucide-react";
import { EditorSettings } from "./CodeEditor";
import { applyTheme } from "@/lib/theme";

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
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(!checked);
      }}
      className="w-full flex items-center justify-between py-2 cursor-pointer"
    >
      <span className="text-[13px] text-[var(--ink-dim)]">{label}</span>
      <span
        className="relative h-5 w-9 rounded-full transition-colors shrink-0"
        style={{ background: checked ? accent : "var(--border-strong)" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-[var(--bg)] transition-transform shadow-sm"
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
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    right: number;
    top: number;
  } | null>(null);

  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        !(menuRef.current && menuRef.current.contains(target))
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        setMenuPosition({
          right: window.innerWidth - rect.right,
          top: rect.bottom + 6,
        });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const set = (patch: Partial<EditorSettings>) =>
    onChange({ ...settings, ...patch });

  const handleSelectTheme = (themeMode: "vs-dark" | "light") => {
    set({ theme: themeMode });
    applyTheme(themeMode === "light" ? "light" : "dark");
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={(el) => {
          buttonRef.current = el;
        }}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Editor settings"
        className="h-9 w-9 flex items-center justify-center rounded-lg glass hover:border-[var(--border-strong)] transition-colors text-[var(--ink-dim)]"
      >
        <Settings2 className="h-4 w-4" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && menuPosition && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-72 rounded-lg p-4 shadow-2xl border border-[var(--border-strong)] glass-strong text-[var(--ink)]"
                style={{
                  position: "fixed",
                  right: menuPosition.right,
                  top: menuPosition.top,
                  zIndex: 999999,
                }}
              >
                <p className="font-mono text-[11px] text-[var(--syn-function)] mb-2 uppercase tracking-wide">
                  Editor Features
                </p>

                {/* Theme */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-[var(--ink-dim)]">Theme</span>
                  <div className="flex items-center gap-1 rounded-lg glass p-1">
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleSelectTheme("vs-dark")}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors cursor-pointer ${
                        settings.theme === "vs-dark"
                          ? "bg-[var(--border-strong)] text-[var(--ink)] font-semibold"
                          : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
                      }`}
                    >
                      <Moon className="h-3.5 w-3.5" /> Dark
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleSelectTheme("light")}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors cursor-pointer ${
                        settings.theme === "light"
                          ? "bg-[var(--border-strong)] text-[var(--ink)] font-semibold"
                          : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
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
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => set({ fontSize: Math.max(11, settings.fontSize - 1) })}
                      className="h-6 w-6 flex items-center justify-center rounded-md glass text-[var(--ink)] cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono text-[12px] w-6 text-center text-[var(--ink)]">
                      {settings.fontSize}
                    </span>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => set({ fontSize: Math.min(24, settings.fontSize + 1) })}
                      className="h-6 w-6 flex items-center justify-center rounded-md glass text-[var(--ink)] cursor-pointer"
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
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
