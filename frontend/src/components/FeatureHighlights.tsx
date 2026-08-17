"use client";

import { motion } from "framer-motion";
import { Zap, BrainCircuit, Bug } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    accent: "var(--syn-string)",
    title: "Instant execution",
    desc: "Run code the moment you stop typing — no queue, no cold starts, no waiting on a spinner.",
  },
  {
    icon: BrainCircuit,
    accent: "var(--syn-keyword)",
    title: "AI that explains errors",
    desc: "Every stack trace gets a plain-English breakdown of what broke and exactly how to fix it.",
  },
  {
    icon: Bug,
    accent: "var(--syn-function)",
    title: "Debug in context",
    desc: "Cryptic to Clear points at the line, the variable, and the fix — not just the error message.",
  },
];

export default function FeatureHighlights() {
  return (
    <section id="features-preview" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.03, y: -4 }}
          className="text-center max-w-2xl mx-auto mb-14 p-6 sm:p-8 rounded-2xl glass-strong border border-white/10 hover:border-[var(--syn-keyword)]/60 hover:bg-white/[0.08] hover:shadow-[0_0_50px_rgba(184,146,255,0.35)] hover:brightness-125 transition-all duration-300 group cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[12px] text-[var(--syn-function)] bg-[var(--syn-function)]/10 border border-[var(--syn-function)]/20 mb-3 group-hover:border-[var(--syn-function)]/50 group-hover:shadow-[0_0_15px_rgba(108,182,255,0.3)] transition-all">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--syn-function)] animate-pulse" />

          </span>
          <h2 className="font-elaborate-heading text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight group-hover:text-gradient transition-all">
            Built for the moment code breaks
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ scale: 1.06, y: -8 }}
              className="glass rounded-xl p-6 border border-white/10 hover:border-[var(--syn-keyword)]/70 hover:bg-white/[0.1] hover:shadow-[0_25px_50px_rgba(184,146,255,0.35)] hover:brightness-125 transition-all duration-300 group cursor-pointer"
            >
              <div
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl mb-5 group-hover:scale-125 group-hover:rotate-6 group-hover:brightness-125 transition-all duration-300 shadow-md"
                style={{ background: `${f.accent}25` }}
              >
                <f.icon className="h-5.5 w-5.5 group-hover:scale-110 transition-transform duration-300" style={{ color: f.accent }} />
              </div>
              <h3 className="font-elaborate-heading text-lg font-bold mb-2 group-hover:text-[var(--syn-keyword)] transition-colors">
                {f.title}
              </h3>
              <p className="font-elaborate-sub text-sm text-[var(--ink-dim)] leading-relaxed group-hover:text-[var(--ink)] transition-colors">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
