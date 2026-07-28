"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Lock } from "lucide-react";
import { LANGUAGES, LanguageConfig } from "@/lib/languages";

export default function LanguageDropdown({
  value,
  onChange,
  onlySupported = false,
}: {
  value: string;
  onChange: (id: LanguageConfig["id"]) => void;
  onlySupported?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const options = onlySupported
    ? LANGUAGES.filter((language) => language.judge0Supported)
    : LANGUAGES;
  const current = options.find((l) => l.id === value) ?? options[0] ?? LANGUAGES[0];

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

    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPosition({
      left: rect.left,
      top: rect.bottom,
      width: rect.width,
    });
  }, [open]);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        setMenuPosition({
          left: rect.left,
          top: rect.bottom,
          width: rect.width,
        });
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={(el) => {
          buttonRef.current = el;
        }}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg glass px-3 py-2 text-[13px] font-mono hover:border-[var(--border-strong)] transition-colors min-w-[136px]"
      >
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ background: current.accent }}
        />
        <span className="flex-1 text-left">{current.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--ink-faint)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {mounted && open && menuPosition && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="max-h-80 overflow-y-auto rounded-lg glass-strong p-1.5 shadow-2xl"
          style={{
            position: "fixed",
            left: menuPosition.left,
            top: menuPosition.top,
            width: menuPosition.width,
            zIndex: 9999,
          }}
        >
          {options.map((lang) => (
            <button
              key={lang.id}
              onClick={() => {
                if (!lang.judge0Supported && onlySupported) return;
                onChange(lang.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-mono text-left transition-colors ${
                !lang.judge0Supported && onlySupported
                  ? "cursor-not-allowed text-[var(--ink-faint)]"
                  : "hover:bg-white/[0.06]"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: lang.accent }}
              />
              <span className="flex-1 text-[var(--ink)]">{lang.label}</span>
              {!lang.judge0Supported && onlySupported ? (
                <Lock className="h-3.5 w-3.5 text-[var(--ink-faint)]" />
              ) : lang.id === value ? (
                <Check className="h-3.5 w-3.5 text-[var(--syn-string)]" />
              ) : null}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
