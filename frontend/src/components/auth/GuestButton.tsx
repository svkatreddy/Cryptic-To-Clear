"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface GuestButtonProps {
  className?: string;
  redirectToCompiler?: boolean;
}

export default function GuestButton({ className = "", redirectToCompiler = true }: GuestButtonProps) {
  const { continueAsGuest } = useAuth();
  const router = useRouter();

  const handleGuestClick = () => {
    continueAsGuest();
    if (redirectToCompiler) {
      router.push("/compiler");
    }
  };

  return (
    <button
      type="button"
      onClick={handleGuestClick}
      className={`group w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-mono font-medium text-[var(--ink-dim)] glass hover:text-[var(--ink)] hover:bg-white/[0.06] border border-white/10 transition-all cursor-pointer ${className}`}
    >
      <UserCheck className="w-3.5 h-3.5 text-[var(--syn-function)]" />
      <span>Continue as Guest</span>
      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}
