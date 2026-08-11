"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2, Sparkles, LogIn } from "lucide-react";

export default function FacultyProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, openAuthModal, loginAsFacultyDemo } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Prompt faculty login modal
      openAuthModal("faculty");
    }
  }, [loading, user, openAuthModal]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[var(--syn-keyword)] animate-spin" />
          <p className="text-sm font-mono text-[var(--ink-dim)]">Verifying institutional credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "faculty" && user.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6 text-[var(--ink)]">
        <div className="max-w-md w-full glass-strong border border-[var(--border-strong)] rounded-2xl p-8 text-center shadow-2xl space-y-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold tracking-tight">Faculty Portal Restricted</h2>
            <p className="text-xs text-[var(--ink-dim)] mt-2 leading-relaxed font-sans">
              You are currently signed in as a Student or Guest. Institutional analytics and student monitoring require a Faculty or Administrator account.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={async () => {
                const res = await loginAsFacultyDemo();
                if (res.success) {
                  router.push("/faculty");
                }
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-mono font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(184,146,255,0.25)] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Enter as Demo Faculty Account</span>
            </button>

            <button
              onClick={() => openAuthModal("faculty")}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-mono text-[var(--ink)] glass border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[var(--syn-keyword)]" />
              <span>Sign In with Faculty Account</span>
            </button>

            <button
              onClick={() => router.push("/")}
              className="text-xs font-mono text-[var(--ink-faint)] hover:text-[var(--ink-dim)] hover:underline pt-2 block mx-auto cursor-pointer"
            >
              Back to Student Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
