"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function CompilerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Compiler page error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-5">
      <div className="glass-strong rounded-xl p-8 max-w-md w-full text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--syn-const)]/15">
          <AlertTriangle className="h-6 w-6 text-[var(--syn-const)]" />
        </div>
        <h1 className="font-display text-lg font-semibold text-[var(--ink)] mb-2">
          The compiler hit a snag
        </h1>
        <p className="text-[13px] text-[var(--ink-dim)] leading-relaxed mb-6">
          Your code is safe — it&apos;s auto-saved in this browser. Try
          reloading the workspace below.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reload workspace
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium glass hover:border-[var(--border-strong)] transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
