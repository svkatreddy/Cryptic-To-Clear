"use client";

import React, { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import GuestButton from "./GuestButton";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPlan?: "pro" | "team" | "enterprise";
  fallback?: ReactNode;
}

export default function ProtectedRoute({ children, requiredPlan, fallback }: ProtectedRouteProps) {
  const { user, isGuest, openAuthModal } = useAuth();

  if (isGuest || !user) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center glass rounded-2xl border border-white/10 max-w-md mx-auto my-12 space-y-4">
        <h3 className="text-lg font-semibold text-[var(--ink)]">Sign in to Access Feature</h3>
        <p className="text-xs text-[var(--ink-dim)] font-mono">
          Create a free account or log in to sync project history, save snippets, and access cloud features.
        </p>

        <div className="w-full space-y-2 pt-2">
          <button
            onClick={() => openAuthModal("register")}
            className="w-full py-2.5 px-4 text-xs font-mono font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] rounded-lg hover:brightness-110 transition-all cursor-pointer"
          >
            Create Free Account
          </button>
          <button
            onClick={() => openAuthModal("login")}
            className="w-full py-2.5 px-4 text-xs font-mono font-medium text-[var(--ink)] glass rounded-lg hover:bg-white/[0.08] transition-all cursor-pointer"
          >
            Sign In
          </button>
          <div className="pt-2">
            <GuestButton redirectToCompiler={false} />
          </div>
        </div>
      </div>
    );
  }

  if (requiredPlan && user.plan !== requiredPlan && user.plan !== "enterprise") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center glass rounded-2xl border border-white/10 max-w-md mx-auto my-12 space-y-4">
        <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold border border-purple-500/30">
          PRO FEATURE
        </span>
        <h3 className="text-lg font-semibold text-[var(--ink)]">Upgrade Required</h3>
        <p className="text-xs text-[var(--ink-dim)] font-mono">
          This feature requires a {requiredPlan.toUpperCase()} subscription. Upgrade your plan to unlock unlimited access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
