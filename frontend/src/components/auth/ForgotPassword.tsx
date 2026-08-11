"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Mail, Loader2, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";

interface ForgotPasswordProps {
  onSwitchTab: (tab: "login") => void;
}

export default function ForgotPassword({ onSwitchTab }: ForgotPasswordProps) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string; demoNote?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await forgotPassword(email);
      setStatus(res);
    } catch {
      setStatus({ success: false, message: "Could not request password reset." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--ink)]">Reset your password</h3>
        <p className="text-xs text-[var(--ink-dim)] mt-1 font-mono">
          Enter your email address and we will send you password reset instructions.
        </p>
      </div>

      {status && (
        <div
          className={`p-3 rounded-lg border text-xs font-mono flex flex-col gap-1 ${
            status.success
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {status.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{status.message}</span>
          </div>
          {status.demoNote && <p className="text-[11px] text-[var(--syn-string)] mt-1">{status.demoNote}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="forgot-email" className="block text-xs font-mono text-[var(--ink-dim)] mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)] pointer-events-none" />
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@example.com"
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:border-[var(--syn-keyword)] transition-colors font-mono"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-xs font-mono font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(108,182,255,0.2)] disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Instructions"}
        </button>
      </form>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => onSwitchTab("login")}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--ink-dim)] hover:text-[var(--ink)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>
      </div>
    </div>
  );
}
