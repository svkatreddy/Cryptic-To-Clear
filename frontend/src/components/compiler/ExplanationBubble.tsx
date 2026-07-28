"use client";

import { Bot } from "lucide-react";
import type { AIExplanation } from "@/lib/api";
import AIExplanationSections from "./AIExplanationSections";

export default function ExplanationBubble({
  explanation,
  fixApplied,
  canUndo,
  onApplyFix,
  onCompareChanges,
  onUndoFix,
}: {
  explanation: AIExplanation;
  fixApplied: boolean;
  canUndo: boolean;
  onApplyFix: () => void;
  onCompareChanges: () => void;
  onUndoFix: () => void;
}) {
  return (
    <div className="flex gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 mt-0.5">
        <Bot className="h-3.5 w-3.5 text-[var(--syn-keyword)]" />
      </span>
      <div className="flex-1 min-w-0">
        <AIExplanationSections
          explanation={explanation}
          fixApplied={fixApplied}
          canUndo={canUndo}
          onApplyFix={onApplyFix}
          onCompareChanges={onCompareChanges}
          onUndoFix={onUndoFix}
        />
      </div>
    </div>
  );
}
