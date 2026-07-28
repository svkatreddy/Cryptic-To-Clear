import Link from "next/link";
import { Terminal, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-5">
      <div className="glass-strong rounded-xl p-8 max-w-md w-full text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)]">
          <Terminal className="h-6 w-6 text-[#0a0d13]" />
        </div>
        <p className="font-mono text-[13px] text-[var(--syn-const)] mb-2">404</p>
        <h1 className="font-display text-lg font-semibold text-[var(--ink)] mb-2">
          Page not found
        </h1>
        <p className="text-[13px] text-[var(--ink-dim)] leading-relaxed mb-6">
          This route doesn&apos;t compile — the page you&apos;re looking for
          doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110 transition-all"
        >
          <Home className="h-3.5 w-3.5" />
          Go home
        </Link>
      </div>
    </main>
  );
}
