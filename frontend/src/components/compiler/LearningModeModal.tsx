"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RotateCcw,
  Lightbulb,
  Workflow,
  FileCode2,
  Timer,
  HelpCircle,
  Briefcase,
  Link2,
  Eye,
  EyeOff,
} from "lucide-react";
import type { LearningContent } from "@/lib/api";
import MermaidDiagram from "./MermaidDiagram";

type Level = "beginner" | "intermediate" | "advanced";

const LEVELS: { id: Level; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

function Card({
  icon: Icon,
  title,
  accent,
  children,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  accent: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="h-4 w-4" style={{ color: accent }} />
        <h3 className="text-[12.5px] font-medium text-[var(--ink)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function RevealQuestion({
  question,
  hint,
  accent,
}: {
  question: string;
  hint: string;
  accent: string;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="space-y-2.5">
      <p className="text-[12px] text-[var(--ink-dim)] leading-relaxed">{question}</p>
      <button
        onClick={() => setRevealed((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-mono transition-colors"
        style={{ color: accent }}
      >
        {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        {revealed ? "Hide hint" : "Show hint"}
      </button>
      <AnimatePresence initial={false}>
        {revealed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-[11.5px] text-[var(--ink-dim)] leading-relaxed rounded-md bg-black/20 p-2.5">
              {hint}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface LearningModeModalProps {
  open: boolean;
  onClose: () => void;
  language: string;
  status: "loading" | "success" | "error";
  content: LearningContent | null;
  errorMessage: string | null;
  onRetry: () => void;
  onExploreTopic: (topic: string) => void;
}

export default function LearningModeModal({
  open,
  onClose,
  language,
  status,
  content,
  errorMessage,
  onRetry,
  onExploreTopic,
}: LearningModeModalProps) {
  const [level, setLevel] = useState<Level>("beginner");

  if (!open) return null;

  const levelContent: Record<Level, string> = content
    ? {
        beginner: content.beginnerExplanation,
        intermediate: content.intermediateExplanation,
        advanced: content.advancedExplanation,
      }
    : { beginner: "", intermediate: "", advanced: "" };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col glass-strong rounded-xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Learning Mode"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[var(--border)] shrink-0">
          <div>
            <p className="text-[13.5px] font-medium text-[var(--ink)]">Learning Mode</p>
            <p className="text-[11px] font-mono text-[var(--ink-faint)] mt-0.5">
              {content ? content.topic : language}
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {status === "loading" && (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  className="h-6 w-6 rounded-full border-2 border-[var(--syn-keyword)] border-t-transparent"
                />
                <p className="text-[13px] text-[var(--ink-dim)]">Preparing your lesson…</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="glass rounded-xl p-5 space-y-3">
              <p className="text-[13px] text-[var(--ink)] font-medium">Couldn&apos;t generate this lesson</p>
              <p className="text-[12px] text-[var(--ink-dim)] leading-relaxed">{errorMessage}</p>
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--syn-function)] hover:text-[var(--ink)] transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Try again
              </button>
            </div>
          )}

          {status === "success" && content && (
            <>
              {/* Level selector + explanation */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-1 rounded-lg glass p-1 w-fit mb-3">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLevel(l.id)}
                      className={`rounded-md px-3 py-1.5 text-[11.5px] font-mono transition-colors ${
                        level === l.id
                          ? "bg-white/10 text-[var(--ink)]"
                          : "text-[var(--ink-faint)] hover:text-[var(--ink-dim)]"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={level}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-[12.5px] text-[var(--ink-dim)] leading-relaxed"
                  >
                    {levelContent[level]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Real-life example + Complexity */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Card icon={Lightbulb} title="Real-Life Example" accent="var(--syn-cursor)">
                  <p className="text-[12px] text-[var(--ink-dim)] leading-relaxed">
                    {content.realLifeExample}
                  </p>
                </Card>
                <Card icon={Timer} title="Complexity Analysis" accent="var(--syn-const)">
                  <div className="flex gap-2 mb-2">
                    <span className="rounded-full bg-[var(--syn-function)]/15 text-[var(--syn-function)] text-[11px] font-mono px-2.5 py-1">
                      Time: {content.complexityAnalysis.timeComplexity}
                    </span>
                    <span className="rounded-full bg-[var(--syn-const)]/15 text-[var(--syn-const)] text-[11px] font-mono px-2.5 py-1">
                      Space: {content.complexityAnalysis.spaceComplexity}
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--ink-dim)] leading-relaxed">
                    {content.complexityAnalysis.explanation}
                  </p>
                </Card>
              </div>

              {/* Flowchart */}
              <Card icon={Workflow} title="Flowchart" accent="var(--syn-keyword)">
                <MermaidDiagram definition={content.flowchartMermaid} />
              </Card>

              {/* Pseudocode */}
              <Card icon={FileCode2} title="Pseudo Code" accent="var(--syn-string)">
                <pre className="rounded-md bg-black/30 p-3 overflow-x-auto font-mono text-[11.5px] text-[var(--syn-string)] whitespace-pre">
                  {content.pseudoCode}
                </pre>
              </Card>

              {/* Practice + Interview questions */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Card icon={HelpCircle} title="Practice Question" accent="var(--syn-function)">
                  <RevealQuestion
                    question={content.practiceQuestion.question}
                    hint={content.practiceQuestion.hint}
                    accent="var(--syn-function)"
                  />
                </Card>
                <Card icon={Briefcase} title="Interview Question" accent="var(--syn-keyword)">
                  <RevealQuestion
                    question={content.interviewQuestion.question}
                    hint={content.interviewQuestion.hint}
                    accent="var(--syn-keyword)"
                  />
                </Card>
              </div>

              {/* Related topics */}
              <Card icon={Link2} title="Related Topics" accent="var(--syn-string)">
                <div className="flex flex-wrap gap-2">
                  {content.relatedTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => onExploreTopic(topic)}
                      className="rounded-full glass px-3 py-1.5 text-[11.5px] font-mono text-[var(--ink-dim)] hover:text-[var(--ink)] hover:border-[var(--border-strong)] transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
