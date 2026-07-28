"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileOutput,
  Download,
  Copy,
  FileDown,
  Link2,
  Printer,
  MessageSquareText,
  Wand2,
  ClipboardList,
  Check,
} from "lucide-react";

interface ExportMenuProps {
  onDownloadCode: () => void;
  onCopyCode: () => void;
  onExportPdf: () => void;
  onShareLink: () => void;
  onPrintCode: () => void;
  onDownloadExplanation: () => void;
  onDownloadCorrectedCode: () => void;
  onDownloadExecutionReport: () => void;
  hasExplanation: boolean;
  hasCorrectedCode: boolean;
  hasExecutionResult: boolean;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  disabledHint?: string;
}

export default function ExportMenu({
  onDownloadCode,
  onCopyCode,
  onExportPdf,
  onShareLink,
  onPrintCode,
  onDownloadExplanation,
  onDownloadCorrectedCode,
  onDownloadExecutionReport,
  hasExplanation,
  hasCorrectedCode,
  hasExecutionResult,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [justRan, setJustRan] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const run = (key: string, fn: () => void) => {
    fn();
    setJustRan(key);
    setTimeout(() => setJustRan(null), 1200);
    setTimeout(() => setOpen(false), 400);
  };

  const items: MenuItem[] = [
    { key: "download", label: "Download Code", icon: Download, onClick: () => run("download", onDownloadCode) },
    { key: "copy", label: "Copy Code", icon: Copy, onClick: () => run("copy", onCopyCode) },
    { key: "pdf", label: "Export as PDF", icon: FileDown, onClick: () => run("pdf", onExportPdf) },
    { key: "share", label: "Share Link", icon: Link2, onClick: () => run("share", onShareLink) },
    { key: "print", label: "Print Code", icon: Printer, onClick: () => run("print", onPrintCode) },
    {
      key: "explanation",
      label: "Download AI Explanation",
      icon: MessageSquareText,
      onClick: () => run("explanation", onDownloadExplanation),
      disabled: !hasExplanation,
      disabledHint: "Run your code and get an AI explanation first",
    },
    {
      key: "corrected",
      label: "Download Corrected Code",
      icon: Wand2,
      onClick: () => run("corrected", onDownloadCorrectedCode),
      disabled: !hasCorrectedCode,
      disabledHint: "No AI-corrected code available yet",
    },
    {
      key: "report",
      label: "Download Execution Report",
      icon: ClipboardList,
      onClick: () => run("report", onDownloadExecutionReport),
      disabled: !hasExecutionResult,
      disabledHint: "Run your code first",
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Export"
        className="flex items-center gap-1.5 h-9 rounded-lg px-3 text-[12px] font-mono glass hover:border-[var(--border-strong)] transition-colors shrink-0"
      >
        <FileOutput className="h-3.5 w-3.5 text-[var(--syn-string)]" />
        Export
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 rounded-lg glass-strong p-1.5 z-50 shadow-2xl"
          >
            {items.map((item) => (
              <button
                key={item.key}
                onClick={item.disabled ? undefined : item.onClick}
                disabled={item.disabled}
                title={item.disabled ? item.disabledHint : undefined}
                className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-[12px] text-left transition-colors hover:bg-white/[0.06] disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                {justRan === item.key ? (
                  <Check className="h-3.5 w-3.5 text-[var(--syn-string)] shrink-0" />
                ) : (
                  <item.icon className="h-3.5 w-3.5 text-[var(--ink-dim)] shrink-0" />
                )}
                <span className="text-[var(--ink)]">{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
