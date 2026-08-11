"use client";

import {
  Play,
  Hammer,
  Trash2,
  Upload,
  Maximize,
  Minimize,
  Loader2,
  PanelRight,
  Gauge,
  Bug,
  GraduationCap,
  ArrowLeftRight,
  Keyboard,
  Send,
} from "lucide-react";
import LanguageDropdown from "./LanguageDropdown";
import SettingsPanel from "./SettingsPanel";
import ExportMenu from "./ExportMenu";
import { EditorSettings } from "./CodeEditor";
import { LanguageConfig } from "@/lib/languages";

interface ToolbarProps {
  language: string;
  onLanguageChange: (id: LanguageConfig["id"]) => void;
  allowedLanguages?: string[];
  activeAssignment?: { id: string } | null;
  onSubmitAssignment?: () => void;
  isSubmittingAssignment?: boolean;
  onRun: () => void;
  onCompile: () => void;
  onClear: () => void;
  onUpload: (file: File) => void;
  isRunning: boolean;
  isCompiling: boolean;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  settings: EditorSettings;
  onSettingsChange: (s: EditorSettings) => void;
  autoSave: boolean;
  onAutoSaveChange: (v: boolean) => void;
  onToggleAIPanel: () => void;
  aiPanelOpen: boolean;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onDebug: () => void;
  isDebugging: boolean;
  onExplain: () => void;
  isExplaining: boolean;
  onConvert: () => void;
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
  onShowShortcuts: () => void;
}

