"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, AlertCircle, CheckSquare, Square, Sparkles, GraduationCap } from "lucide-react";

interface FacultyLoginFormProps {
  onSwitchTab: (tab: "register" | "forgot") => void;
}

export default function FacultyLoginForm({ onSwitchTab }: FacultyLoginFormProps) {
  const { login, loginAsFacultyDemo, closeAuthModal } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your institutional email and password.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        closeAuthModal();
        router.push("/faculty");
      } else {
        setError(res.message || "Failed to authenticate faculty credentials.");
      }
    } catch {
      setError("An unexpected error occurred during faculty sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleTryFacultyDemo = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      const res = await loginAsFacultyDemo();
      if (res.success) {
        closeAuthModal();
        router.push("/faculty");
      } else {
        setError(res.message || "Failed to initialize Faculty Demo Mode.");
      }
    } catch {
      setError("An error occurred while loading Faculty Demo.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
        <span>Institutional Faculty & Department Admin Portal</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="faculty-email" className="block text-xs font-mono text-[var(--ink-dim)] mb-1.5">Institutional Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)] pointer-events-none" />
          <input
            id="faculty-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="professor@institution.edu"
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:border-[var(--syn-keyword)] transition-colors font-mono"
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="faculty-password" className="block text-xs font-mono text-[var(--ink-dim)]">Password</label>
          <button
            type="button"
            onClick={() => onSwitchTab("forgot")}
            className="text-xs font-mono text-[var(--syn-keyword)] hover:underline cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)] pointer-events-none" />
          <input
            id="faculty-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:border-[var(--syn-keyword)] transition-colors font-mono"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-dim)]">
        <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setRememberMe(!rememberMe)}>
          {rememberMe ? (
            <CheckSquare className="w-4 h-4 text-[var(--syn-keyword)]" />
          ) : (
            <Square className="w-4 h-4 text-[var(--ink-faint)]" />
          )}
          <span>Remember Me</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || demoLoading}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-xs font-mono font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(184,146,255,0.25)] disabled:opacity-50 cursor-pointer"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In to Faculty Portal"}
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
          <span className="bg-[var(--panel)] px-2 text-[var(--ink-faint)]">Instant Faculty Preview</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleTryFacultyDemo}
        disabled={loading || demoLoading}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-xs font-mono font-medium text-[var(--syn-keyword)] glass border border-[var(--syn-keyword)]/30 hover:bg-[var(--syn-keyword)]/10 transition-all cursor-pointer shadow-[0_0_15px_rgba(184,146,255,0.15)] disabled:opacity-50"
      >
        {demoLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-[var(--syn-keyword)]" />
            <span>Try Faculty Demo (No Account Required)</span>
          </>
        )}
      </button>

      <p className="text-center text-xs font-mono text-[var(--ink-dim)] mt-3">
        Need an institutional account?{" "}
        <button
          type="button"
          onClick={() => onSwitchTab("register")}
          className="text-[var(--syn-keyword)] hover:underline font-semibold cursor-pointer"
        >
          Contact Institution Admin
        </button>
      </p>
    </form>
  );
}
