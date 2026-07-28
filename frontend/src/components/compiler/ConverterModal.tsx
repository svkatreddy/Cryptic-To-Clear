"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  X,
  ArrowLeftRight,
  RotateCcw,
  Copy,
  Check,
  FileOutput,
  Sparkles,
  Info,
} from "lucide-react";
import LanguageDropdown from "./LanguageDropdown";
import { LANGUAGES, getLanguage } from "@/lib/languages";
import { convertCode, CodeConversion } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

interface ConverterModalProps {
  open: boolean;
  onClose: () => void;
  initialSourceLanguage: string;
  getSourceCode: (languageId: string) => string;
  onUseInEditor: (languageId: string, code: string) => void;
}

function pickDefaultTarget(source: string): string {
  const other = LANGUAGES.find((l) => l.id !== source);
  return other?.id ?? LANGUAGES[0].id;
}

function CodePane({ language, code }: { language: string; code: string }) {
  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      customStyle={{
        margin: 0,
        background: "rgba(0,0,0,0.3)",
        fontSize: "11.5px",
        padding: "12px",
        height: "100%",
      }}
      wrapLongLines
    >
      {code || " "}
    </SyntaxHighlighter>
  );
}

export default function ConverterModal({
  open,
  onClose,
  initialSourceLanguage,
  getSourceCode,
  onUseInEditor,
}: ConverterModalProps) {
  const [sourceLang, setSourceLang] = useState(initialSourceLanguage);
  const [targetLang, setTargetLang] = useState(() => pickDefaultTarget(initialSourceLanguage));
  const [status, setStatus] = useState<Status>("idle");
  const [conversion, setConversion] = useState<CodeConversion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset to the editor's current language whenever the converter is opened.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setSourceLang(initialSourceLanguage);
      setTargetLang(pickDefaultTarget(initialSourceLanguage));
      setStatus("idle");
      setConversion(null);
      setErrorMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!open) return null;

  const sourceCode = getSourceCode(sourceLang);
  const sourceMeta = getLanguage(sourceLang);
  const targetMeta = getLanguage(targetLang);

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setStatus("idle");
    setConversion(null);
  };

  const handleConvert = async () => {
    setStatus("loading");
    setErrorMessage(null);

    const result = await convertCode({
      sourceLanguage: sourceMeta.label,
      targetLanguage: targetMeta.label,
      sourceCode,
    });

    if (result.success) {
      setConversion(result.conversion);
      setStatus("success");
    } else {
      setErrorMessage(result.message);
      setStatus("error");
    }
  };

  const handleCopy = async () => {
    if (!conversion) return;
    try {
      await navigator.clipboard.writeText(conversion.convertedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col glass-strong rounded-xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Code Conversion"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[var(--border)] shrink-0">
          <p className="text-[13.5px] font-medium text-[var(--ink)]">Code Conversion</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 flex items-center justify-center rounded-md text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Language selectors */}
        <div className="flex flex-wrap items-center gap-2.5 px-4 sm:px-5 py-3 border-b border-[var(--border)] shrink-0">
          <LanguageDropdown value={sourceLang} onChange={(id) => { setSourceLang(id); setStatus("idle"); }} />
          <button
            onClick={handleSwap}
            title="Swap languages"
            className="h-9 w-9 flex items-center justify-center rounded-lg glass hover:border-[var(--border-strong)] transition-colors shrink-0"
          >
            <ArrowLeftRight className="h-4 w-4 text-[var(--syn-function)]" />
          </button>
          <LanguageDropdown value={targetLang} onChange={(id) => { setTargetLang(id); setStatus("idle"); }} />

          <div className="flex-1 min-w-2" />

          <button
            onClick={() => void handleConvert()}
            disabled={status === "loading"}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12.5px] font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110 transition-all disabled:opacity-60 shrink-0"
          >
            {status === "loading" ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-3.5 w-3.5 rounded-full border-2 border-[#0a0d13] border-t-transparent"
              />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Convert
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {status === "error" && (
            <div className="glass rounded-xl p-5 space-y-3">
              <p className="text-[13px] text-[var(--ink)] font-medium">Couldn&apos;t convert this code</p>
              <p className="text-[12px] text-[var(--ink-dim)] leading-relaxed">{errorMessage}</p>
              <button
                onClick={() => void handleConvert()}
                className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--syn-function)] hover:text-[var(--ink)] transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Try again
              </button>
            </div>
          )}

          {conversion && status === "success" && (
            <div className="rounded-xl glass-strong border-l-2 border-[var(--syn-string)] px-4 py-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-[var(--syn-string)] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[var(--ink-dim)] leading-relaxed">
                {conversion.preservedLogicSummary}
              </p>
            </div>
          )}

          {/* Side-by-side comparison */}
          <div className="grid lg:grid-cols-2 gap-3" style={{ minHeight: "260px" }}>
            <div className="glass rounded-xl overflow-hidden flex flex-col">
              <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-2 shrink-0">
                <span className="h-2 w-2 rounded-full" style={{ background: sourceMeta.accent }} />
                <span className="text-[11.5px] font-mono text-[var(--ink-dim)]">{sourceMeta.label} (source)</span>
              </div>
              <div className="flex-1 overflow-auto">
                <CodePane language={sourceMeta.monacoId} code={sourceCode} />
              </div>
            </div>

            <div className="glass rounded-xl overflow-hidden flex flex-col">
              <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between gap-2 shrink-0">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: targetMeta.accent }} />
                  <span className="text-[11.5px] font-mono text-[var(--ink-dim)]">{targetMeta.label} (converted)</span>
                </span>
                {conversion && (
                  <span className="flex items-center gap-2">
                    <button
                      onClick={() => void handleCopy()}
                      className="flex items-center gap-1 text-[10.5px] font-mono text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
                    >
                      {copied ? <Check className="h-3 w-3 text-[var(--syn-string)]" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={() => onUseInEditor(targetLang, conversion.convertedCode)}
                      className="flex items-center gap-1 text-[10.5px] font-mono text-[var(--syn-function)] hover:text-[var(--ink)] transition-colors"
                    >
                      <FileOutput className="h-3 w-3" />
                      Use in Editor
                    </button>
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                {status === "loading" ? (
                  <div className="flex items-center justify-center h-full py-10">
                    <p className="text-[12px] text-[var(--ink-faint)] font-mono">Converting…</p>
                  </div>
                ) : conversion ? (
                  <CodePane language={targetMeta.monacoId} code={conversion.convertedCode} />
                ) : (
                  <div className="flex items-center justify-center h-full py-10">
                    <p className="text-[12px] text-[var(--ink-faint)] font-mono">
                      Click Convert to see the {targetMeta.label} version.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Differences + notes */}
          {conversion && status === "success" && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                {conversion.differences.map((d, i) => (
                  <div key={i} className="glass rounded-lg p-3">
                    <p className="text-[11.5px] font-medium text-[var(--syn-keyword)] mb-1">{d.aspect}</p>
                    <p className="text-[11.5px] text-[var(--ink-dim)] leading-relaxed">{d.explanation}</p>
                  </div>
                ))}
              </div>

              {conversion.conversionNotes && (
                <div className="glass rounded-lg p-3.5">
                  <p className="text-[11px] font-mono text-[var(--ink-faint)] uppercase mb-1.5">Conversion Notes</p>
                  <p className="text-[12px] text-[var(--ink-dim)] leading-relaxed">{conversion.conversionNotes}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
