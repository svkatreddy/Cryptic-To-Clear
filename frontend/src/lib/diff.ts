import { diffLines } from "diff";

export type DiffLineType = "context" | "added" | "removed";

export interface DiffLine {
  type: DiffLineType;
  oldLineNo: number | null;
  newLineNo: number | null;
  content: string;
}

/**
 * Computes a GitHub-style unified line diff between two source strings.
 */
export function computeUnifiedDiff(oldCode: string, newCode: string): DiffLine[] {
  const changes = diffLines(oldCode ?? "", newCode ?? "");
  const result: DiffLine[] = [];
  let oldLineNo = 1;
  let newLineNo = 1;

  for (const part of changes) {
    const lines = part.value.split("\n");
    // A trailing newline produces one empty string element — drop it so we
    // don't render a phantom blank line at the end of every hunk.
    if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

    for (const content of lines) {
      if (part.added) {
        result.push({ type: "added", oldLineNo: null, newLineNo, content });
        newLineNo++;
      } else if (part.removed) {
        result.push({ type: "removed", oldLineNo, newLineNo: null, content });
        oldLineNo++;
      } else {
        result.push({ type: "context", oldLineNo, newLineNo, content });
        oldLineNo++;
        newLineNo++;
      }
    }
  }

  return result;
}

/** Line numbers (in the *new* code) that were added or changed vs. the old code. */
export function changedLineNumbers(oldCode: string, newCode: string): number[] {
  return computeUnifiedDiff(oldCode, newCode)
    .filter((line): line is DiffLine & { newLineNo: number } =>
      line.type === "added" && line.newLineNo !== null
    )
    .map((line) => line.newLineNo);
}
