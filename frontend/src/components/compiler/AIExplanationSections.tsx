"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Wrench,
  Code2,
  ListX,
  ShieldCheck,
  TrendingUp,
  Copy,
  Check,
  Wand2,
  GitCompare,
  Undo2,
} from "lucide-react";
import type { AIExplanation } from "@/lib/api";

function Section({
  icon: Icon,
  title,
  accent,
  defaultOpen = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  accent: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
        <span className="flex-1 text-[12.5px] font-medium text-[var(--ink)]">
          {title}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--ink-faint)] shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
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
            <div className="px-3 pb-3 pt-0.5 text-[12px] text-[var(--ink-dim)] leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BulletList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span
            className="mt-1.5 h-1 w-1 rounded-full shrink-0"
            style={{ background: accent }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

interface AIExplanationSectionsProps {
  explanation: AIExplanation;
  fixApplied: boolean;
  canUndo: boolean;
  onApplyFix: () => void;
  onCompareChanges: () => void;
  onUndoFix: () => void;
}

export default function AIExplanationSections({
  explanation,
  fixApplied,
  canUndo,
  onApplyFix,
  onCompareChanges,
  onUndoFix,
}: AIExplanationSectionsProps) {
  const [copiedFixed, setCopiedFixed] = useState(false);

  const handleCopyFixed = async () => {
    try {
      await navigator.clipboard.writeText(explanation.correctCode);
      setCopiedFixed(true);
      setTimeout(() => setCopiedFixed(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Primary actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onApplyFix}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110 transition-all"
        >
          <Wand2 className="h-3.5 w-3.5" />
          {fixApplied ? "Re-apply AI Fix" : "Apply AI Fix"}
        </button>

        <button
          onClick={handleCopyFixed}
          className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium glass hover:border-[var(--border-strong)] transition-colors"
        >
          {copiedFixed ? (
            <Check className="h-3.5 w-3.5 text-[var(--syn-string)]" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copiedFixed ? "Copied" : "Copy Fixed Code"}
        </button>

        <button
          onClick={onCompareChanges}
          className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium glass hover:border-[var(--border-strong)] transition-colors"
        >
          <GitCompare className="h-3.5 w-3.5 text-[var(--syn-function)]" />
          Compare Changes
        </button>

        {canUndo && (
          <button
            onClick={onUndoFix}
            className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium text-[var(--syn-const)] glass hover:border-[var(--syn-const)]/40 transition-colors"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo Fix
          </button>
        )}
      </div>

      {fixApplied && (
        <p className="text-[10.5px] font-mono text-[var(--syn-string)] flex items-center gap-1.5 px-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--syn-string)]" />
          Fix applied — changed lines are highlighted in the editor
        </p>
      )}

      {/* Error Summary banner + Error Line badge */}
      <div className="rounded-lg glass-strong border-l-2 border-[var(--syn-const)] px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-medium text-[var(--ink)] leading-snug">
            {explanation.errorSummary}
          </p>
          <span className="shrink-0 rounded-full bg-[var(--syn-const)]/15 text-[var(--syn-const)] text-[10.5px] font-mono px-2 py-0.5">
            Line {explanation.errorLine}
          </span>
        </div>
      </div>

      <Section
        icon={HelpCircle}
        title="Reason"
        accent="var(--syn-keyword)"
        defaultOpen
      >
        {explanation.reason}
      </Section>

      <Section
        icon={MessageSquare}
        title="Simple Explanation"
        accent="var(--syn-function)"
        defaultOpen
      >
        {explanation.simpleExplanation}
      </Section>

      <Section
        icon={Wrench}
        title="How to Fix"
        accent="var(--syn-cursor)"
        defaultOpen
      >
        {explanation.howToFix}
      </Section>

      <Section
        icon={Code2}
        title="Correct Code"
        accent="var(--syn-string)"
        defaultOpen
      >
        <pre className="rounded-md bg-black/30 p-2.5 overflow-x-auto font-mono text-[11px] text-[var(--syn-string)] whitespace-pre">
          {explanation.correctCode}
        </pre>
      </Section>

      <Section icon={ListX} title="Common Mistakes" accent="var(--syn-const)">
        <BulletList items={explanation.commonMistakes} accent="var(--syn-const)" />
      </Section>

      <Section
        icon={ShieldCheck}
        title="Best Practices"
        accent="var(--syn-string)"
      >
        <BulletList items={explanation.bestPractices} accent="var(--syn-string)" />
      </Section>

      <Section
        icon={TrendingUp}
        title="Optimization Tips"
        accent="var(--syn-function)"
      >
        <BulletList items={explanation.optimizationTips} accent="var(--syn-function)" />
      </Section>
    </div>
  );
}
