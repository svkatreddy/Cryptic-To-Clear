"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { QUICK_ACTIONS } from "@/lib/chat";

export default function QuickActionsMenu({
  onSelect,
  disabled,
}: {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-[var(--border)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2 text-[11.5px] font-mono text-[var(--ink-faint)] hover:text-[var(--ink-dim)] transition-colors"
      >
        <Sparkles className="h-3 w-3 text-[var(--syn-keyword)]" />
        <span className="flex-1 text-left">Quick actions</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 grid grid-cols-2 gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  disabled={disabled}
                  onClick={() => {
                    onSelect(action.prompt);
                    setOpen(false);
                  }}
                  className="rounded-md glass px-2 py-1.5 text-[10.5px] font-mono text-[var(--ink-dim)] hover:text-[var(--ink)] hover:border-[var(--border-strong)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left leading-snug"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
