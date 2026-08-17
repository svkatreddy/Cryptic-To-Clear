import type { AIExplanation } from "./api";

export function formatExplanationMarkdown(explanation: AIExplanation, language: string): string {
  return [
    `# AI Explanation — ${language}`,
    "",
    `## Error Summary`,
    explanation.errorSummary,
    "",
    `## Reason`,
    explanation.reason,
    "",
    `## Error Line`,
    explanation.errorLine,
    "",
    `## Simple Explanation`,
    explanation.simpleExplanation,
    "",
    `## How to Fix`,
    explanation.howToFix,
    "",
    `## Correct Code`,
    "```" + language.toLowerCase(),
    explanation.correctCode,
    "```",
    "",
    `## Common Mistakes`,
    ...explanation.commonMistakes.map((m) => `- ${m}`),
    "",
    `## Best Practices`,
    ...explanation.bestPractices.map((m) => `- ${m}`),
    "",
    `## Optimization Tips`,
    ...explanation.optimizationTips.map((m) => `- ${m}`),
    "",
  ].join("\n");
}

export interface ExecutionReportInput {
  language: string;
  sourceCode: string;
  stdin: string;
  output: string;
  errors: string;
  executionTime: string;
  memoryUsage: string;
  status: string;
}

export function formatExecutionReport(report: ExecutionReportInput): string {
  return [
    `Execution Report`,
    `Generated: ${new Date().toLocaleString()}`,
    `Language: ${report.language}`,
    `Status: ${report.status}`,
    `Execution Time: ${report.executionTime}`,
    `Memory Usage: ${report.memoryUsage}`,
    "",
    "----- Source Code -----",
    report.sourceCode,
    "",
    "----- Input -----",
    report.stdin || "(none)",
    "",
    "----- Output -----",
    report.output || "(none)",
    "",
    "----- Errors -----",
    report.errors || "(none)",
    "",
  ].join("\n");
}

export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Opens the browser's print dialog for arbitrary plain-text content,
 * formatted as a simple monospace document, without navigating away from
 * the app. Uses a throwaway iframe rather than window.open so it isn't
 * blocked by popup blockers.
 */
export function printPlainText(title: string, content: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; padding: 24px; white-space: pre-wrap; word-break: break-word; color: #111; }
          h1 { font-size: 14px; margin: 0 0 16px; font-family: sans-serif; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <pre>${escapeHtml(content)}</pre>
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 250);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Exports plain text content as a simple paginated PDF via jsPDF, loaded
 * dynamically so it never ends up in the initial bundle.
 */
export async function exportTextAsPdf(title: string, content: string, filename: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, margin, margin);

  doc.setFont("courier", "normal");
  doc.setFontSize(9);

  const lines = doc.splitTextToSize(content, maxWidth) as string[];
  let y = margin + 24;
  const lineHeight = 12;

  for (const line of lines) {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  doc.save(filename);
}

export interface ShareState {
  language: string;
  sourceCode: string;
}

/**
 * Encodes {language, sourceCode} into a URL-safe base64 string for the
 * "Share Link" feature. There's no backend datastore for shares, so the
 * whole snippet round-trips through the URL itself — reliable with no
 * server persistence needed, at the cost of longer URLs for larger files.
 */
export function encodeShareState(state: ShareState): string {
  const json = JSON.stringify(state);
  const utf8 = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  return btoa(utf8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShareState(encoded: string): ShareState | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const utf8 = atob(base64);
    const json = decodeURIComponent(
      utf8
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    const parsed = JSON.parse(json);
    if (typeof parsed?.language === "string" && typeof parsed?.sourceCode === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildShareUrl(state: ShareState): string {
  const encoded = encodeShareState(state);
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("share", encoded);
  return url.toString();
}

/**
 * Merges stdout and stdin lines side-by-side with prompt text (e.g., "Enter your name: sai"),
 * matching how an interactive terminal shell displays input right next to print statements.
 */
export function interleaveInputWithOutput(rawOutput: string, stdinText: string): string {
  if (!stdinText || !stdinText.trim()) {
    return rawOutput || "";
  }

  const inputLines = stdinText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (inputLines.length === 0) {
    return rawOutput || "";
  }

  let text = (rawOutput || "").trimEnd();

  // Strip any existing prefixed "> input" lines if auto-echoed previously
  inputLines.forEach((val) => {
    const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`^>\\s*${escaped}\\r?\\n?`, "gm"), "");
  });

  const lines = text.split("\n");
  const inputsToAssign = [...inputLines];
  const resultLines: string[] = [];

  const isPromptHeader = (str: string) => {
    const s = str.trim();
    if (!s) return false;
    if (/[:?=>$]$/.test(s)) return true;
    if (/^(enter|input|type|please|what|how|select|choose)\b/i.test(s)) return true;
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (inputsToAssign.length === 0) {
      resultLines.push(line);
      continue;
    }

    // Check 1: Prompt line ending with colon/question mark with no text or only whitespace after it
    // e.g. "Enter your name:", "Enter your age: "
    const promptColonMatch = line.match(/^(.+?[:?=>$])\s*$/);
    if (promptColonMatch && isPromptHeader(promptColonMatch[1])) {
      const inputVal = inputsToAssign.shift()!;
      const promptStr = promptColonMatch[1].endsWith(" ")
        ? promptColonMatch[1]
        : promptColonMatch[1] + " ";
      resultLines.push(`${promptStr}${inputVal}`);
      continue;
    }

    // Check 2: Prompt line with text after colon/question mark (due to lack of newline before next print)
    // e.g. "Enter a number: You entered 42" -> Split into "Enter a number: 42" and "You entered 42"
    const embeddedPromptMatch = line.match(/^(.+?[:?=>$])\s+(\S+.*)$/);
    if (embeddedPromptMatch && isPromptHeader(embeddedPromptMatch[1])) {
      const inputVal = inputsToAssign.shift()!;
      const promptStr = embeddedPromptMatch[1].endsWith(" ")
        ? embeddedPromptMatch[1]
        : embeddedPromptMatch[1] + " ";
      const restText = embeddedPromptMatch[2];
      resultLines.push(`${promptStr}${inputVal}`);
      resultLines.push(restText);
      continue;
    }

    // Check 3: Line starting with prompt keywords without explicit colon (e.g. "Enter your name")
    if (isPromptHeader(line) && !line.includes(":")) {
      const inputVal = inputsToAssign.shift()!;
      resultLines.push(`${line}: ${inputVal}`);
      continue;
    }

    resultLines.push(line);
  }

  return resultLines.join("\n");
}
