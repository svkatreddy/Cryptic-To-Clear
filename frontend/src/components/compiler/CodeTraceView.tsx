"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export default function CodeTraceView({
  sourceCode,
  currentLine,
}: {
  sourceCode: string;
  currentLine: number | null;
}) {
  const lines = sourceCode.split("\n");
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentLine]);

  return (
    <div className="relative h-full overflow-y-auto rounded-lg bg-black/30 font-mono text-[12px]">
      {lines.map((line, i) => {
        const lineNo = i + 1;
        const active = lineNo === currentLine;
        return (
          <div
            key={i}
            ref={active ? activeRef : undefined}
            className="relative flex"
          >
            {active && (
              <motion.div
                layoutId="debug-active-line"
                className="absolute inset-0 bg-[rgba(158,230,168,0.14)] border-l-2 border-[var(--syn-string)]"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative w-6 shrink-0 flex items-center justify-center">
              {active && (
                <ChevronRight className="h-3 w-3 text-[var(--syn-string)]" />
              )}
            </span>
            <span className="relative w-9 shrink-0 text-right pr-2 text-[var(--ink-faint)] select-none">
              {lineNo}
            </span>
            <span
              className={`relative flex-1 whitespace-pre pr-4 py-0.5 ${active ? "text-[var(--ink)]" : "text-[var(--ink-dim)]"
                }`}
            >
              {line || " "}
            </span>
          </div>
        );
      })}
    </div>
  );
}
