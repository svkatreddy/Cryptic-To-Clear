"use client";

import { motion } from "framer-motion";
import { Sparkles, CircleAlert } from "lucide-react";

export default function EditorMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
      className="relative w-full max-w-[520px] mx-auto"
    >
      {/* Editor window */}
      <div className="glass-strong rounded-xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-white/[0.02]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-3 font-mono text-[12px] text-[var(--ink-dim)]">
            main.py — Cryptic to Clear
          </span>
        </div>

        {/* Code body */}
        <div className="p-5 font-mono text-[13px] leading-relaxed">
          <CodeLine n={1}>
            <Kw>def</Kw> <Fn>total_price</Fn>(items, tax_rate):
          </CodeLine>
          <CodeLine n={2}>
            &nbsp;&nbsp;subtotal = <Kw>sum</Kw>(item.price <Kw>for</Kw> item <Kw>in</Kw> items)
          </CodeLine>
          <CodeLine n={3}>
            &nbsp;&nbsp;<Kw>return</Kw> subtotal * (1 + tax_rate
          </CodeLine>
          <CodeLine n={4} error>
            &nbsp;&nbsp;&nbsp;&nbsp;<Cn>SyntaxError</Cn>: missing closing parenthesis
          </CodeLine>
          <CodeLine n={5}>
            <span className="opacity-40">print(total_price(cart, 0.08))</span>
            <span className="caret text-[var(--syn-cursor)]">▍</span>
          </CodeLine>
        </div>
      </div>

      {/* AI annotation popover */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
        className="absolute -right-4 sm:-right-10 top-[46%] w-[240px] sm:w-[260px] glass rounded-lg p-4 shadow-2xl border-[var(--syn-keyword)]/30"
        style={{ boxShadow: "0 20px 60px -15px rgba(184,146,255,0.25)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-[var(--syn-keyword)]" />
          <span className="text-[11px] font-mono font-medium text-[var(--syn-keyword)]">
            AI Explanation
          </span>
        </div>
        <p className="text-[12.5px] text-[var(--ink-dim)] leading-snug">
          You opened <code className="text-[var(--syn-function)]">(</code> on line 3 but
          never closed it. Add <code className="text-[var(--syn-string)]">)</code> after{" "}
          <code className="text-[var(--syn-string)]">tax_rate</code>.
        </p>
      </motion.div>

      {/* Error badge floating on the window edge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="absolute -left-4 sm:-left-8 top-6 flex items-center gap-1.5 glass rounded-full px-3 py-1.5"
      >
        <CircleAlert className="h-3.5 w-3.5 text-[var(--syn-const)]" />
        <span className="text-[11px] font-mono text-[var(--syn-const)]">1 error found</span>
      </motion.div>
    </motion.div>
  );
}

function CodeLine({
  n,
  children,
  error,
}: {
  n: number;
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className={`flex gap-4 ${error ? "bg-[var(--syn-const)]/10 -mx-5 px-5" : ""}`}>
      <span className="select-none text-[var(--ink-faint)] w-4 text-right shrink-0">
        {n}
      </span>
      <span className={error ? "text-[var(--syn-const)]" : "text-[var(--ink)]"}>
        {children}
      </span>
    </div>
  );
}

function Kw({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--syn-keyword)]">{children}</span>;
}
function Fn({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--syn-function)]">{children}</span>;
}
function Cn({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold">{children}</span>;
}
