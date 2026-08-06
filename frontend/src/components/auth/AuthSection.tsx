"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPassword from "./ForgotPassword";
import GuestButton from "./GuestButton";
import { Terminal, Shield, Check, Zap, Sparkles } from "lucide-react";

export default function AuthSection() {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">("login");

  return (
    <section className="relative py-20 px-5 sm:px-8 border-t border-white/5 overflow-hidden editor-grid">
      {/* Background ambient lighting */}
      <div className="blob h-[350px] w-[350px] bg-[var(--syn-keyword)] top-1/4 -left-32 opacity-20" />
      <div className="blob h-[350px] w-[350px] bg-[var(--syn-function)] bottom-1/4 -right-32 opacity-20" />

      <div className="relative mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-4 font-mono text-[12px] text-[var(--syn-keyword)] border border-[var(--syn-keyword)]/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Authentication & Account Ready</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl sm:text-4xl font-semibold tracking-tight"
          >
            Join <span className="text-gradient">Cryptic to Clear</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-sm sm:text-base text-[var(--ink-dim)] font-medium"
          >
            Sign in to access your developer profile and saved snippets, or jump straight into the compiler as a guest without creating an account.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          {/* Left Column: Guest Capability vs Account Perks Matrix */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="glass-strong p-6 sm:p-8 rounded-2xl border border-white/10 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--syn-keyword)] to-[var(--syn-function)] flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-[#0a0d13]" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-[var(--ink)]">Developer Access</h3>
                  <p className="text-xs font-mono text-[var(--ink-dim)]">Scalable Subscription Ready Architecture</p>
                </div>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-[var(--syn-string)] font-bold uppercase tracking-wider text-[11px]">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Instant Guest Access (Default)</span>
                  </div>
                  <ul className="pl-6 space-y-1 text-[var(--ink-dim)] list-disc">
                    <li>Write & edit multi-language code</li>
                    <li>Compile & run programs instantly</li>
                    <li>View AI error explanations</li>
                    <li>Access Visual Debugger & Learning Mode</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-[var(--syn-keyword)] font-bold uppercase tracking-wider text-[11px]">
                    <Zap className="w-4 h-4 text-[var(--syn-keyword)]" />
                    <span>Free Account Perks</span>
                  </div>
                  <ul className="pl-6 space-y-1 text-[var(--ink-dim)] list-disc">
                    <li>Save project snippets & cloud sync</li>
                    <li>Keep historical execution logs</li>
                    <li>Save customized editor preferences</li>
                    <li>Prepared for Pro & Team subscription tiers</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <GuestButton redirectToCompiler={true} />
              </div>
            </div>
          </motion.div>

          {/* Right Column: Glassmorphic Interactive Auth Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-6"
          >
            <div className="glass-strong p-6 sm:p-8 rounded-2xl border border-[var(--border-strong)] shadow-2xl relative">
              {/* Tab Selector */}
              <div className="flex items-center justify-between p-1 bg-[var(--bg)] rounded-xl border border-[var(--border)] mb-6 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === "login"
                      ? "bg-gradient-to-r from-[var(--syn-keyword)] to-[var(--syn-function)] text-[#0a0d13] font-bold shadow-md"
                      : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === "register"
                      ? "bg-gradient-to-r from-[var(--syn-keyword)] to-[var(--syn-function)] text-[#0a0d13] font-bold shadow-md"
                      : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Form Content with Framer Motion transitions */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "login" && <LoginForm onSwitchTab={(tab) => setActiveTab(tab)} />}
                  {activeTab === "register" && <RegisterForm onSwitchTab={() => setActiveTab("login")} />}
                  {activeTab === "forgot" && <ForgotPassword onSwitchTab={() => setActiveTab("login")} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
