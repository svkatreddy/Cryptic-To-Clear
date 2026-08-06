"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import OAuthButtons from "./OAuthButtons";
import { Mail, Lock, Loader2, AlertCircle, CheckSquare, Square } from "lucide-react";

interface LoginFormProps {
  onSwitchTab: (tab: "register" | "forgot") => void;
}

export default function LoginForm({ onSwitchTab }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.message || "Failed to sign in.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("demo@cryptictoclear.io");
    setPassword("Password123!");
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-mono text-[var(--ink-dim)] mb-1.5">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="developer@example.com"
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:border-[var(--syn-keyword)] transition-colors font-mono"
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-mono text-[var(--ink-dim)]">Password</label>
          <button
            type="button"
            onClick={() => onSwitchTab("forgot")}
            className="text-xs font-mono text-[var(--syn-keyword)] hover:underline cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)]" />
          <input
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

        <button
          type="button"
          onClick={handleFillDemo}
          className="text-[11px] text-[var(--syn-string)] hover:underline font-mono"
        >
          Use Demo Account
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-xs font-mono font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(108,182,255,0.2)] disabled:opacity-50 cursor-pointer"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
          <span className="bg-[var(--panel)] px-2 text-[var(--ink-faint)]">Or continue with</span>
        </div>
      </div>

      <OAuthButtons />

      <p className="text-center text-xs font-mono text-[var(--ink-dim)] mt-4">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitchTab("register")}
          className="text-[var(--syn-keyword)] hover:underline font-semibold cursor-pointer"
        >
          Create Account
        </button>
      </p>
    </form>
  );
}
