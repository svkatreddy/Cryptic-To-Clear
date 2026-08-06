"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPassword from "./ForgotPassword";
import GuestButton from "./GuestButton";
import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal } from "lucide-react";

export default function AuthModal() {
  const { isAuthModalOpen, authModalTab, closeAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">(authModalTab);

  useEffect(() => {
    setActiveTab(authModalTab);
  }, [authModalTab]);

  if (!isAuthModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="fixed inset-0 bg-black/50 backdrop-blur-md"
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md rounded-2xl glass-strong border border-[var(--border-strong)] shadow-2xl p-6 sm:p-8 z-10 editor-grid overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="blob h-[200px] w-[200px] bg-[var(--syn-keyword)] -top-20 -left-20" />
          <div className="blob h-[200px] w-[200px] bg-[var(--syn-function)] -bottom-20 -right-20" />

          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] mb-3 shadow-[0_0_20px_rgba(184,146,255,0.3)]">
              <Terminal className="h-5 w-5 text-[#0a0d13]" strokeWidth={2.5} />
            </div>
            <h2 className="font-display text-xl font-semibold text-[var(--ink)] tracking-tight">
              {activeTab === "login" && "Welcome Back"}
              {activeTab === "register" && "Create Your Account"}
              {activeTab === "forgot" && "Account Recovery"}
            </h2>
            <p className="text-xs text-[var(--ink-dim)] mt-1 font-medium">
              Cryptic to Clear • Smart AI Compiler Platform
            </p>
          </div>

          {/* Form container */}
          <div className="relative z-10">
            {activeTab === "login" && <LoginForm onSwitchTab={(tab) => setActiveTab(tab)} />}
            {activeTab === "register" && <RegisterForm onSwitchTab={() => setActiveTab("login")} />}
            {activeTab === "forgot" && <ForgotPassword onSwitchTab={() => setActiveTab("login")} />}
          </div>

          {/* Guest Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <GuestButton />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