export default function Toolbar({
  language,
  onLanguageChange,
  allowedLanguages,
  activeAssignment,
  onSubmitAssignment,
  isSubmittingAssignment,
  onRun,
  onCompile,
  onClear,
  onUpload,
  isRunning,
  isCompiling,
  fullscreen,
  onToggleFullscreen,
  settings,
  onSettingsChange,
  autoSave,
  onAutoSaveChange,
  onToggleAIPanel,
  aiPanelOpen,
  onAnalyze,
  isAnalyzing,
  onDebug,
  isDebugging,
  onExplain,
  isExplaining,
  onConvert,
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
  onShowShortcuts,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 glass-strong border-b border-[var(--border)] overflow-x-auto">
      <LanguageDropdown
        value={language}
        onChange={onLanguageChange}
        onlySupported
        allowedLanguages={allowedLanguages}
      />

      <div className="w-px h-6 bg-[var(--border)] mx-1 shrink-0" />

      <button
        onClick={onRun}
        disabled={isRunning}
        className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-string)] to-[var(--syn-function)] hover:brightness-110 transition-all disabled:opacity-60 shrink-0 cursor-pointer"
      >
        {isRunning ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
        Run
      </button>

      {/* Submit Assignment CTA (Requirement 5) */}
      {activeAssignment && onSubmitAssignment && (
        <button
          onClick={onSubmitAssignment}
          disabled={isSubmittingAssignment || isRunning}
          title="Submit solution for this assignment"
          className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-bold text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110 transition-all disabled:opacity-60 shrink-0 cursor-pointer shadow-[0_0_15px_rgba(184,146,255,0.3)]"
        >
          {isSubmittingAssignment ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Submit Assignment
        </button>
      )}

      <button
        onClick={onCompile}
        disabled={isCompiling}
        className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium glass hover:border-[var(--border-strong)] transition-colors disabled:opacity-60 shrink-0 cursor-pointer"
      >
        {isCompiling ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--syn-keyword)]" />
        ) : (
          <Hammer className="h-3.5 w-3.5 text-[var(--syn-keyword)]" />
        )}
        Compile
      </button>

      <div className="w-px h-6 bg-[var(--border)] mx-1 shrink-0" />

      <ToolbarIcon title="Clear editor" onClick={onClear}>
        <Trash2 className="h-4 w-4" />
      </ToolbarIcon>

      <label
        title="Upload file"
        aria-label="Upload file"
        className="h-9 w-9 flex items-center justify-center rounded-lg glass hover:border-[var(--border-strong)] transition-colors text-[var(--ink-dim)] cursor-pointer shrink-0"
      >
        <Upload className="h-4 w-4" />
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
      </label>

      <ToolbarIcon
        title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        onClick={onToggleFullscreen}
      >
        {fullscreen ? (
          <Minimize className="h-4 w-4" />
        ) : (
          <Maximize className="h-4 w-4" />
        )}
      </ToolbarIcon>

      <ExportMenu
        onDownloadCode={onDownloadCode}
        onCopyCode={onCopyCode}
        onExportPdf={onExportPdf}
        onShareLink={onShareLink}
        onPrintCode={onPrintCode}
        onDownloadExplanation={onDownloadExplanation}
        onDownloadCorrectedCode={onDownloadCorrectedCode}
        onDownloadExecutionReport={onDownloadExecutionReport}
        hasExplanation={hasExplanation}
        hasCorrectedCode={hasCorrectedCode}
        hasExecutionResult={hasExecutionResult}
      />

      <div className="flex-1 min-w-2" />

      <button
        onClick={onAnalyze}
        disabled={isAnalyzing}
        title="Analyze code quality"
        className="flex items-center gap-1.5 h-9 rounded-lg px-3 text-[12px] font-mono glass hover:border-[var(--border-strong)] transition-colors disabled:opacity-60 shrink-0"
      >
        {isAnalyzing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--syn-string)]" />
        ) : (
          <Gauge className="h-3.5 w-3.5 text-[var(--syn-string)]" />
        )}
        Analyze
      </button>

      <button
        onClick={onDebug}
        disabled={isDebugging}
        title="Open Visual Debugger"
        className="flex items-center gap-1.5 h-9 rounded-lg px-3 text-[12px] font-mono glass hover:border-[var(--border-strong)] transition-colors disabled:opacity-60 shrink-0"
      >
        {isDebugging ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--syn-const)]" />
        ) : (
          <Bug className="h-3.5 w-3.5 text-[var(--syn-const)]" />
        )}
        Debug
      </button>

      <button
        onClick={onExplain}
        disabled={isExplaining}
        title="Learning Mode: explain this code"
        className="flex items-center gap-1.5 h-9 rounded-lg px-3 text-[12px] font-mono glass hover:border-[var(--border-strong)] transition-colors disabled:opacity-60 shrink-0"
      >
        {isExplaining ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--syn-keyword)]" />
        ) : (
          <GraduationCap className="h-3.5 w-3.5 text-[var(--syn-keyword)]" />
        )}
        Explain
      </button>

      <button
        onClick={onConvert}
        title="Convert to another language"
        className="flex items-center gap-1.5 h-9 rounded-lg px-3 text-[12px] font-mono glass hover:border-[var(--border-strong)] transition-colors shrink-0"
      >
        <ArrowLeftRight className="h-3.5 w-3.5 text-[var(--syn-function)]" />
        Convert
      </button>

      <button
        onClick={onToggleAIPanel}
        title="Toggle AI Assistant panel"
        className={`hidden md:flex items-center gap-1.5 h-9 rounded-lg px-3 text-[12px] font-mono transition-colors shrink-0 ${
          aiPanelOpen
            ? "glass-strong text-[var(--syn-keyword)] border-[var(--syn-keyword)]/30"
            : "glass text-[var(--ink-dim)]"
        }`}
      >
        <PanelRight className="h-3.5 w-3.5" />
        AI
      </button>

      <button
        onClick={onShowShortcuts}
        title="Keyboard shortcuts"
        aria-label="Show keyboard shortcuts"
        className="h-9 w-9 flex items-center justify-center rounded-lg glass hover:border-[var(--border-strong)] transition-colors text-[var(--ink-dim)] shrink-0"
      >
        <Keyboard className="h-4 w-4" />
      </button>

      <SettingsPanel
        settings={settings}
        onChange={onSettingsChange}
        autoSave={autoSave}
        onAutoSaveChange={onAutoSaveChange}
      />
    </div>
  );
}

function ToolbarIcon({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className="h-9 w-9 flex items-center justify-center rounded-lg glass hover:border-[var(--border-strong)] transition-colors text-[var(--ink-dim)] hover:text-[var(--ink)] shrink-0"
    >
      {children}
    </button>
  );
}
