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
  /** Prevent copying, cutting, pasting, and context menu during assignment mode (Item 7) */
  disableCopyPaste?: boolean;
}

export default function CodeEditor({
  language,
  value,
  onChange,
  settings,
  highlightLines,
  currentLine,
  disableCopyPaste = false,
}: CodeEditorProps) {
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const decorationsRef = useRef<DecorationsCollection | null>(null);
  const debugDecorationsRef = useRef<DecorationsCollection | null>(null);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.updateOptions({
      tabSize: 2,
      glyphMargin: true,
      matchBrackets: settings.bracketMatching ? "always" : "never",
      bracketPairColorization: { enabled: settings.bracketMatching },
      autoClosingBrackets: settings.bracketMatching ? "always" : "never",
      autoClosingQuotes: settings.bracketMatching ? "always" : "never",
    });
    editor.focus();
  };

  // Dynamically update Monaco options whenever settings change (Fixes Item 4)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.updateOptions({
      fontSize: settings.fontSize,
      wordWrap: settings.wordWrap ? "on" : "off",
      minimap: { enabled: settings.minimap },
      lineNumbers: settings.lineNumbers ? "on" : "off",
      matchBrackets: settings.bracketMatching ? "always" : "never",
      bracketPairColorization: { enabled: settings.bracketMatching },
      autoClosingBrackets: settings.bracketMatching ? "always" : "never",
      autoClosingQuotes: settings.bracketMatching ? "always" : "never",
    });
  }, [settings]);

  // Disable copy/cut/paste during Assignment mode (Item 7 requirement)
  useEffect(() => {
    if (!disableCopyPaste) return;

    const preventAction = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const container = document.getElementById("monaco-editor-container");
    if (container) {
      container.addEventListener("copy", preventAction, true);
      container.addEventListener("cut", preventAction, true);
      container.addEventListener("paste", preventAction, true);
      container.addEventListener("contextmenu", preventAction, true);
    }

    return () => {
      if (container) {
        container.removeEventListener("copy", preventAction, true);
        container.removeEventListener("cut", preventAction, true);
        container.removeEventListener("paste", preventAction, true);
        container.removeEventListener("contextmenu", preventAction, true);
      }
    };
  }, [disableCopyPaste]);

  // Apply/clear the "changed lines" decorations whenever the highlighted set changes
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

  // Visual Debugger: highlight current executing line
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
    <div id="monaco-editor-container" className="h-full w-full relative">
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
          autoClosingBrackets: settings.bracketMatching ? "languageDefined" : "never",
          autoClosingQuotes: settings.bracketMatching ? "languageDefined" : "never",
          autoSurround: settings.bracketMatching ? "languageDefined" : "never",
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

      {disableCopyPaste && (
        <div className="absolute top-2 right-4 z-20 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono select-none pointer-events-none shadow-md backdrop-blur-sm">
          🔒 Copy/Paste Disabled in Assignment Mode
        </div>
      )}
    </div>
  );
}
