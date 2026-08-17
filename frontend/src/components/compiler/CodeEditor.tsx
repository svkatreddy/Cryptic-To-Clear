"use client";

import { useEffect, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";

export interface EditorSettings {
  theme: "vs-dark" | "light";
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  bracketMatching: boolean;
}

type MonacoEditorInstance = Parameters<OnMount>[0];
type DecorationsCollection = ReturnType<
  MonacoEditorInstance["createDecorationsCollection"]
>;

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  settings: EditorSettings;
  /** Line numbers (in `value`) to highlight as AI-fix additions/changes, GitHub-diff style. */
  highlightLines?: number[];
  /** The Visual Debugger's currently-executing line, or null when not debugging. */
  currentLine?: number | null;
  onRun?: () => void;
  onCompile?: () => void;
  onDownloadCode?: () => void;
  onToggleAIPanel?: () => void;
  onFocusAIChat?: () => void;
  onShowShortcuts?: () => void;
}

export default function CodeEditor({
  language,
  value,
  onChange,
  settings,
  highlightLines,
  currentLine,
  onRun,
  onCompile,
  onDownloadCode,
  onToggleAIPanel,
  onFocusAIChat,
  onShowShortcuts,
}: CodeEditorProps) {
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const decorationsRef = useRef<DecorationsCollection | null>(null);
  const debugDecorationsRef = useRef<DecorationsCollection | null>(null);

  const onRunRef = useRef(onRun);
  const onCompileRef = useRef(onCompile);
  const onDownloadCodeRef = useRef(onDownloadCode);
  const onToggleAIPanelRef = useRef(onToggleAIPanel);
  const onFocusAIChatRef = useRef(onFocusAIChat);
  const onShowShortcutsRef = useRef(onShowShortcuts);

  useEffect(() => {
    onRunRef.current = onRun;
    onCompileRef.current = onCompile;
    onDownloadCodeRef.current = onDownloadCode;
    onToggleAIPanelRef.current = onToggleAIPanel;
    onFocusAIChatRef.current = onFocusAIChat;
    onShowShortcutsRef.current = onShowShortcuts;
  });

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.updateOptions({ tabSize: 2, glyphMargin: true });
    editor.focus();

    // Register shortcuts inside Monaco so Ctrl+Enter / Ctrl+Shift+Enter / Ctrl+S / Ctrl+B work while typing in Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunRef.current?.();
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      onCompileRef.current?.();
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onDownloadCodeRef.current?.();
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      onToggleAIPanelRef.current?.();
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      onFocusAIChatRef.current?.();
    });
  };

  // Apply/clear the "changed lines" decorations whenever the highlighted set
  // changes (e.g. right after "Apply AI Fix", or cleared on "Undo Fix").
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    decorationsRef.current?.clear();

    const lines = highlightLines ?? [];
    if (lines.length === 0) {
      decorationsRef.current = null;
      return;
    }

    decorationsRef.current = editor.createDecorationsCollection(
      lines.map((lineNumber) => ({
        range: {
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: "diff-line-added",
          linesDecorationsClassName: "diff-line-added-gutter",
        },
      }))
    );
  }, [highlightLines]);

  // Visual Debugger: highlight the currently-executing line and scroll it
  // into view, VS Code debugger style.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    debugDecorationsRef.current?.clear();

    if (!currentLine) {
      debugDecorationsRef.current = null;
      return;
    }

    debugDecorationsRef.current = editor.createDecorationsCollection([
      {
        range: {
          startLineNumber: currentLine,
          startColumn: 1,
          endLineNumber: currentLine,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: "debug-current-line",
          glyphMarginClassName: "debug-current-line-glyph",
        },
      },
    ]);
    editor.revealLineInCenter(currentLine);
  }, [currentLine]);

  return (
    <Editor
      language={language}
      value={value}
      theme={settings.theme === "vs-dark" ? "codementor-dark" : "codementor-light"}
      onChange={(v) => onChange(v ?? "")}
      onMount={handleMount}
      beforeMount={(monaco) => {
        monaco.editor.defineTheme("codementor-dark", {
          base: "vs-dark",
          inherit: true,
          rules: [],
          colors: {
            "editor.background": "#0d1119",
            "editor.lineHighlightBackground": "#161b26",
            "editorGutter.background": "#0d1119",
            "editorLineNumber.foreground": "#3a4356",
            "editorLineNumber.activeForeground": "#8993a4",
          },
        });
        monaco.editor.defineTheme("codementor-light", {
          base: "vs",
          inherit: true,
          rules: [],
          colors: {
            "editor.background": "#ffffff",
            "editor.lineHighlightBackground": "#f0f4f9",
            "editorGutter.background": "#ffffff",
            "editorLineNumber.foreground": "#94a3b8",
            "editorLineNumber.activeForeground": "#334155",
          },
        });
      }}
      options={{
        fontSize: settings.fontSize,
        wordWrap: settings.wordWrap ? "on" : "off",
        minimap: { enabled: settings.minimap },
        lineNumbers: settings.lineNumbers ? "on" : "off",
        bracketPairColorization: { enabled: settings.bracketMatching },
        matchBrackets: settings.bracketMatching ? "always" : "never",
        autoClosingBrackets: settings.bracketMatching ? "always" : "never",
        autoClosingQuotes: settings.bracketMatching ? "always" : "never",
        autoSurround: settings.bracketMatching ? "languageDefined" : "never",
        mouseWheelZoom: false,
        fontFamily:
          "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
        fontLigatures: true,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        padding: { top: 16 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        renderLineHighlight: "all",
        roundedSelection: true,
        glyphMargin: true,
        tabSize: 2,
      }}
      loading={
        <div className="flex h-full w-full flex-col gap-2 bg-[var(--bg)] p-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded animate-pulse bg-white/5"
              style={{
                width: `${[85, 60, 92, 40, 70, 55, 80, 45, 65, 50][i % 10]}%`,
                animationDelay: `${i * 60}ms`,
              }}
            />
          ))}
        </div>
      }
    />
  );
}
