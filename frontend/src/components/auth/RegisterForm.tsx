"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import OAuthButtons from "./OAuthButtons";
import { User as UserIcon, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

interface RegisterFormProps {
  onSwitchTab: (tab: "login") => void;
}

export default function RegisterForm({ onSwitchTab }: RegisterFormProps) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await register(name, email, password);
      if (!res.success) {
        setError(res.message || "Registration failed.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
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
        <label htmlFor="register-name" className="block text-xs font-mono text-[var(--ink-dim)] mb-1.5">Full Name</label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)] pointer-events-none" />
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:border-[var(--syn-keyword)] transition-colors font-mono"
          />
        </div>
      </div>

      <div>
        <label htmlFor="register-email" className="block text-xs font-mono text-[var(--ink-dim)] mb-1.5">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)] pointer-events-none" />
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ada@example.com"
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:border-[var(--syn-keyword)] transition-colors font-mono"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="register-password" className="block text-xs font-mono text-[var(--ink-dim)] mb-1.5">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)] pointer-events-none" />
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
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
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Free Account"}
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
          <span className="bg-[var(--panel)] px-2 text-[var(--ink-faint)]">Or register with</span>
        </div>
      </div>

      <OAuthButtons />

      <p className="text-center text-xs font-mono text-[var(--ink-dim)] mt-4">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitchTab("login")}
          className="text-[var(--syn-keyword)] hover:underline font-semibold cursor-pointer"
        >
          Sign In
        </button>
      </p>
    </form>
  );
}
